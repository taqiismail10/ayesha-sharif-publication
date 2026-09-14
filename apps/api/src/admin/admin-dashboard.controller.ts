import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { AdminRolesGuard } from "./admin-roles.guard";
import { RequireAdminRoles } from "./admin-roles.decorator";
import { AdminDashboardService } from "./admin-dashboard.service";

@Controller("admin/dashboard")
@UseGuards(AdminGuard, AdminRolesGuard)
// The pre-migration protected layout allowed every authenticated admin role.
@RequireAdminRoles("super_admin", "admin", "editor", "order_manager")
export class AdminDashboardController {
  constructor(@Inject(AdminDashboardService) private readonly dashboardService: AdminDashboardService) {}

  @Get()
  dashboard() {
    return this.dashboardService.dashboard();
  }
}
