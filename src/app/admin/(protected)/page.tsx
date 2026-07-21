import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  ShoppingBag,
  XCircle
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { orderStatusLabels } from "@/lib/constants";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalBooks,
    publishedBooks,
    upcomingBooks,
    outOfStockBooks,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    cancelledOrders,
    monthlyRevenue,
    lowStockBooks,
    recentOrders
  ] = await Promise.all([
    prisma.book.count(),
    prisma.book.count({ where: { status: "published" } }),
    prisma.book.count({ where: { status: "upcoming" } }),
    prisma.book.count({ where: { status: "out_of_stock" } }),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: "pending" } }),
    prisma.order.count({ where: { orderStatus: "confirmed" } }),
    prisma.order.count({ where: { orderStatus: "delivered" } }),
    prisma.order.count({ where: { orderStatus: "cancelled" } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: {
        createdAt: { gte: monthStart },
        orderStatus: { in: ["confirmed", "processing", "shipped", "delivered"] }
      }
    }),
    prisma.book.findMany({
      where: {
        stockQuantity: { lte: 5 },
        status: { in: ["published", "pre_order"] }
      },
      orderBy: { stockQuantity: "asc" },
      take: 6
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6
    })
  ]);

  const stats = [
    { title: "Total books", value: totalBooks, icon: BookOpen },
    { title: "Published books", value: publishedBooks, icon: CheckCircle2 },
    { title: "Upcoming books", value: upcomingBooks, icon: CalendarClock },
    { title: "Out of stock", value: outOfStockBooks, icon: AlertTriangle },
    { title: "Total orders", value: totalOrders, icon: ShoppingBag },
    { title: "Pending orders", value: pendingOrders, icon: AlertTriangle },
    { title: "Confirmed orders", value: confirmedOrders, icon: PackageCheck },
    { title: "Delivered orders", value: deliveredOrders, icon: CheckCircle2 },
    { title: "Cancelled orders", value: cancelledOrders, icon: XCircle },
    {
      title: "Monthly revenue",
      value: formatCurrency(monthlyRevenue._sum.grandTotal),
      icon: CircleDollarSign
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">Dashboard</h1>
        <p className="mt-2 text-sm text-muted">
          Operational snapshot for books, stock, orders, and revenue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-navy">Low stock books</h2>
          <div className="mt-4 grid gap-3">
            {lowStockBooks.length ? (
              lowStockBooks.map((book) => (
                <div key={book.id} className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold">{book.title}</span>
                  <span className="font-extrabold text-danger">
                    {book.stockQuantity} left
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No low stock books.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-navy">Recent orders</h2>
          <div className="mt-4 grid gap-3">
            {recentOrders.length ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-page p-3 text-sm"
                >
                  <div>
                    <p className="font-extrabold text-navy">{order.orderNumber}</p>
                    <p className="text-muted">
                      {order.customerName} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{formatCurrency(order.grandTotal)}</p>
                    <p className="admin-status-badge mt-1">
                      {orderStatusLabels[order.orderStatus]}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No orders yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
