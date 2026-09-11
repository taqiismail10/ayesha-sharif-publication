import { Module } from "@nestjs/common";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AdminGuard } from "./admin.guard";
import { AdminPermissionService } from "./admin-permission.service";
import { AdminRolesGuard } from "./admin-roles.guard";

@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminGuard, AdminPermissionService, AdminRolesGuard],
  exports: [AdminAuthService, AdminGuard, AdminPermissionService, AdminRolesGuard],
})
export class AdminModule {}
