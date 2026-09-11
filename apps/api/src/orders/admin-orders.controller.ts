import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AdminGuard } from "../admin/admin.guard";
import { AdminRolesGuard } from "../admin/admin-roles.guard";
import { RequireAdminRoles } from "../admin/admin-roles.decorator";
import { AdminOrdersService } from "./admin-orders.service";

const updateSchema = z.object({
  orderStatus: z.string().optional(), paymentStatus: z.string().optional(),
  courierName: z.string().nullable().optional(), trackingNumber: z.string().nullable().optional(),
  adminNote: z.string().nullable().optional(),
});

@Controller("admin/orders")
@UseGuards(AdminGuard, AdminRolesGuard)
@RequireAdminRoles("super_admin", "admin", "order_manager")
export class AdminOrdersController {
  constructor(@Inject(AdminOrdersService) private readonly orders: AdminOrdersService) {}

  @Get()
  list(@Query("q") q?: string, @Query("orderStatus") orderStatus?: string, @Query("paymentStatus") paymentStatus?: string) {
    return this.orders.list({ q, orderStatus, paymentStatus });
  }

  @Get(":id")
  detail(@Param("id") id: string) { return this.orders.detail(id); }

  @Patch(":id/status")
  update(@Param("id") id: string, @Body() body: unknown) {
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid order update.");
    return this.orders.update(id, parsed.data);
  }

  @Patch(":id/payment")
  payment(@Param("id") id: string, @Body() body: unknown) {
    const parsed = z.object({ paymentStatus: z.string() }).safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid payment update.");
    return this.orders.update(id, { paymentStatus: parsed.data.paymentStatus });
  }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string) { return this.orders.update(id, { orderStatus: "cancelled" }); }
}
