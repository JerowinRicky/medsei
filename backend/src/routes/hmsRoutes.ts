import { Router, Response } from "express";
import { prisma } from "../prisma/client.js";
import { authenticate, requirePermission, AuthRequest } from "../middlewares/auth.js";
import { createAuditLog } from "../services/auditService.js";
import { HmsAdapterService } from "../services/hmsService.js";
import axios from "axios";

const router = Router();

router.use(authenticate);

// Get HMS Connections
router.get("/connections", requirePermission("HMS_VIEW"), async (req: AuthRequest, res: Response) => {
  try {
    const connections = await prisma.hmsConnection.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { endpoints: true, fieldMappings: true }
    });
    res.json({ success: true, data: connections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Update or Create HMS Connection
router.post("/connections", requirePermission("HMS_CONFIGURE"), async (req: AuthRequest, res: Response) => {
  try {
    const { id, hospitalName, hmsName, integrationType, baseUrl, authType, timeoutMs, retryCount, active } = req.body;

    let connection;
    if (id) {
      connection = await prisma.hmsConnection.update({
        where: { id },
        data: { hospitalName, hmsName, integrationType, baseUrl, authType, timeoutMs, retryCount, active }
      });
    } else {
      connection = await prisma.hmsConnection.create({
        data: {
          organizationId: req.user!.organizationId,
          hospitalName,
          hmsName,
          integrationType: integrationType || "REST",
          baseUrl,
          authType: authType || "BEARER",
          timeoutMs: timeoutMs || 15000,
          retryCount: retryCount || 3,
          active: active !== undefined ? active : true
        }
      });
    }

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: id ? "HMS_CONNECTION_UPDATED" : "HMS_CONNECTION_CREATED",
      entity: "HmsConnection",
      entityId: connection.id
    });

    res.json({ success: true, data: connection });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Test Connection
router.post("/connections/:id/test", requirePermission("HMS_TEST_CONNECTION"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const connection = await prisma.hmsConnection.findUnique({
      where: { id },
      include: { endpoints: true }
    });

    if (!connection) {
      res.status(404).json({ success: false, error: { message: "HMS Connection not found" } });
      return;
    }

    // Ping test URL
    const searchEp = connection.endpoints.find(e => e.endpointType === "PATIENT_SEARCH");
    const testUrl = `${connection.baseUrl.replace(/\/$/, "")}/${searchEp ? searchEp.path.replace(/^\//, "") : ""}?q=test`;

    const start = Date.now();
    await axios.get(testUrl, { timeout: 5000 });
    const latency = Date.now() - start;

    await prisma.hmsConnection.update({
      where: { id },
      data: { lastTestedAt: new Date(), lastTestStatus: "SUCCESS" }
    });

    res.json({
      success: true,
      message: `Connection established successfully (${latency}ms)`,
      data: { status: "SUCCESS", latencyMs: latency }
    });
  } catch (err: any) {
    await prisma.hmsConnection.update({
      where: { id: req.params.id },
      data: { lastTestedAt: new Date(), lastTestStatus: "FAILED" }
    });
    res.status(500).json({
      success: false,
      error: { code: "HMS_CONNECTION_FAILED", message: `Failed to connect to HMS: ${err.message}` }
    });
  }
});

// Search Patients via HMS Integration
router.get("/patients/search", requirePermission("PATIENT_SEARCH"), async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string || "";
    const patients = await HmsAdapterService.searchPatients(req.user!.organizationId, query);
    res.json({ success: true, data: patients });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Fetch structured Patient Data via HMS
router.get("/patients/:uhid/data", requirePermission("PATIENT_VIEW"), async (req: AuthRequest, res: Response) => {
  try {
    const { uhid } = req.params;
    const rawData = await HmsAdapterService.fetchPatientData(req.user!.organizationId, uhid);
    const normalized = HmsAdapterService.normalizeHmsData(rawData, []);
    res.json({
      success: true,
      data: {
        raw: rawData,
        normalized
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;

