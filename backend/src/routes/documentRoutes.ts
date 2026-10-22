import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../prisma/client.js";
import { authenticate, requirePermission, AuthRequest } from "../middlewares/auth.js";
import { createAuditLog } from "../services/auditService.js";
import { DocumentAiService } from "../services/documentAiService.js";

const router = Router();

const uploadDir = path.resolve(process.env.STORAGE_DIR || "./storage");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.use(authenticate);

// List Document Types
router.get("/types", async (_req: AuthRequest, res: Response) => {
  try {
    const types = await prisma.documentType.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    });
    res.json({ success: true, data: types });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Create Document Type
router.post("/types", requirePermission("SYSTEM_CONFIGURE"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description, allowedExtensions, maxFileSizeMb, ocrRequired, aiExtractionRequired } = req.body;
    const docType = await prisma.documentType.create({
      data: {
        organizationId: req.user!.organizationId,
        name,
        code,
        description,
        allowedExtensions: allowedExtensions || "pdf,jpg,jpeg,png",
        maxFileSizeMb: maxFileSizeMb || 25,
        ocrRequired: ocrRequired !== undefined ? ocrRequired : true,
        aiExtractionRequired: aiExtractionRequired !== undefined ? aiExtractionRequired : true
      }
    });
    res.json({ success: true, data: docType });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Upload Document for Task
router.post("/upload", requirePermission("DOCUMENT_UPLOAD"), upload.single("file"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: { message: "No document file provided" } });
      return;
    }

    const { taskId, documentTypeId } = req.body;
    if (!taskId || !documentTypeId) {
      res.status(400).json({ success: false, error: { message: "taskId and documentTypeId are required" } });
      return;
    }

    const document = await prisma.document.create({
      data: {
        taskId,
        documentTypeId,
        fileName: file.filename,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey: file.path,
        checksum: `chk-${Date.now()}`,
        status: "UPLOADED",
        uploadedById: req.user!.id
      },
      include: { documentType: true }
    });

    await createAuditLog({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      action: "DOCUMENT_UPLOADED",
      entity: "Document",
      entityId: document.id,
      taskId
    });

    // Asynchronously trigger AI & OCR processing
    DocumentAiService.processDocument(document.id, file.path, file.originalname, taskId)
      .catch(e => console.error(`Async OCR failed for document ${document.id}:`, e));

    res.json({
      success: true,
      message: "Document uploaded and background OCR/AI extraction initiated",
      data: document
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Trigger Reprocess OCR/AI for Document
router.post("/:id/reprocess", requirePermission("DOCUMENT_UPLOAD"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
    });

    if (!document) {
      res.status(404).json({ success: false, error: { message: "Document not found" } });
      return;
    }

    DocumentAiService.processDocument(document.id, document.storageKey, document.originalFileName, document.taskId)
      .catch(e => console.error("Reprocess error:", e));

    res.json({ success: true, message: "Document reprocessing dispatched" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Download / View Document
router.get("/:id/download", requirePermission("DOCUMENT_VIEW"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id }
    });

    if (!document || !fs.existsSync(document.storageKey)) {
      res.status(404).json({ success: false, error: { message: "Document file not found on disk" } });
      return;
    }

    res.download(document.storageKey, document.originalFileName);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;

