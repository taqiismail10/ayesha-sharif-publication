import { Global, Module } from "@nestjs/common";
import { CustomerAuthController } from "./customer-auth.controller";
import { CustomerAuthService } from "./customer-auth.service";
import { GoogleOAuthController } from "./google-oauth.controller";
import { GoogleOAuthService } from "./google-oauth.service";

/**
 * Global: CustomerAuthService is needed by guards and (in later sub-phases)
 * by Orders/Recommendations modules for optional-customer resolution.
 */
@Global()
@Module({
  controllers: [CustomerAuthController, GoogleOAuthController],
  providers: [CustomerAuthService, GoogleOAuthService],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
