import { Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  emailOnlySchema,
  resetPasswordSchema,
  signupOtpRequestSchema,
  verifyOtpSchema,
  type EmailOnlyInput,
  type ResetPasswordInput,
  type SignupOtpRequestInput,
  type VerifyOtpInput,
} from "../common/contracts/otp-auth.schemas";
import { parseOrThrow } from "../common/validation/zod";
import { OtpAuthService } from "./otp-auth.service";

@Controller("auth")
export class OtpAuthController {
  constructor(@Inject(OtpAuthService) private readonly otpAuth: OtpAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("signup/request-otp")
  @HttpCode(200)
  requestSignup(@Body() body: unknown) {
    const input = parseOrThrow(
      signupOtpRequestSchema,
      body,
      "Invalid signup details.",
    ) as SignupOtpRequestInput;
    return this.otpAuth.requestSignup(input);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("signup/verify-otp")
  @HttpCode(200)
  verifySignup(@Body() body: unknown) {
    const input = parseOrThrow(
      verifyOtpSchema,
      body,
      "Invalid verification code.",
    ) as VerifyOtpInput;
    return this.otpAuth.verifySignup(input);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("signup/resend-otp")
  @HttpCode(200)
  resendSignup(@Body() body: unknown) {
    const input = parseOrThrow(
      emailOnlySchema,
      body,
      "Enter a valid email address.",
    ) as EmailOnlyInput;
    return this.otpAuth.resendSignup(input);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("forgot-password/request-otp")
  @HttpCode(200)
  requestPasswordReset(@Body() body: unknown) {
    const input = parseOrThrow(
      emailOnlySchema,
      body,
      "Enter a valid email address.",
    ) as EmailOnlyInput;
    return this.otpAuth.requestPasswordReset(input);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("forgot-password/verify-otp")
  @HttpCode(200)
  verifyPasswordReset(@Body() body: unknown) {
    const input = parseOrThrow(
      verifyOtpSchema,
      body,
      "Invalid verification code.",
    ) as VerifyOtpInput;
    return this.otpAuth.verifyPasswordReset(input);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("forgot-password/reset")
  @HttpCode(200)
  resetPassword(@Body() body: unknown) {
    const input = parseOrThrow(
      resetPasswordSchema,
      body,
      "Invalid password reset request.",
    ) as ResetPasswordInput;
    return this.otpAuth.resetPassword(input);
  }
}
