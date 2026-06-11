import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma";
import { PrismaService } from "../prisma/prisma.service";
import { parseOrThrow } from "../common/validation/zod";
import {
  customerLoginSchema,
  customerRegisterSchema,
  type CustomerLoginInput,
  type CustomerRegisterInput,
} from "../common/contracts/customer.schemas";
import {
  CustomerAuthService,
  customerSummary,
} from "./customer-auth.service";

const CONFLICT_MESSAGE =
  "An account with this email or phone may already exist.";

@Controller("auth/customer")
export class CustomerAuthController {
  constructor(
    private readonly auth: CustomerAuthService,
    private readonly prisma: PrismaService,
  ) {}

  /** POST /auth/customer/register — contract §1 */
  @Post("register")
  async register(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Cast mirrors the old action's `parsed.data as {...}` (zod preprocess
    // infers `unknown` for normalized fields).
    const input = parseOrThrow(
      customerRegisterSchema,
      body,
      "Invalid account details.",
    ) as CustomerRegisterInput;

    let customerId: string;
    try {
      const passwordHash = await this.auth.hashPassword(input.password);
      const customer = await this.prisma.client.customer.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          profile: {
            create: {
              displayName: input.name,
              email: input.email,
              phone: input.phone,
            },
          },
          preferences: { create: {} },
        },
        include: { profile: true, preferences: true },
      });
      customerId = customer.id;

      await this.auth.createSession(req, res, customerId);
      return { ok: true, customer: customerSummary(customer) };
    } catch (caught) {
      if (
        caught instanceof Prisma.PrismaClientKnownRequestError &&
        caught.code === "P2002"
      ) {
        throw new ConflictException(CONFLICT_MESSAGE);
      }
      if (caught instanceof ConflictException) throw caught;
      throw new BadRequestException(
        "Could not create your account. Please try again.",
      );
    }
  }

  /** POST /auth/customer/login — contract §2 */
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

    if (!customer?.isActive || !validPassword) {
      throw new UnauthorizedException("Invalid email/phone or password.");
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
