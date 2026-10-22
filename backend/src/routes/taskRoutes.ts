import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authenticate, requirePermission, AuthRequest } from "../middlewares/auth.js";
import { createAuditLog } from "../services/auditService.js";
import { HmsAdapterService } from "../services/hmsService.js";
import { DocumentAiService } from "../services/documentAiService.js";

const router = Router();

router.use(authenticate);

// 1. List Tasks with Pagination, Search & Filters
router.get("/", requirePermission("TASK_VIEW"), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || "1", 10);
    const pageSize = parseInt(req.query.pageSize as string || "10", 10);
    const status = req.query.status as string;
    const dataSource = req.query.dataSource as string;
    const search = req.query.search as string;

    const where: any = {
      organizationId: req.user!.organizationId
    };

    if (status) where.status = status;
    if (dataSource) where.dataSource = dataSource;
    if (search) {
      where.OR = [
        { taskNumber: { contains: search, mode: "insensitive" } },
        { patient: { fullName: { contains: search, mode: "insensitive" } } },
        { patient: { uhid: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          patient: true,
          encounter: true,
          project: true,
          projectType: true,
          assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          reviewerUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          documents: true,
          generatedSummaries: {
            orderBy: { revisionNumber: "desc" },
            take: 1
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 2. Get Single Task Details (Full 8-Tab inspection payload)
router.get("/:id", requirePermission("TASK_VIEW"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        patient: {
          include: { encounters: true }
        },
        encounter: true,
        project: true,
        projectType: {
          include: {
            projectDocumentTypes: {
              include: { documentType: true }
            }
          }
        },
        assignedUser: { select: { id: true, firstName: true, lastName: true, title: true, email: true } },
        reviewerUser: { select: { id: true, firstName: true, lastName: true, title: true, email: true } },
        documents: {
          include: { documentType: true, uploadedBy: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "asc" }
        },
        generatedSummaries: {
          orderBy: { revisionNumber: "desc" },
          include: { summaryTemplate: true, approvedBy: { select: { firstName: true, lastName: true } } }
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 50
        }
      }
    });

    if (!task) {
      res.status(404).json({ success: false, error: { message: "Task not found" } });
      return;
    }

    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 3. Create Task (Supporting 3 Data Sources: HMS, DOCUMENT, HMS_AND_DOCUMENT)
router.post("/", requirePermission("TASK_CREATE"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      projectTypeId,
      dataSource, // "HMS" | "DOCUMENT" | "HMS_AND_DOCUMENT"
      uhid, // if HMS or HMS_AND_DOCUMENT
      patientData, // if manual/doc
      assignedUserId,
      reviewerUserId
    } = req.body;

    if (!projectId || !projectTypeId || !dataSource) {
      res.status(400).json({ success: false, error: { message: "projectId, projectTypeId and dataSource are required" } });
      return;
    }

    let patientId: string | undefined;
    let encounterId: string | undefined;
    let unifiedClinicalData: any = null;

    // Handle Option 1 (HMS) or Option 3 (HMS_AND_DOCUMENT)
    if (dataSource === "HMS" || dataSource === "HMS_AND_DOCUMENT") {
      if (uhid) {
        // Fetch or create normalized patient record
        let existingPatient = await prisma.patient.findFirst({
          where: { organizationId: req.user!.organizationId, uhid },
          include: { encounters: true }
        });

        // Query HMS structured data
        let hmsRaw: any = null;
        try {
          hmsRaw = await HmsAdapterService.fetchPatientData(req.user!.organizationId, uhid);
        } catch (e) {
          console.warn("HMS fetch warning:", e);
        }

        if (!existingPatient && hmsRaw) {
          existingPatient = await prisma.patient.create({
            data: {
              organizationId: req.user!.organizationId,
              externalId: hmsRaw.patient_id,
              uhid: hmsRaw.uhid || uhid,
              firstName: hmsRaw.name?.split(" ")[0] || "Patient",
              lastName: hmsRaw.name?.split(" ").slice(1).join(" ") || "Record",
              fullName: hmsRaw.name || "Patient Record",
              dob: hmsRaw.dob ? new Date(hmsRaw.dob) : null,
              age: hmsRaw.age,
              gender: (hmsRaw.gender || "UNKNOWN").toUpperCase(),
              phone: hmsRaw.phone,
              address: hmsRaw.address,
              source: "HMS",
              encounters: {
                create: {
                  encounterNumber: hmsRaw.admission?.encounter_number || `ENC-${Date.now()}`,
                  admissionDate: hmsRaw.admission?.admission_date ? new Date(hmsRaw.admission.admission_date) : new Date(),
                  attendingDoctorName: hmsRaw.doctor?.name || "Attending Physician",
                  status: "ACTIVE"
                }
              }
            },
            include: { encounters: true }
          });
        }

        if (existingPatient) {
          patientId = existingPatient.id;
          encounterId = existingPatient.encounters[0]?.id;

          if (hmsRaw) {
            unifiedClinicalData = HmsAdapterService.normalizeHmsData(hmsRaw, []);
          }
        }
      }
    } else if (dataSource === "DOCUMENT") {
      // Option 2: Upload-only task (patient will be populated or extracted)
      if (patientData) {
        const newPat = await prisma.patient.create({
          data: {
            organizationId: req.user!.organizationId,
            uhid: patientData.uhid || `UHID-DOC-${Date.now().toString().slice(-6)}`,
            firstName: patientData.fullName?.split(" ")[0] || "Document",
            lastName: patientData.fullName?.split(" ").slice(1).join(" ") || "Patient",
            fullName: patientData.fullName || "Document Patient",
            age: patientData.age,
            gender: patientData.gender || "UNKNOWN",
            source: "DOCUMENT"
          }
        });
        patientId = newPat.id;
      }
    }

    const taskCount = await prisma.task.count();
    const taskNumber = `TSK-${new Date().getFullYear()}-${String(taskCount + 1).padStart(4, "0")}`;

    const task = await prisma.task.create({
      data: {
        organizationId: req.user!.organizationId,
        projectId,
        projectTypeId,
        patientId,
        encounterId,
        taskNumber,
        dataSource,
        status: dataSource === "HMS" ? "DATA_FETCHED" : "DRAFT",
        assignedUserId,
        reviewerUserId,
        createdById: req.user!.id,
        unifiedClinicalData
      },
      include: {
        patient: true,
        project: true,
        projectType: true
      }
    });

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: "TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      taskId: task.id,
      newValue: { taskNumber, dataSource, patientId }
    });

    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 4. Synchronize HMS Data for Task
router.post("/:id/sync-hms", requirePermission("TASK_EDIT"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { patient: true }
    });

    if (!task || !task.patient) {
      res.status(404).json({ success: false, error: { message: "Task or patient not found" } });
      return;
    }

    const rawData = await HmsAdapterService.fetchPatientData(req.user!.organizationId, task.patient.uhid);
    const normalized = HmsAdapterService.normalizeHmsData(rawData, []);

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        unifiedClinicalData: normalized as any,
        status: "DATA_FETCHED"
      }
    });

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: "HMS_DATA_FETCHED",
      entity: "Task",
      entityId: task.id,
      taskId: task.id
    });

    res.json({ success: true, data: updatedTask });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 5. Consolidate and Normalize Data (Precedence & Conflict Resolution)
router.post("/:id/consolidate", requirePermission("TASK_EDIT"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { documents: true }
    });

    if (!task) {
      res.status(404).json({ success: false, error: { message: "Task not found" } });
      return;
    }

    // Aggregate extracted fields from all completed documents
    const aggregatedAiFields: any = {};
    for (const doc of task.documents) {
      if (doc.extractedData && typeof doc.extractedData === "object") {
        Object.assign(aggregatedAiFields, doc.extractedData);
      }
    }

    const hmsData = task.unifiedClinicalData || {};
    const { merged, conflicts } = DocumentAiService.resolveClinicalPrecedence(hmsData, aggregatedAiFields, req.body.manualOverrides);

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        unifiedClinicalData: merged,
        conflictData: conflicts,
        status: conflicts.length > 0 ? "VALIDATION_REQUIRED" : "READY_FOR_REVIEW"
      }
    });

    res.json({
      success: true,
      data: {
        task: updated,
        conflicts,
        unifiedData: merged
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 6. Update Task Status
router.patch("/:id/status", requirePermission("TASK_EDIT"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, reason } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status }
    });

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: `TASK_STATUS_${status}`,
      entity: "Task",
      entityId: task.id,
      taskId: task.id,
      reason
    });

    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;

