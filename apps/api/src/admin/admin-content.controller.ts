import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AdminGuard, type RequestWithAdmin } from "./admin.guard";
import { AdminRolesGuard } from "./admin-roles.guard";
import { RequireAdminRoles } from "./admin-roles.decorator";
import { AdminContentService } from "./admin-content.service";
@Controller("admin") @UseGuards(AdminGuard, AdminRolesGuard) @RequireAdminRoles("super_admin", "admin")
export class AdminContentController {
  constructor(@Inject(AdminContentService) private readonly content: AdminContentService) {}
  @Get("settings/:key") setting(@Param("key") key: string) { return this.content.getSetting(key); }
  @Put("settings/:key") updateSetting(@Param("key") key: string, @Body() body: { value?: unknown }) { return this.content.putSetting(key, body?.value); }
  @Get("policies") policies() { return this.content.listPolicies(); }
  @Get("policies/:slug") policy(@Param("slug") slug: string) { return this.content.getPolicy(slug); }
  @Put("policies/:slug/draft") draft(@Param("slug") slug: string, @Body() body: unknown, @Req() req: RequestWithAdmin) { return this.content.saveDraft(slug, body, req.admin.id); }
  @Post("policies/:slug/publish") publish(@Param("slug") slug: string, @Body() body: unknown, @Req() req: RequestWithAdmin) { return this.content.publish(slug, body, req.admin.id); }
}
