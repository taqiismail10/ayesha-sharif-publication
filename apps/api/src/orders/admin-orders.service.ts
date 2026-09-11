import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { D1AtomicService } from "../prisma/d1-atomic.service";

@Injectable()
export class AdminOrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(D1AtomicService) private readonly atomic: D1AtomicService,
  ) {}

  async list(query: { q?: string; orderStatus?: string; paymentStatus?: string }) {
    const q = query.q?.trim();
    return this.prisma.client.order.findMany({
      where: {
        AND: [
          q ? { OR: [
            { orderNumber: { contains: q } },
            { customerName: { contains: q } },
            { customerPhone: { contains: q } },
            { customerEmail: { contains: q } },
          ] } : {},
          query.orderStatus ? { orderStatus: query.orderStatus as never } : {},
          query.paymentStatus ? { paymentStatus: query.paymentStatus as never } : {},
        ],
      },
      include: {
        _count: { select: { items: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async detail(id: string) {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: { include: { book: true } },
        customer: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found.");
    const linkedOrders = order.customerId
      ? await this.prisma.client.order.findMany({
          where: { customerId: order.customerId, id: { not: order.id } },
          orderBy: { createdAt: "desc" }, take: 5,
          select: { id: true, orderNumber: true, grandTotal: true, orderStatus: true, createdAt: true },
        })
      : [];
    return { ...order, linkedOrders };
  }

  async update(id: string, input: { orderStatus?: string; paymentStatus?: string; courierName?: string | null; trackingNumber?: string | null; adminNote?: string | null }) {
    const order = await this.prisma.client.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException("Order not found.");
    const orderStatus = input.orderStatus || order.orderStatus;
    const paymentStatus = input.paymentStatus || order.paymentStatus;
    const stockChanges: Array<{ bookId: string; quantity: number; direction: "increment" | "decrement" }> = [];
    let stockReduced = order.stockReduced;
    if (orderStatus === "confirmed" && !order.stockReduced) {
      stockChanges.push(...order.items.map((item) => ({ bookId: item.bookId, quantity: item.quantity, direction: "decrement" as const })));
      stockReduced = true;
    }
    if (orderStatus === "cancelled" && order.stockReduced && order.orderStatus !== "delivered") {
      stockChanges.push(...order.items.map((item) => ({ bookId: item.bookId, quantity: item.quantity, direction: "increment" as const })));
      stockReduced = false;
    }
    await this.atomic.updateOrderStatus({
      orderId: id, orderStatus, paymentStatus,
      courierName: input.courierName === undefined ? order.courierName : input.courierName,
      trackingNumber: input.trackingNumber === undefined ? order.trackingNumber : input.trackingNumber,
      adminNote: input.adminNote === undefined ? order.adminNote : input.adminNote,
      stockReduced, stockChanges,
    });
    return { ok: true };
  }
}
