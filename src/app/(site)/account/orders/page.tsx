import type { Metadata } from "next";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { fetchCustomerApi, requireCustomer } from "@/lib/customer-auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/constants";
import { EmptyState } from "@/components/site/empty-state";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View your Ayesha-Sharif Publication order history."
};

export default async function CustomerOrdersPage() {
  await requireCustomer();
  const response = await fetchCustomerApi("/customers/me/orders");
  const orders = response?.ok
    ? ((await response.json()) as Array<{
        id: string;
        orderNumber: string;
        createdAt: string;
        grandTotal: number | string;
        orderStatus: keyof typeof orderStatusLabels;
        paymentStatus: keyof typeof paymentStatusLabels;
        _count: { items: number };
      }>)
    : [];

  return (
    <div className="container-px mx-auto max-w-6xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="story-kicker">Reader account</p>
          <h1 className="font-serif text-3xl font-medium text-forest">
            My Orders
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Orders placed while signed in to your customer account.
          </p>
        </div>
        <Link href="/account" className="premium-button-secondary w-fit">
          Back to account
        </Link>
      </div>

      {orders.length ? (
        <div className="grid gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.orderNumber}`}
              className="rounded-lg border border-line bg-white p-4 shadow-sm transition hover:border-gold/60 hover:shadow-soft"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-medium text-forest">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(order.createdAt)} · {order._count.items} item
                    {order._count.items === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="grid gap-1 text-sm sm:text-right">
                  <p className="font-medium text-forest">
                    {formatCurrency(Number(order.grandTotal))}
                  </p>
                  <p className="font-semibold text-muted">
                    {orderStatusLabels[order.orderStatus]} ·{" "}
                    {paymentStatusLabels[order.paymentStatus]}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageCheck}
          title="No account orders yet"
          description="Orders placed as a guest will still work, but only signed-in checkout orders appear here."
        />
      )}
    </div>
  );
}
