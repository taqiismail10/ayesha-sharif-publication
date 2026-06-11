import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma";
import { PrismaService } from "../prisma/prisma.service";
import {
  bangladeshPhonePattern,
  normalizeBangladeshPhone,
  normalizeEmail,
} from "../common/contracts/customer.schemas";

/** Same cookie name as the Next.js app — sessions are mutually valid. */
export const CUSTOMER_SESSION_COOKIE = "asp_customer_session";
const CUSTOMER_SESSION_DAYS = 30;

const customerInclude = {
  profile: true,
  preferences: true,
} satisfies Prisma.CustomerInclude;

export type CurrentCustomer = Prisma.CustomerGetPayload<{
  include: typeof customerInclude;
}>;

/** Public-safe customer summary — identical shape to old GET /api/account/me. */
export function customerSummary(customer: CurrentCustomer) {
  return {
    name: customer.profile?.displayName || customer.name,
    email: customer.email,
    phone: customer.phone,
  };
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sessionSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  // Parity with the Next app's getSecret(): refuse to run on a known
  // fallback secret in production (Phase 2 security verification fix).
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required in production.");
  }
  // Same dev fallback as the Next app so dev ipHash values match.
  return secret || "development-only-change-this-secret";
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  return crypto.createHmac("sha256", sessionSecret()).update(ip).digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

@Injectable()
export class CustomerAuthService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Session primitives (parity with src/lib/customer-auth.ts) ─────────────

  private requestMetadata(req: Request) {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwarded = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;
    const realIp = req.headers["x-real-ip"];
    return {
      userAgent: req.headers["user-agent"] ?? null,
      ipHash: hashIp(
        forwarded?.split(",")[0]?.trim() ||
          (Array.isArray(realIp) ? realIp[0] : realIp) ||
          null,
      ),
    };
  }

  private setSessionCookie(res: Response, token: string) {
    res.cookie(CUSTOMER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000, // express uses ms
      path: "/",
    });
  }

  private clearSessionCookie(res: Response) {
    res.clearCookie(CUSTOMER_SESSION_COOKIE, { path: "/" });
  }

  async createSession(req: Request, res: Response, customerId: string) {
    const token = randomToken();
    const metadata = this.requestMetadata(req);

    await this.prisma.client.customerSession.create({
      data: {
        customerId,
        tokenHash: hashToken(token),
        expiresAt: new Date(
          Date.now() + CUSTOMER_SESSION_DAYS * 24 * 60 * 60 * 1000,
        ),
        userAgent: metadata.userAgent,
        ipHash: metadata.ipHash,
      },
    });

    this.setSessionCookie(res, token);
  }

  async clearSession(req: Request, res: Response) {
    const token = (req.cookies as Record<string, string | undefined>)[
      CUSTOMER_SESSION_COOKIE
    ];
    if (token) {
      await this.prisma.client.customerSession.deleteMany({
        where: { tokenHash: hashToken(token) },
      });
    }
    this.clearSessionCookie(res);
  }

  /**
   * Resolves the current customer from the session cookie.
   * Invalid/expired/inactive sessions are cleaned up (row + cookie), exactly
   * like the old getCurrentCustomer().
   */
  async resolveCustomer(
    req: Request,
    res?: Response,
  ): Promise<CurrentCustomer | null> {
    const token = (req.cookies as Record<string, string | undefined>)[
      CUSTOMER_SESSION_COOKIE
    ];
    if (!token) return null;
    if (!this.prisma.isAvailable()) return null;

    const session = await this.prisma.client.customerSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { customer: { include: customerInclude } },
    });

    if (!session || session.expiresAt < new Date() || !session.customer.isActive) {
      if (session) {
        await this.prisma.client.customerSession
          .deleteMany({ where: { tokenHash: hashToken(token) } })
          .catch(() => undefined);
      }
      if (res) this.clearSessionCookie(res);
      return null;
    }

    return session.customer;
  }

  async requireCustomer(req: Request): Promise<CurrentCustomer> {
    const customer = await this.resolveCustomer(req);
    if (!customer) {
      throw new UnauthorizedException("Sign in to continue.");
    }
    return customer;
  }

  // ── Password helpers (parity with src/lib/auth.ts) ─────────────────────────

  hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  // ── Login identifier resolution (parity with loginCustomerAction) ──────────

  resolveLoginLookup(identifier: string) {
    const email = identifier.includes("@")
      ? normalizeEmail(identifier)
      : undefined;
    const normalizedPhone = email
      ? undefined
      : normalizeBangladeshPhone(identifier);
    const phone =
      normalizedPhone && bangladeshPhonePattern.test(normalizedPhone)
        ? normalizedPhone
        : undefined;

    return [email ? { email } : null, phone ? { phone } : null].filter(
      Boolean,
    ) as Array<{ email: string } | { phone: string }>;
  }
}
