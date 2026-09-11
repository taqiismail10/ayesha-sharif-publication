import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "asp_admin_session";
export type AdminRole = "super_admin" | "admin" | "editor" | "order_manager";

export type CurrentAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

function apiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "");
}

async function adminApi(path: string, init: RequestInit = {}) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (token) headers.set("cookie", `${ADMIN_SESSION_COOKIE}=${token}`);
  return fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  try {
    const response = await adminApi("/admin/auth/me");
    if (!response.ok) return null;
    const data = (await response.json()) as { admin?: CurrentAdmin | null };
    return data.admin || null;
  } catch {
    return null;
  }
}

export async function requireAdmin(allowedRoles?: AdminRole[]) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (allowedRoles?.length && !allowedRoles.includes(admin.role)) {
    redirect("/admin/unauthorized");
  }
  return admin;
}

export async function assertAdminRole(allowedRoles?: AdminRole[]) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized admin access.");
  if (allowedRoles?.length && !allowedRoles.includes(admin.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return admin;
}
