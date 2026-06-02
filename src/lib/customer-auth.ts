import "server-only";

import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Customer, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CUSTOMER_SESSION_COOKIE = "asp_customer_session";
const CUSTOMER_SESSION_DAYS = 30;

const customerInclude = {
  profile: true,
  preferences: true
} satisfies Prisma.CustomerInclude;

export type CurrentCustomer = Prisma.CustomerGetPayload<{
  include: typeof customerInclude;
}>;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  return crypto
    .createHmac(
      "sha256",
      process.env.NEXTAUTH_SECRET || "development-only-change-this-secret"
    )
    .update(ip)
    .digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function requestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");
  return {
    userAgent: headerStore.get("user-agent"),
    ipHash: hashIp(forwardedFor?.split(",")[0]?.trim() || realIp)
  };
}

export async function createCustomerSession(customer: Pick<Customer, "id">) {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000
  );
  const metadata = await requestMetadata();

  await prisma.customerSession.create({
    data: {
      customerId: customer.id,
      tokenHash,
      expiresAt,
      userAgent: metadata.userAgent,
      ipHash: metadata.ipHash
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CUSTOMER_SESSION_DAYS * 24 * 60 * 60,
    path: "/"
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.customerSession.deleteMany({
      where: { tokenHash: hashToken(token) }
    });
  }
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      customer: {
        include: customerInclude
      }
    }
  });

  if (!session || session.expiresAt < new Date() || !session.customer.isActive) {
    await clearCustomerSession();
    return null;
  }

  return session.customer;
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");
  return customer;
}

export function isSafeAccountRedirect(value?: string | null) {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/admin");
}
