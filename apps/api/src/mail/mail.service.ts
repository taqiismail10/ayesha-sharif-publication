import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

type OtpEmailKind = "signup" | "password-reset";

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isDevelopment: boolean;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.fromEmail = this.config.get<string>("SMTP_FROM_EMAIL")?.trim() ?? "";
    this.fromName =
      this.config.get<string>("SMTP_FROM_NAME")?.trim() || "Ayesha Sharif Publications";
    this.isDevelopment =
      (this.config.get<string>("NODE_ENV") || "development") !== "production";

    const host = this.config.get<string>("SMTP_HOST")?.trim();
    const user = this.config.get<string>("SMTP_USER")?.trim();
    const pass = this.config.get<string>("SMTP_PASS")?.trim();
    const port = Number(this.config.get<string>("SMTP_PORT") || 587);
    const secure =
      (this.config.get<string>("SMTP_SECURE") || "false").toLowerCase() ===
      "true";

    this.transporter =
      host && user && pass && this.fromEmail
        ? nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
          })
        : null;
  }

  assertReady() {
    if (!this.transporter && !this.isDevelopment) {
      throw new ServiceUnavailableException(
        "Email delivery is temporarily unavailable.",
      );
    }
  }

  async onModuleInit() {
    if (!this.transporter) {
      if (this.isDevelopment) {
        this.logger.warn(
          "SMTP transport is not configured. OTP emails will be logged locally in development.",
        );
      }
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log(`SMTP transport ready for ${this.fromEmail}.`);
    } catch (error) {
      this.logger.error(
        `SMTP transport verification failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  sendSignupOtpEmail(email: string, otp: string, expiresMinutes: number) {
    return this.sendOtpEmail("signup", email, otp, expiresMinutes);
  }

  sendPasswordResetOtpEmail(
    email: string,
    otp: string,
    expiresMinutes: number,
  ) {
    return this.sendOtpEmail("password-reset", email, otp, expiresMinutes);
  }

  private async sendOtpEmail(
    kind: OtpEmailKind,
    email: string,
    otp: string,
    expiresMinutes: number,
  ) {
    if (!this.transporter) {
      if (this.isDevelopment) {
        this.logger.warn(
          `[development only] ${kind} OTP for ${email}: ${otp}`,
        );
        return;
      }
      throw new ServiceUnavailableException(
        "Email delivery is temporarily unavailable.",
      );
    }

    const isSignup = kind === "signup";
    const subject = isSignup
      ? "Verify your AS Publications account"
      : "Reset your AS Publications password";
    const purpose = isSignup ? "verification" : "password reset";
    const text = [
      `Your AS Publications ${purpose} code is ${otp}.`,
      `This code will expire in ${expiresMinutes} minutes.`,
      "If you did not request this, you can ignore this email.",
      ...(isSignup ? [] : ["Do not share this code with anyone."]),
    ].join("\n");

    const html = `<!doctype html>
<html><body style="margin:0;background:#f5f1e8;font-family:Arial,sans-serif;color:#243324">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1e8;padding:32px 16px">
<tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #ded5c7;border-radius:12px">
<tr><td style="padding:32px"><p style="margin:0 0 8px;color:#719276;font-size:12px;letter-spacing:1.5px;text-transform:uppercase">AS Publications</p>
<h1 style="margin:0;color:#2d4a2b;font-family:Georgia,serif;font-size:26px;font-weight:500">${subject}</h1>
<p style="margin:20px 0 12px;line-height:1.6">Use this ${purpose} code:</p>
<div style="padding:18px;border:1px solid #d4a574;border-radius:8px;background:#faf7f0;color:#2d4a2b;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">${otp}</div>
<p style="margin:18px 0 0;line-height:1.6;color:#59635a">This code expires in ${expiresMinutes} minutes. ${isSignup ? "" : "Do not share it with anyone. "}If you did not request this, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;

    try {
      await this.transporter.sendMail({
        from: { name: this.fromName, address: this.fromEmail },
        to: email,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send ${kind} email: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      throw new ServiceUnavailableException(
        "Email delivery is temporarily unavailable.",
      );
    }
  }
}
