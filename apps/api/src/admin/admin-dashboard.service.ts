import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const revenueOrderStatuses = ["confirmed", "processing", "shipped", "delivered"] as const;

@Injectable()
export class AdminDashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async dashboard() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [bookStatusCounts, orderStatusCounts, monthlyRevenue, lowStockBooks, recentOrders] = await Promise.all([
      this.prisma.client.book.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.client.order.groupBy({ by: ["orderStatus"], _count: { _all: true } }),
      this.prisma.client.order.aggregate({
        _sum: { grandTotal: true },
        where: { createdAt: { gte: monthStart }, orderStatus: { in: [...revenueOrderStatuses] } },
      }),
      this.prisma.client.book.findMany({
        where: { stockQuantity: { lte: 5 }, status: { in: ["published", "pre_order"] } },
        orderBy: { stockQuantity: "asc" },
        take: 6,
        select: { id: true, title: true, stockQuantity: true },
      }),
      this.prisma.client.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, orderNumber: true, customerName: true, grandTotal: true, orderStatus: true, createdAt: true },
      }),
    ]);

    const booksByStatus = new Map(bookStatusCounts.map((row) => [row.status, row._count._all]));
    const ordersByStatus = new Map(orderStatusCounts.map((row) => [row.orderStatus, row._count._all]));
    const totalBooks = [...booksByStatus.values()].reduce((total, count) => total + count, 0);
    const totalOrders = [...ordersByStatus.values()].reduce((total, count) => total + count, 0);

    return {
      counts: {
        totalBooks,
        publishedBooks: booksByStatus.get("published") ?? 0,
        upcomingBooks: booksByStatus.get("upcoming") ?? 0,
        outOfStockBooks: booksByStatus.get("out_of_stock") ?? 0,
        totalOrders,
        pendingOrders: ordersByStatus.get("pending") ?? 0,
        confirmedOrders: ordersByStatus.get("confirmed") ?? 0,
        deliveredOrders: ordersByStatus.get("delivered") ?? 0,
        cancelledOrders: ordersByStatus.get("cancelled") ?? 0,
      },
      monthlyRevenue: monthlyRevenue._sum.grandTotal ?? 0,
      lowStockBooks,
      recentOrders,
    };
  }
}
