import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CUSTOMER_SESSION_COOKIE = "asp_customer_session";

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

async function cleanUpInvalidCustomerSession() {
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
    await cleanUpInvalidCustomerSession();
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
