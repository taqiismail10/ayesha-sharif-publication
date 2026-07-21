import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { parseOrThrow } from "../common/validation/zod";
import {
  customerLoginSchema,
  type CustomerLoginInput,
} from "../common/contracts/customer.schemas";
import {
  CustomerAuthService,
  customerSummary,
} from "./customer-auth.service";

@Controller("auth/customer")
export class CustomerAuthController {
  constructor(
    private readonly auth: CustomerAuthService,
    private readonly prisma: PrismaService,
  ) {}

  /** POST /auth/customer/login — contract §2. Strict brute-force limit. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = parseOrThrow(
      customerLoginSchema,
      body,
      "Invalid login details.",
    ) as CustomerLoginInput;

    const lookup = this.auth.resolveLoginLookup(input.identifier);
    if (!lookup.length) {
      throw new UnauthorizedException("Invalid email/phone or password.");
    }

    const customer = await this.prisma.client.customer.findFirst({
      where: { OR: lookup },
      include: { profile: true, preferences: true },
    });

    const validPassword = customer
      ? await this.auth.verifyPassword(input.password, customer.passwordHash)
      : false;

    if (
      !customer?.isActive ||
      !customer.passwordLoginEnabled ||
      !validPassword
    ) {
      throw new UnauthorizedException("Invalid email/phone or password.");
    }
    if (customer.email && !customer.emailVerifiedAt) {
      throw new UnauthorizedException(
        "Verify your email before signing in.",
      );
    }

    await this.prisma.client.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });
    await this.auth.createSession(req, res, customer.id);

    return { ok: true, customer: customerSummary(customer) };
  }

  /** POST /auth/customer/logout — contract §3 */
  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.clearSession(req, res);
    return { ok: true };
  }

  /**
   * GET /auth/customer/me — contract §5.
   * Always 200; guests get customer:null (drop-in for old /api/account/me).
   */
  @Get("me")
  @Header("Cache-Control", "private, no-store, max-age=0")
  async me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const customer = await this.auth.resolveCustomer(req, res);
    return {
      ok: true,
      customer: customer ? customerSummary(customer) : null,
    };
  }
}
