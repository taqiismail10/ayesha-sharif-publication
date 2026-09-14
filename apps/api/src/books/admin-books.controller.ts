import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AdminGuard } from "../admin/admin.guard";
import { AdminRolesGuard } from "../admin/admin-roles.guard";
import { RequireAdminRoles } from "../admin/admin-roles.decorator";
import { AdminBooksService, adminBookSchema } from "./admin-books.service";

const stockSchema = z.object({ stockQuantity: z.coerce.number().int().min(0) });
const archiveSchema = z.object({ archived: z.boolean() });

@Controller("admin/books")
@UseGuards(AdminGuard, AdminRolesGuard)
export class AdminBooksController {
  constructor(@Inject(AdminBooksService) private readonly books: AdminBooksService) {}

  @Get()
  @RequireAdminRoles("super_admin", "admin", "editor")
  list(@Query("q") q?: string) { return this.books.list(q); }

  @Get(":id")
  @RequireAdminRoles("super_admin", "admin", "editor")
  detail(@Param("id") id: string) { return this.books.detail(id); }

  @Post()
  @RequireAdminRoles("super_admin", "admin", "editor")
  create(@Body() body: unknown) { return this.books.create(this.parse(body)); }

  @Put(":id")
  @RequireAdminRoles("super_admin", "admin", "editor")
  update(@Param("id") id: string, @Body() body: unknown) { return this.books.update(id, this.parse(body)); }

  @Patch(":id/archive")
  @RequireAdminRoles("super_admin", "admin", "editor")
  archive(@Param("id") id: string, @Body() body: unknown) {
    const parsed = archiveSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid archive request.");
    return this.books.setArchive(id, parsed.data.archived);
  }

  @Patch(":id/stock")
  @RequireAdminRoles("super_admin", "admin", "editor")
  stock(@Param("id") id: string, @Body() body: unknown) {
    const parsed = stockSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid stock quantity.");
    return this.books.setStock(id, parsed.data.stockQuantity);
  }

  @Delete(":id")
  @RequireAdminRoles("super_admin", "admin")
  delete(@Param("id") id: string) { return this.books.delete(id); }

  private parse(body: unknown) {
    const parsed = adminBookSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message || "Invalid book data.");
    return parsed.data;
  }
}
