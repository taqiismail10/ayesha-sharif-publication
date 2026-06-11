import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpException,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { CustomerAuthService } from "../customer-auth/customer-auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { checkoutSchema, type CheckoutInput } from "../common/contracts/checkout.schema";
import { OrdersService } from "./orders.service";

/**
 * POST /orders — drop-in replacement for the old Next.js POST /api/orders.
 *
 * Response-shape parity with the old route (checkout-page-client.tsx reads
 * `ok`, `orderNumber`, `message`):
 *   200 { ok: true, orderNumber }
 *   400 { ok: false, message }      (validation AND business errors — like old)
 *   503 { ok: false, message }      (database not configured)
 *
 * Auth is OPTIONAL: a valid customer session cookie attaches the order to
 * that customer; guests check out exactly like before.
 */
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly auth: CustomerAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(200)
  @Header("Cache-Control", "private, no-store, max-age=0, must-revalidate")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  async create(@Body() body: unknown, @Req() req: Request) {
    try {
      // 503 with the old route's exact message when no DB is configured.
      if (!this.prisma.isAvailable()) {
        throw new HttpException(
          {
            ok: false,
            message:
              "Database is not configured yet. You can preview the storefront, but real order creation needs PostgreSQL.",
          },
          503,
        );
      }

      // Validation: first Zod issue message, 400 — old-route parity.
      const parsed = checkoutSchema.safeParse(body);
      if (!parsed.success) {
        throw new HttpException(
          {
            ok: false,
            message:
              parsed.error.issues[0]?.message ||
              "Invalid checkout information.",
          },
          400,
        );
      }
      const input = parsed.data as CheckoutInput;

      // Optional customer — guest checkout proceeds with null.
      const customer = await this.auth.resolveCustomer(req);

      const { orderNumber } = await this.orders.createOrder(input, customer);
      return { ok: true, orderNumber };
    } catch (caught) {
      if (caught instanceof HttpException) throw caught;
      // Business errors (missing book, stock, order-number exhaustion) → 400
      // with the thrown message, exactly like the old route's catch-all.
      throw new HttpException(
        {
          ok: false,
          message:
            caught instanceof Error
              ? caught.message
              : "Failed to create order.",
        },
        400,
      );
    }
  }

}
