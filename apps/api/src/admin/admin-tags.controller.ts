import { Body, Controller, Get, Inject, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { AdminRolesGuard } from "./admin-roles.guard";
import { RequireAdminRoles } from "./admin-roles.decorator";
import { AdminTaxonomyService } from "./admin-taxonomy.service";

@Controller("admin/tags")
@UseGuards(AdminGuard, AdminRolesGuard)
@RequireAdminRoles("super_admin", "admin", "editor")
export class AdminTagsController {
  constructor(@Inject(AdminTaxonomyService) private readonly taxonomy: AdminTaxonomyService) {}

  @Get()
  list() { return this.taxonomy.list("tags"); }

  @Post()
  create(@Body() body: unknown) { return this.taxonomy.create("tags", body); }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: unknown) { return this.taxonomy.update("tags", id, body); }

  @Patch(":id/archive")
  archive(@Param("id") id: string) { return this.taxonomy.archive("tags", id); }
}

