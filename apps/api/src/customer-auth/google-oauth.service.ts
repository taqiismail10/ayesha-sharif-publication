import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeEmail } from "../common/contracts/customer.schemas";
import type { CurrentCustomer } from "./customer-auth.service";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Claims we read from Google's id_token (OpenID Connect). */
export type GoogleProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

const customerInclude = { profile: true, preferences: true } as const;

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Configuration ───────────────────────────────────────────────────────────

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        "Google login is not configured on this server.",
      );
    }
  }

  callbackUrl(): string {
    return (
      process.env.GOOGLE_CALLBACK_URL ||
      `http://localhost:${process.env.API_PORT || 4000}/auth/customer/google/callback`
    );
  }

  frontendUrl(): string {
    return (
      process.env.FRONTEND_URL ||
      (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
        .split(",")[0]
        .trim()
    );
  }

  // ── OAuth round-trip (hand-rolled; no extra dependencies) ───────────────────

  /** Step 1: URL the browser is redirected to. Scopes: openid email profile only. */
  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      redirect_uri: this.callbackUrl(),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Step 2: exchange the authorization code for tokens directly with Google
   * (server-to-server over TLS). We only need the id_token; the access token
   * is NOT stored and never leaves this method.
   */
  async exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: this.callbackUrl(),
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      this.logger.warn(`Google token exchange failed (${response.status}).`);
      throw new UnauthorizedException("Google sign-in failed.");
    }

    const tokens = (await response.json()) as { id_token?: string };
    if (!tokens.id_token) {
      throw new UnauthorizedException("Google sign-in failed.");
    }

    // The id_token was received directly from Google's token endpoint over
    // TLS, so per OIDC spec its payload can be trusted without local
    // signature verification.
    const payload = tokens.id_token.split(".")[1];
    if (!payload) throw new UnauthorizedException("Google sign-in failed.");

    try {
      return JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      ) as GoogleProfile;
    } catch {
      throw new UnauthorizedException("Google sign-in failed.");
    }
  }

  // ── Account linking (contract: never duplicate, never overwrite) ───────────

  /**
   * Resolves a Google profile to a Customer:
   *  1. provider link exists            → log that customer in
   *  2. verified email matches customer → link provider to existing customer
   *  3. otherwise                       → create customer (+profile+prefs) + link
   *
   * Never overwrites existing customer fields. Never touches Admin.
   */
  async loginOrLinkCustomer(profile: GoogleProfile): Promise<CurrentCustomer> {
    if (!profile.sub) {
      throw new UnauthorizedException("Google sign-in failed.");
    }

    const email = normalizeEmail(profile.email);
    if (!email) {
      throw new BadRequestException(
        "Your Google account has no email address. Use email/password login instead.",
      );
    }
    // Linking by email is only safe when Google has verified ownership.
    if (profile.email_verified === false) {
      throw new BadRequestException(
        "Your Google email is not verified. Verify it with Google first.",
      );
    }

    const db = this.prisma.client;

    // 1. Already linked → normal login
    const existingLink = await db.customerAuthProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider: "google",
          providerUserId: profile.sub,
        },
      },
      include: { customer: { include: customerInclude } },
    });
    if (existingLink) {
      if (!existingLink.customer.isActive) {
        throw new UnauthorizedException("This account has been disabled.");
      }
      if (!existingLink.customer.emailVerifiedAt) {
        return db.customer.update({
          where: { id: existingLink.customer.id },
          data: { emailVerifiedAt: new Date() },
          include: customerInclude,
        });
      }
      return existingLink.customer;
    }

    // 2. Existing customer with this verified email → link, don't duplicate
    const existingCustomer = await db.customer.findUnique({
      where: { email },
      include: customerInclude,
    });
    if (existingCustomer) {
      if (!existingCustomer.isActive) {
        throw new UnauthorizedException("This account has been disabled.");
      }
      try {
        await db.$transaction([
          db.customerAuthProvider.create({
            data: {
              customerId: existingCustomer.id,
              provider: "google",
              providerUserId: profile.sub,
              providerEmail: email,
            },
          }),
          db.customer.update({
            where: { id: existingCustomer.id },
            data: { emailVerifiedAt: new Date() },
          }),
        ]);
      } catch (caught) {
        // @@unique([customerId, provider]) — this customer is already linked
        // to a DIFFERENT Google account. Refuse rather than overwrite.
        if (
          caught instanceof Prisma.PrismaClientKnownRequestError &&
          caught.code === "P2002"
        ) {
          throw new UnauthorizedException(
            "This account is already linked to a different Google account.",
          );
        }
        throw caught;
      }
      return { ...existingCustomer, emailVerifiedAt: new Date() };
    }

    // 3. New customer. passwordHash is REQUIRED by the schema and the old
    // Next.js login compares against it unconditionally — so we store a
    // random unusable hash instead of null. Password login for this customer
    // simply fails with the generic message until they set one.
    const unusablePassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(unusablePassword, 12);
    const displayName = profile.name?.trim() || email.split("@")[0];

    return db.customer.create({
      data: {
        name: displayName,
        email,
        passwordHash,
        passwordLoginEnabled: false,
        emailVerifiedAt: new Date(),
        profile: {
          create: { displayName, email },
        },
        preferences: { create: {} },
        authProviders: {
          create: {
            provider: "google",
            providerUserId: profile.sub,
            providerEmail: email,
          },
        },
      },
      include: customerInclude,
    });
  }
}
