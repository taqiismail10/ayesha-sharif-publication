import { Module } from "@nestjs/common";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AdminGuard } from "./admin.guard";
import { AdminPermissionService } from "./admin-permission.service";
import { AdminRolesGuard } from "./admin-roles.guard";
import { AdminCategoriesController } from "./admin-categories.controller";
import { AdminTagsController } from "./admin-tags.controller";
import { AdminTaxonomyService } from "./admin-taxonomy.service";

@Module({
  controllers: [AdminAuthController, AdminCategoriesController, AdminTagsController],
  providers: [AdminAuthService, AdminGuard, AdminPermissionService, AdminRolesGuard, AdminTaxonomyService],
  exports: [AdminAuthService, AdminGuard, AdminPermissionService, AdminRolesGuard],
})
export class AdminModule {}
