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
import { adminApi } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { orderStatusLabels } from "@/lib/constants";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";

type DashboardData = {
  counts: {
    totalBooks: number;
    publishedBooks: number;
    upcomingBooks: number;
    outOfStockBooks: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  monthlyRevenue: number | string;
  lowStockBooks: Array<{ id: string; title: string; stockQuantity: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    grandTotal: number | string;
    orderStatus: keyof typeof orderStatusLabels;
    createdAt: string;
  }>;
};

export default async function AdminDashboardPage() {
  const response = await adminApi("/admin/dashboard");
  const dashboard: DashboardData = response.ok
    ? await response.json()
    : {
        counts: {
          totalBooks: 0, publishedBooks: 0, upcomingBooks: 0, outOfStockBooks: 0,
          totalOrders: 0, pendingOrders: 0, confirmedOrders: 0, deliveredOrders: 0, cancelledOrders: 0,
        },
        monthlyRevenue: 0,
        lowStockBooks: [],
        recentOrders: [],
      };
  const { counts, lowStockBooks, recentOrders } = dashboard;

  const stats = [
    { title: "Total books", value: counts.totalBooks, icon: BookOpen },
    { title: "Published books", value: counts.publishedBooks, icon: CheckCircle2 },
    { title: "Upcoming books", value: counts.upcomingBooks, icon: CalendarClock },
    { title: "Out of stock", value: counts.outOfStockBooks, icon: AlertTriangle },
    { title: "Total orders", value: counts.totalOrders, icon: ShoppingBag },
    { title: "Pending orders", value: counts.pendingOrders, icon: AlertTriangle },
    { title: "Confirmed orders", value: counts.confirmedOrders, icon: PackageCheck },
    { title: "Delivered orders", value: counts.deliveredOrders, icon: CheckCircle2 },
    { title: "Cancelled orders", value: counts.cancelledOrders, icon: XCircle },
    {
      title: "Monthly revenue",
      value: formatCurrency(dashboard.monthlyRevenue),
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
