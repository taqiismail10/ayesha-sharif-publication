import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import type {
  EmailOnlyInput,
  ResetPasswordInput,
  SignupOtpRequestInput,
  VerifyOtpInput,
} from "../common/contracts/otp-auth.schemas";
import { MailService } from "../mail/mail.service";
import {
  OTP_EXPIRES_MINUTES,
  OTP_RESEND_SECONDS,
  OtpService,
} from "../otp/otp.service";
import { PrismaService } from "../prisma/prisma.service";
import { CustomerAuthService } from "./customer-auth.service";

const ACCOUNT_CONFLICT_MESSAGE =
  "An account with this email may already exist. Try signing in instead.";
const FORGOT_MESSAGE =
  "If an account exists with this email, we sent a reset code.";

@Injectable()
export class OtpAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: CustomerAuthService,
    private readonly otp: OtpService,
    private readonly mail: MailService,
  ) {}

  async requestSignup(input: SignupOtpRequestInput) {
    this.mail.assertReady();
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.client.customer.findUnique({
      where: { email },
    });

    if (existing?.emailVerifiedAt || existing?.passwordLoginEnabled === false) {
      throw new ConflictException(ACCOUNT_CONFLICT_MESSAGE);
    }

    const passwordHash = await this.auth.hashPassword(input.password);
    if (existing) {
      await this.prisma.client.customer.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          passwordHash,
          passwordLoginEnabled: true,
          profile: {
            upsert: {
              update: { displayName: input.name, email },
              create: { displayName: input.name, email },
            },
          },
          preferences: { upsert: { update: {}, create: {} } },
        },
      });
    } else {
      await this.prisma.client.customer.create({
        data: {
          name: input.name,
          email,
          passwordHash,
          passwordLoginEnabled: true,
          emailVerifiedAt: null,
          profile: { create: { displayName: input.name, email } },
          preferences: { create: {} },
        },
      });
    }

    const issued = await this.otp.issue(email, "SIGNUP");
    await this.mail.sendSignupOtpEmail(
      email,
      issued.otp,
      OTP_EXPIRES_MINUTES,
    );

    return {
      ok: true,
      message: "We sent a verification code to your email.",
      expiresInSeconds: OTP_EXPIRES_MINUTES * 60,
      resendAfterSeconds: OTP_RESEND_SECONDS,
    };
  }

  async verifySignup(input: VerifyOtpInput) {
    const email = input.email.trim().toLowerCase();
    const customer = await this.prisma.client.customer.findUnique({
      where: { email },
    });
    if (!customer || customer.passwordLoginEnabled === false) {
      throw new BadRequestException("The code is invalid or has expired.");
    }

    await this.otp.verifyAndConsume(email, "SIGNUP", input.otp);
    await this.prisma.client.customer.update({
      where: { id: customer.id },
      data: { emailVerifiedAt: new Date() },
    });

    return {
      ok: true,
      message: "Email verified. You can now sign in.",
    };
  }

  async resendSignup(input: EmailOnlyInput) {
    this.mail.assertReady();
    const email = input.email.trim().toLowerCase();
    const customer = await this.prisma.client.customer.findUnique({
      where: { email },
    });

    if (
      customer &&
      !customer.emailVerifiedAt &&
      customer.passwordLoginEnabled
    ) {
      const issued = await this.otp.issue(email, "SIGNUP");
      await this.mail.sendSignupOtpEmail(
        email,
        issued.otp,
        OTP_EXPIRES_MINUTES,
      );
    }

    return {
      ok: true,
      message: "If verification is pending, we sent a new code.",
      expiresInSeconds: OTP_EXPIRES_MINUTES * 60,
      resendAfterSeconds: OTP_RESEND_SECONDS,
    };
  }

  async requestPasswordReset(input: EmailOnlyInput) {
    this.mail.assertReady();
    const email = input.email.trim().toLowerCase();
    const customer = await this.prisma.client.customer.findUnique({
      where: { email },
    });

    if (
      customer?.emailVerifiedAt &&
      customer.passwordLoginEnabled &&
      customer.isActive
    ) {
      try {
        const issued = await this.otp.issue(email, "PASSWORD_RESET");
        await this.mail.sendPasswordResetOtpEmail(
          email,
          issued.otp,
          OTP_EXPIRES_MINUTES,
        );
      } catch {
        // Keep the response neutral for forgot-password requests.
      }
    }

    return {
      ok: true,
      message: FORGOT_MESSAGE,
      expiresInSeconds: OTP_EXPIRES_MINUTES * 60,
      resendAfterSeconds: OTP_RESEND_SECONDS,
    };
  }

  async verifyPasswordReset(input: VerifyOtpInput) {
    const email = input.email.trim().toLowerCase();
    const customer = await this.prisma.client.customer.findUnique({
      where: { email },
    });
    if (
      !customer?.emailVerifiedAt ||
      !customer.passwordLoginEnabled ||
      !customer.isActive
    ) {
      throw new BadRequestException("The code is invalid or has expired.");
    }

    await this.otp.verifyAndConsume(email, "PASSWORD_RESET", input.otp);
    const resetToken = await this.otp.issueResetToken(email);
    return { ok: true, resetToken, expiresInSeconds: 10 * 60 };
  }

  async resetPassword(input: ResetPasswordInput) {
    const email = input.email.trim().toLowerCase();
    const reset = await this.otp.verifyResetToken(email, input.resetToken);
    const customer = await this.prisma.client.customer.findUnique({
      where: { email },
    });
    if (!customer?.isActive || !customer.passwordLoginEnabled) {
      throw new BadRequestException("The password reset session is invalid.");
    }

    const passwordHash = await this.auth.hashPassword(input.newPassword);
    await this.prisma.client.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: reset.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException("The password reset session has expired.");
      }
      await tx.customer.update({
        where: { id: customer.id },
        data: { passwordHash, emailVerifiedAt: customer.emailVerifiedAt ?? new Date() },
      });
      await tx.customerSession.deleteMany({
        where: { customerId: customer.id },
      });
    });

    return {
      ok: true,
      message: "Password updated. Sign in with your new password.",
    };
  }
}
