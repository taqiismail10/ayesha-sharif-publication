import { Module } from "@nestjs/common";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AdminGuard } from "./admin.guard";
import { AdminPermissionService } from "./admin-permission.service";
import { AdminRolesGuard } from "./admin-roles.guard";
import { AdminCategoriesController } from "./admin-categories.controller";
import { AdminTagsController } from "./admin-tags.controller";
import { AdminTaxonomyService } from "./admin-taxonomy.service";
import { AdminContentController } from "./admin-content.controller";
import { AdminContentService } from "./admin-content.service";

@Module({
  controllers: [AdminAuthController, AdminCategoriesController, AdminTagsController, AdminContentController],
  providers: [AdminAuthService, AdminGuard, AdminPermissionService, AdminRolesGuard, AdminTaxonomyService, AdminContentService],
  exports: [AdminAuthService, AdminGuard, AdminPermissionService, AdminRolesGuard],
})
export class AdminModule {}
