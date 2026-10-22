import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  roleId: string;
  roleCode: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing or invalid authorization header" },
      requestId: req.requestId
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "medsei_super_secure_jwt_secret_token_2026_enterprise_hospital_key") as any;
    
    // Fetch full user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!user || user.status !== "ACTIVE") {
      res.status(401).json({
        success: false,
        error: { code: "ACCOUNT_INACTIVE", message: "User account is inactive or not found" },
        requestId: req.requestId
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
      roleCode: user.role.code,
      permissions: user.role.rolePermissions.map(rp => rp.permission.code)
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Session expired or invalid token" },
      requestId: req.requestId
    });
  }
};

export const requirePermission = (permissionCode: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
        requestId: req.requestId
      });
      return;
    }

    // Super Admin has universal access
    if (req.user.roleCode === "SUPER_ADMIN" || req.user.permissions.includes(permissionCode)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: `Required permission '${permissionCode}' denied` },
      requestId: req.requestId
    });
  };
};

