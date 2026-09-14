import { Body, Controller, Get, HttpCode, Inject, Post, Query, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { z } from "zod";
import { AdminAuthService } from "./admin-auth.service";
import { AdminGuard, type RequestWithAdmin } from "./admin.guard";
import { AdminPermissionService } from "./admin-permission.service";
import type { AdminRole } from "../generated/prisma/enums";

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

@Controller("admin/auth")
export class AdminAuthController {
  constructor(
    @Inject(AdminAuthService) private readonly auth: AdminAuthService,
    @Inject(AdminPermissionService) private readonly permissions: AdminPermissionService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException("Invalid admin email or password.");
    const admin = await this.auth.login(parsed.data.email, parsed.data.password, res);
    if (!admin) throw new UnauthorizedException("Invalid admin email or password.");
    return { ok: true, admin };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req, res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AdminGuard)
  async me(@Req() req: RequestWithAdmin, @Query("roles") roles?: string) {
    const requestedRoles = roles?.split(",").filter(Boolean);
    const allowedRoles = requestedRoles?.filter((role): role is AdminRole =>
      ["super_admin", "admin", "editor", "order_manager"].includes(role),
    );
    if (requestedRoles?.length && !allowedRoles?.length) {
      throw new UnauthorizedException("Invalid admin role policy.");
    }
    this.permissions.assertAnyRole(req.admin.role, allowedRoles);
    return { ok: true, admin: this.auth.safeAdmin(req.admin) };
  }
}
