import { Global, Module } from "@nestjs/common";
import { CustomerAuthController } from "./customer-auth.controller";
import { CustomerAuthService } from "./customer-auth.service";
import { GoogleOAuthController } from "./google-oauth.controller";
import { GoogleOAuthService } from "./google-oauth.service";
import { MailModule } from "../mail/mail.module";
import { OtpModule } from "../otp/otp.module";
import { OtpAuthController } from "./otp-auth.controller";
import { OtpAuthService } from "./otp-auth.service";

/**
 * Global: CustomerAuthService is needed by guards and (in later sub-phases)
 * by Orders/Recommendations modules for optional-customer resolution.
 */
@Global()
@Module({
  imports: [MailModule, OtpModule],
  controllers: [
    CustomerAuthController,
    GoogleOAuthController,
    OtpAuthController,
  ],
  providers: [CustomerAuthService, GoogleOAuthService, OtpAuthService],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
