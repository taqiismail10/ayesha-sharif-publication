import crypto from "crypto";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { OtpPurpose } from "../generated/prisma/client";
import { D1AtomicService } from "../prisma/d1-atomic.service";
import { PrismaService } from "../prisma/prisma.service";

export const OTP_EXPIRES_MINUTES = 10;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRES_MINUTES = 10;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function tooManyRequests(message: string) {
  return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
}

@Injectable()
export class OtpService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(D1AtomicService) private readonly atomic: D1AtomicService,
  ) {}

  private secret() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET is required in production.");
    }
    return secret || "development-only-change-this-secret";
  }

  private hash(value: string, context: string) {
    return crypto
      .createHmac("sha256", this.secret())
      .update(`${context}:${value}`)
      .digest("hex");
  }

  private matches(expectedHex: string, actualHex: string) {
    if (expectedHex.length !== actualHex.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(expectedHex, "hex"),
      Buffer.from(actualHex, "hex"),
    );
  }

  async issue(emailInput: string, purpose: OtpPurpose) {
    const email = normalizeEmail(emailInput);
    const now = new Date();
    const current = await this.prisma.client.otpVerification.findUnique({
      where: { email_purpose: { email, purpose } },
    });

    if (
      current &&
      !current.consumedAt &&
      current.resendAfter.getTime() > now.getTime()
    ) {
      const seconds = Math.ceil(
        (current.resendAfter.getTime() - now.getTime()) / 1000,
      );
      throw tooManyRequests(
        `Please wait ${seconds} seconds before requesting another code.`,
      );
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(
      now.getTime() + OTP_EXPIRES_MINUTES * 60 * 1000,
    );
    const resendAfter = new Date(
      now.getTime() + OTP_RESEND_SECONDS * 1000,
    );
    const otpHash = this.hash(otp, `otp:${purpose}:${email}`);

    await this.prisma.client.otpVerification.upsert({
      where: { email_purpose: { email, purpose } },
      update: {
        otpHash,
        attempts: 0,
        expiresAt,
        resendAfter,
        consumedAt: null,
      },
      create: {
        email,
        purpose,
        otpHash,
        expiresAt,
        resendAfter,
      },
    });

    return { otp, expiresAt, resendAfter };
  }

  private async verify(
    emailInput: string,
    purpose: OtpPurpose,
    otp: string,
  ) {
    const email = normalizeEmail(emailInput);
    const record = await this.prisma.client.otpVerification.findUnique({
      where: { email_purpose: { email, purpose } },
    });
    const now = new Date();

    if (!record || record.consumedAt || record.expiresAt <= now) {
      throw new BadRequestException("The code is invalid or has expired.");
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw tooManyRequests(
        "Too many incorrect attempts. Request a new code.",
      );
    }

    const actualHash = this.hash(otp, `otp:${purpose}:${email}`);
    if (!this.matches(record.otpHash, actualHash)) {
      const updated = await this.prisma.client.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      if (updated.attempts >= OTP_MAX_ATTEMPTS) {
        throw tooManyRequests(
          "Too many incorrect attempts. Request a new code.",
        );
      }
      throw new BadRequestException("The code is invalid or has expired.");
    }

    return { record, actualHash };
  }

  async consumeSignupOtp(
    emailInput: string,
    otp: string,
    customerId: string,
  ): Promise<void> {
    const verified = await this.verify(emailInput, "SIGNUP", otp);
    const consumed = await this.atomic.consumeSignupOtp({
      otpId: verified.record.id,
      expectedOtpHash: verified.actualHash,
      customerId,
      email: normalizeEmail(emailInput),
    });
    if (!consumed) {
      throw new BadRequestException("The code is invalid or has expired.");
    }
  }

  async consumePasswordResetOtp(
    emailInput: string,
    otp: string,
    customerId: string,
  ) {
    const email = normalizeEmail(emailInput);
    const verified = await this.verify(email, "PASSWORD_RESET", otp);
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
    );
    const tokenHash = this.hash(token, `reset:${email}`);
    const consumed = await this.atomic.consumeOtpAndIssueReset({
      otpId: verified.record.id,
      expectedOtpHash: verified.actualHash,
      email,
      customerId,
      resetId: this.atomic.newId(),
      resetTokenHash: tokenHash,
      resetExpiresAt: expiresAt,
    });
    if (!consumed) {
      throw new BadRequestException("The code is invalid or has expired.");
    }
    return token;
  }

  async verifyResetToken(emailInput: string, token: string) {
    const email = normalizeEmail(emailInput);
    const record = await this.prisma.client.passwordResetToken.findUnique({
      where: { email },
    });
    if (!record || record.consumedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException("The password reset session has expired.");
    }
    const tokenHash = this.hash(token, `reset:${email}`);
    if (!this.matches(record.tokenHash, tokenHash)) {
      throw new BadRequestException("The password reset session is invalid.");
    }
    return record;
  }
}
