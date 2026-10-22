import { prisma } from "../prisma/client.js";

export interface AuditLogParams {
  organizationId: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  taskId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        userEmail: params.userEmail,
        userRole: params.userRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        taskId: params.taskId,
        ipAddress: params.ipAddress || "127.0.0.1",
        userAgent: params.userAgent || "Medsei API Client",
        oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
        newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
        reason: params.reason
      }
    });
  } catch (err) {
    console.error("Failed to write tamper-evident audit log:", err);
  }
}

