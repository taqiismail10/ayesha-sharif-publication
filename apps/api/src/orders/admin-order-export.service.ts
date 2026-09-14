import { BadRequestException, Inject, Injectable, PayloadTooLargeException } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";

// D1 has a conservative bound on SQL parameters. Keeping this at 100 also
// keeps the related-item IN query inside that runtime limit.
export const MAX_ADMIN_ORDER_EXPORT_ROWS = 100;
export const MAX_ADMIN_ORDER_EXPORT_ITEMS = 1_000;
const ORDER_ID_QUERY_CHUNK = 50;

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

const paymentStatuses = ["unpaid", "pending", "paid", "failed", "refunded"] as const;

const exportQuerySchema = z
  .object({
    q: z.string().max(120, "Search text is too long.").optional(),
    orderStatus: z.enum(orderStatuses).optional(),
    paymentStatus: z.enum(paymentStatuses).optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    q: value.q?.trim() || undefined,
  }));

const header = [
  "Order Number",
  "Customer Name",
  "Phone",
  "District",
  "Delivery Area",
  "Payment Method",
  "Payment Status",
  "Order Status",
  "Subtotal",
  "Discount",
  "Delivery",
  "Grand Total",
  "Items",
  "Created At",
] as const;

type ExportQuery = z.output<typeof exportQuerySchema>;

function cleanText(value: unknown): string {
  // Keep tab and CR/LF so legitimate spreadsheet and address content survives,
  // but remove control characters that are not meaningful in CSV cells.
  return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function csvText(value: unknown, protectFormula = true): string {
  const text = cleanText(value);
  const safe = protectFormula && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function moneyText(value: { toString(): string } | number | string): string {
  // Decimal.toString() preserves the stored money value without reintroducing
  // floating-point artefacts through Number conversion.
  return value.toString();
}

@Injectable()
export class AdminOrderExportService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async export(query: unknown) {
    const parsed = exportQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message || "Invalid export query.");
    }

    const where = this.where(parsed.data);
    // Fetch one extra row only to reliably reject an oversized export rather
    // than silently truncating it.
    const orders = await this.prisma.client.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: MAX_ADMIN_ORDER_EXPORT_ROWS + 1,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        district: true,
        deliveryArea: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        subtotal: true,
        discountTotal: true,
        deliveryCharge: true,
        grandTotal: true,
        createdAt: true,
      },
    });

    if (orders.length > MAX_ADMIN_ORDER_EXPORT_ROWS) {
      throw new PayloadTooLargeException(
        `This export exceeds ${MAX_ADMIN_ORDER_EXPORT_ROWS} orders. Narrow the filters and try again.`,
      );
    }

    const orderIds = orders.map((order) => order.id);
    // Keep D1 IN lists below its parameter ceiling. At most two chunks are
    // possible with the order cap, so this remains a fixed bounded workload.
    const orderIdChunks = Array.from(
      { length: Math.ceil(orderIds.length / ORDER_ID_QUERY_CHUNK) },
      (_, index) => orderIds.slice(index * ORDER_ID_QUERY_CHUNK, (index + 1) * ORDER_ID_QUERY_CHUNK),
    );
    let itemCount = 0;
    for (const orderIdChunk of orderIdChunks) {
      itemCount += await this.prisma.client.orderItem.count({
        where: { orderId: { in: orderIdChunk } },
      });
      if (itemCount > MAX_ADMIN_ORDER_EXPORT_ITEMS) break;
    }
    if (itemCount > MAX_ADMIN_ORDER_EXPORT_ITEMS) {
      throw new PayloadTooLargeException(
        `This export exceeds ${MAX_ADMIN_ORDER_EXPORT_ITEMS} order items. Narrow the filters and try again.`,
      );
    }

    const items = (
      await Promise.all(
        orderIdChunks.map((orderIdChunk) =>
          this.prisma.client.orderItem.findMany({
            where: { orderId: { in: orderIdChunk } },
            select: { orderId: true, bookTitleSnapshot: true, quantity: true },
          }),
        ),
      )
    ).flat();
    const itemsByOrder = new Map<string, Array<{ bookTitleSnapshot: string; quantity: number }>>();
    for (const item of items) {
      const orderItems = itemsByOrder.get(item.orderId) ?? [];
      orderItems.push(item);
      itemsByOrder.set(item.orderId, orderItems);
    }

    const rows = orders.map((order) => [
      order.orderNumber,
      order.customerName,
      order.customerPhone,
      order.district,
      order.deliveryArea,
      order.paymentMethod,
      order.paymentStatus,
      order.orderStatus,
      moneyText(order.subtotal),
      moneyText(order.discountTotal),
      moneyText(order.deliveryCharge),
      moneyText(order.grandTotal),
      (itemsByOrder.get(order.id) ?? [])
        .map((item) => `${item.bookTitleSnapshot} x ${item.quantity}`)
        .join("; "),
      order.createdAt.toISOString(),
    ]);

    return {
      csv: [header, ...rows].map((row) => row.map((cell) => csvText(cell)).join(",")).join("\n"),
      filename: `orders-${Date.now()}.csv`,
    };
  }

  private where(query: ExportQuery): Prisma.OrderWhereInput {
    return {
      AND: [
        query.q
          ? {
              OR: [
                { orderNumber: { contains: query.q } },
                { customerName: { contains: query.q } },
                { customerPhone: { contains: query.q } },
                { customerEmail: { contains: query.q } },
                { customer: { is: { email: { contains: query.q } } } },
                { customer: { is: { phone: { contains: query.q } } } },
              ],
            }
          : {},
        query.orderStatus ? { orderStatus: query.orderStatus } : {},
        query.paymentStatus ? { paymentStatus: query.paymentStatus } : {},
      ],
    };
  }
}
