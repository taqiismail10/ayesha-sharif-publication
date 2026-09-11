import "server-only";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Admin, AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/types";

export const ADMIN_SESSION_COOKIE = "asp_admin_session";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required in production.");
  }
  return secret || "development-only-change-this-secret";
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function verifyToken(token: string): AdminSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AdminSession;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(admin: Pick<Admin, "id" | "name" | "email" | "role">) {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = encode({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    exp: expiresAt
  });
  const token = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/"
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function readAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentAdmin() {
  const session = await readAdminSession();
  if (!session) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: session.id }
  });

  if (!admin?.isActive) return null;
  return admin;
}

export async function requireAdmin(allowedRoles?: AdminRole[]) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  if (allowedRoles?.length && !allowedRoles.includes(admin.role)) {
    redirect("/admin/unauthorized");
  }
  return admin;
}

export async function assertAdminRole(allowedRoles?: AdminRole[]) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("Unauthorized admin access.");
  }
  if (allowedRoles?.length && !allowedRoles.includes(admin.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return admin;
}
