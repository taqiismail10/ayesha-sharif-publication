import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";
import { AdminRolesGuard } from "./admin-roles.guard";
import { RequireAdminRoles } from "./admin-roles.decorator";
import { AdminCustomersService } from "./admin-customers.service";

@Controller("admin/customers")
@UseGuards(AdminGuard, AdminRolesGuard)
@RequireAdminRoles("super_admin", "admin", "order_manager")
export class AdminCustomersController {
  constructor(@Inject(AdminCustomersService) private readonly customers: AdminCustomersService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.customers.list(query);
  }
}
