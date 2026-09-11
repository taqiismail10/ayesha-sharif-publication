import {
  BadRequestException,
  ConflictException,
  Inject,
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
import {
  D1AtomicService,
  isD1UniqueConstraintError,
} from "../prisma/d1-atomic.service";
import { CustomerAuthService } from "./customer-auth.service";

const ACCOUNT_CONFLICT_MESSAGE =
  "An account with this email may already exist. Try signing in instead.";
const FORGOT_MESSAGE =
  "If an account exists with this email, we sent a reset code.";

@Injectable()
export class OtpAuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(D1AtomicService) private readonly atomic: D1AtomicService,
    @Inject(CustomerAuthService) private readonly auth: CustomerAuthService,
    @Inject(OtpService) private readonly otp: OtpService,
    @Inject(MailService) private readonly mail: MailService,
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
    try {
      await this.atomic.upsertSignupCustomer(
        {
          id: this.atomic.newId(),
          name: input.name,
          email,
          passwordHash,
          passwordLoginEnabled: true,
          emailVerifiedAt: null,
        },
        existing?.id,
      );
    } catch (caught) {
      if (isD1UniqueConstraintError(caught)) {
        throw new ConflictException(ACCOUNT_CONFLICT_MESSAGE);
      }
      throw caught;
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

    await this.otp.consumeSignupOtp(email, input.otp, customer.id);

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

    const resetToken = await this.otp.consumePasswordResetOtp(
      email,
      input.otp,
      customer.id,
    );
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
    const consumed = await this.atomic.resetPassword({
      resetId: reset.id,
      expectedTokenHash: reset.tokenHash,
      customerId: customer.id,
      email,
      passwordHash,
      verifyEmail: !customer.emailVerifiedAt,
    });
    if (!consumed) {
      throw new BadRequestException("The password reset session has expired.");
    }

    return {
      ok: true,
      message: "Password updated. Sign in with your new password.",
    };
  }
}
