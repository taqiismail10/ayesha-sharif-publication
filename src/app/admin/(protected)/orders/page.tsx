import Link from "next/link";
import { Download, Eye } from "lucide-react";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireAdmin(["super_admin", "admin", "order_manager"]);
  const params = await searchParams;
  const q = pick(params.q);
  const orderStatus = pick(params.orderStatus) as OrderStatus | undefined;
  const paymentStatus = pick(params.paymentStatus) as PaymentStatus | undefined;

  const orders = await prisma.order.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { customerName: { contains: q, mode: "insensitive" } },
                { customerPhone: { contains: q, mode: "insensitive" } }
              ]
            }
          : {},
        orderStatus ? { orderStatus } : {},
        paymentStatus ? { paymentStatus } : {}
      ]
    },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" }
  });

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (orderStatus) query.set("orderStatus", orderStatus);
  if (paymentStatus) query.set("paymentStatus", paymentStatus);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-navy">Orders</h1>
          <p className="mt-2 text-sm text-muted">
            Search, filter, update status, print invoices, and export CSV.
          </p>
        </div>
        <Link
          href={`/api/admin/orders/export?${query.toString()}`}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gold px-4 py-2 text-sm font-extrabold text-navy"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </Link>
      </div>

      <form className="mb-4 grid gap-3 rounded-lg border border-line bg-white p-3 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Order number, phone, customer"
          className="form-input"
        />
        <select
          name="orderStatus"
          defaultValue={orderStatus || ""}
          className="form-input"
        >
          <option value="">All order statuses</option>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="paymentStatus"
          defaultValue={paymentStatus || ""}
          className="form-input"
        >
          <option value="">All payment statuses</option>
          {Object.entries(paymentStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-navy px-4 py-2 text-sm font-extrabold text-white">
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full min-w-[980px]">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-extrabold text-navy">{order.orderNumber}</td>
                  <td>
                    <p className="font-bold">{order.customerName}</p>
                    <p className="text-xs text-muted">{order.customerPhone}</p>
                  </td>
                  <td>{order._count.items}</td>
                  <td>{formatCurrency(order.grandTotal)}</td>
                  <td>
                    <p>{paymentMethodLabels[order.paymentMethod]}</p>
                    <p className="text-xs font-bold text-muted">
                      {paymentStatusLabels[order.paymentStatus]}
                    </p>
                  </td>
                  <td>{orderStatusLabels[order.orderStatus]}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-navy"
                      aria-label="View order"
                      title="View order"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!orders.length ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">
                    No orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
