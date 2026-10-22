import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { authenticate, AuthRequest } from "../middlewares/auth.js";
import { createAuditLog } from "../services/auditService.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        },
        organization: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
      });
      return;
    }

    if (user.status !== "ACTIVE") {
      res.status(403).json({
        success: false,
        error: { code: "ACCOUNT_LOCKED", message: "User account is suspended or locked" }
      });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // Increment failed login attempt
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } }
      });

      res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
      });
      return;
    }

    // Reset failed login attempts & update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organizationId },
      process.env.JWT_SECRET || "medsei_super_secure_jwt_secret_token_2026_enterprise_hospital_key",
      { expiresIn: "8h" }
    );

    const permissions = user.role.rolePermissions.map(rp => rp.permission.code);

    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role.name,
      action: "USER_LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          title: user.title,
          role: {
            id: user.role.id,
            name: user.role.name,
            code: user.role.code
          },
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            code: user.organization.code
          },
          permissions
        }
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: err.message || "Failed to authenticate" }
    });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        },
        organization: true
      }
    });

    if (!user) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        title: user.title,
        role: {
          id: user.role.id,
          name: user.role.name,
          code: user.role.code
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          code: user.organization.code
        },
        permissions: user.role.rolePermissions.map(rp => rp.permission.code)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

export default router;

