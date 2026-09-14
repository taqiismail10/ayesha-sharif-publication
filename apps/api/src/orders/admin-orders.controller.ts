import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
import { AdminGuard } from "../admin/admin.guard";
import { AdminRolesGuard } from "../admin/admin-roles.guard";
import { RequireAdminRoles } from "../admin/admin-roles.decorator";
import { AdminOrdersService } from "./admin-orders.service";
import { AdminOrderExportService } from "./admin-order-export.service";

const updateSchema = z.object({
  orderStatus: z.string().optional(), paymentStatus: z.string().optional(),
  courierName: z.string().nullable().optional(), trackingNumber: z.string().nullable().optional(),
  adminNote: z.string().nullable().optional(),
});

@Controller("admin/orders")
@UseGuards(AdminGuard, AdminRolesGuard)
@RequireAdminRoles("super_admin", "admin", "order_manager")
export class AdminOrdersController {
  constructor(
    @Inject(AdminOrdersService) private readonly orders: AdminOrdersService,
    @Inject(AdminOrderExportService) private readonly exporter: AdminOrderExportService,
  ) {}

  @Get()
  list(@Query("q") q?: string, @Query("orderStatus") orderStatus?: string, @Query("paymentStatus") paymentStatus?: string) {
    return this.orders.list({ q, orderStatus, paymentStatus });
  }

  @Get("export")
  async export(@Query() query: unknown, @Res() response: Response) {
    const result = await this.exporter.export(query);
    response.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    response.status(200).send(result.csv);
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
