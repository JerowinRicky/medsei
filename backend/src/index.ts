import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import hmsRoutes from "./routes/hmsRoutes.js";
import mockHmsRoutes from "./routes/mockHmsRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and middleware configuration
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(morgan("dev"));

// Attach unique Request ID to every transaction
app.use((req: any, _res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  next();
});

// Health check endpoints
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
    service: "Medsei Clinical API Service",
    version: "1.0.0"
  });
});

app.get("/health/database", async (_req: Request, res: Response) => {
  try {
    const { prisma } = await import("./prisma/client.js");
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "HEALTHY", database: "PostgreSQL 18" });
  } catch (err: any) {
    res.status(503).json({ status: "DEGRADED", error: err.message });
  }
});

// Mount modular API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/hms", hmsRoutes);
app.use("/api/v1/mock-hms", mockHmsRoutes);
app.use("/api/v1/summaries", summaryRoutes);
app.use("/api/v1", adminRoutes);

// Centralized Error Handling Middleware
app.use((err: any, req: any, res: Response, _next: NextFunction) => {
  console.error(`[Error] RequestId: ${req.requestId} -`, err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected clinical system error occurred"
    },
    requestId: req.requestId
  });
});

app.listen(PORT, () => {
  console.log(`Medsei Clinical Platform API Server running on port ${PORT}`);
  console.log(`Endpoints available at http://localhost:${PORT}/api/v1`);
});

