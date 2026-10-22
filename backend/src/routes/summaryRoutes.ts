import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authenticate, requirePermission, AuthRequest } from "../middlewares/auth.js";
import { createAuditLog } from "../services/auditService.js";
import { SummaryEngineService } from "../services/summaryEngineService.js";

const router = Router();

router.use(authenticate);

// 1. List Templates
router.get("/templates", requirePermission("TEMPLATE_VIEW"), async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.summaryTemplate.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: [{ code: "asc" }, { version: "desc" }],
      include: { projectType: true }
    });
    res.json({ success: true, data: templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 2. Create or Version Summary Template
router.post("/templates", requirePermission("TEMPLATE_CREATE"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description, projectTypeId, sections, headerHtml, footerHtml, status, createNewVersion } = req.body;

    let version = 1;
    if (createNewVersion) {
      const existing = await prisma.summaryTemplate.findFirst({
        where: { organizationId: req.user!.organizationId, code },
        orderBy: { version: "desc" }
      });
      if (existing) version = existing.version + 1;
    }

    const template = await prisma.summaryTemplate.create({
      data: {
        organizationId: req.user!.organizationId,
        projectTypeId,
        name,
        code,
        description,
        version,
        status: status || "APPROVED",
        sections,
        headerHtml,
        footerHtml
      }
    });

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: "TEMPLATE_CREATED",
      entity: "SummaryTemplate",
      entityId: template.id
    });

    res.json({ success: true, data: template });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 3. Generate Summary from Template
router.post("/generate", requirePermission("SUMMARY_GENERATE"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, templateId } = req.body;
    if (!taskId || !templateId) {
      res.status(400).json({ success: false, error: { message: "taskId and templateId are required" } });
      return;
    }

    const generated = await SummaryEngineService.generateSummary(taskId, templateId, req.user!.id);

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: "SUMMARY_GENERATED",
      entity: "GeneratedSummary",
      entityId: generated.id,
      taskId
    });

    res.json({ success: true, data: generated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 4. Update Draft Summary Content
router.put("/:id", requirePermission("SUMMARY_GENERATE"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contentHtml } = req.body;

    const existing = await prisma.generatedSummary.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: { message: "Summary not found" } });
      return;
    }

    if (existing.isImmutable) {
      res.status(403).json({
        success: false,
        error: { code: "IMMUTABLE_SUMMARY", message: "Approved clinical summary is immutable. Please create a new revision." }
      });
      return;
    }

    const updated = await prisma.generatedSummary.update({
      where: { id },
      data: { contentHtml }
    });

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: "SUMMARY_EDITED",
      entity: "GeneratedSummary",
      entityId: id,
      taskId: existing.taskId
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 5. Approve Summary (Enforces Clinical Immutability)
router.post("/:id/approve", requirePermission("SUMMARY_APPROVE"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { digitalSignatureRef } = req.body;

    const summary = await prisma.generatedSummary.findUnique({
      where: { id },
      include: { task: true }
    });

    if (!summary) {
      res.status(404).json({ success: false, error: { message: "Summary not found" } });
      return;
    }

    const approvedSummary = await prisma.generatedSummary.update({
      where: { id },
      data: {
        status: "APPROVED",
        isImmutable: true,
        approvedById: req.user!.id,
        approvedAt: new Date(),
        digitalSignatureRef: digitalSignatureRef || `SIG-${req.user!.id.slice(0, 8)}-${Date.now()}`
      }
    });

    // Update Task to APPROVED / COMPLETED
    await prisma.task.update({
      where: { id: summary.taskId },
      data: { status: "APPROVED" }
    });

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: "SUMMARY_APPROVED",
      entity: "GeneratedSummary",
      entityId: id,
      taskId: summary.taskId
    });

    res.json({ success: true, data: approvedSummary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;

