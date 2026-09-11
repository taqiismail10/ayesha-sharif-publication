import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Inject, Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";

export const ADMIN_SESSION_COOKIE = "asp_admin_session";
const ADMIN_SESSION_DAYS = 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

@Injectable()
export class AdminAuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async login(email: string, password: string, res: Response) {
    const admin = await this.prisma.client.admin.findUnique({ where: { email } });
    const valid = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
    if (!admin?.isActive || !valid) return null;

    const token = randomToken();
    await this.prisma.client.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ADMIN_SESSION_DAYS * 86400000),
      },
    });
    this.setCookie(res, token);
    return this.safeAdmin(admin);
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[ADMIN_SESSION_COOKIE];
    if (token) {
      await this.prisma.client.adminSession.deleteMany({
        where: { tokenHash: hashToken(token) },
      });
    }
    this.clearCookie(res);
  }

  async resolveAdmin(req: Request) {
    const token = req.cookies?.[ADMIN_SESSION_COOKIE];
    if (!token || !this.prisma.isAvailable()) return null;
    const session = await this.prisma.client.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { admin: true },
    });
    if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
      if (session) {
        await this.prisma.client.adminSession.deleteMany({
          where: { tokenHash: hashToken(token) },
        });
      }
      return null;
    }
    await this.prisma.client.adminSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });
    return session.admin;
  }

  safeAdmin(admin: { id: string; name: string; email: string; role: string }) {
    return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
  }

  private setCookie(res: Response, token: string) {
    res.cookie(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ADMIN_SESSION_DAYS * 86400000,
      path: "/",
    });
  }

  private clearCookie(res: Response) {
    res.clearCookie(ADMIN_SESSION_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
}
