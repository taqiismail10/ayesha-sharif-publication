import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { z } from "zod";
import { AdminAuthService } from "./admin-auth.service";
import { AdminGuard, type RequestWithAdmin } from "./admin.guard";

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

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
  async me(@Req() req: RequestWithAdmin) {
    return { ok: true, admin: this.auth.safeAdmin(req.admin) };
  }
}
