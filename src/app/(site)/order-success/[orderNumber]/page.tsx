import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { fetchCustomerApi, getCurrentCustomer } from "@/lib/customer-auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { fetchPublicApi } from "@/lib/public-api";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type PageProps = {
  params: Promise<{ orderNumber: string }>;
};

type PublicOrderConfirmation = {
  orderNumber: string;
  createdAt: string;
  paymentMethod: keyof typeof paymentMethodLabels;
  paymentStatus: keyof typeof paymentStatusLabels;
  orderStatus: keyof typeof orderStatusLabels;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    delivery: number;
    grandTotal: number;
  };
};

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const [order, currentCustomer] = await Promise.all([
    fetchPublicApi<PublicOrderConfirmation>(
      `/orders/confirmation/${encodeURIComponent(orderNumber)}`,
    ).catch(() => null),
    getCurrentCustomer()
  ]);

  if (!order) {
    return (
      <div className="container-px mx-auto max-w-3xl py-12">
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <h1 className="text-2xl font-medium text-forest">Order not found</h1>
          <Link
            href="/books"
            className="mt-5 inline-flex rounded-md bg-forest px-5 py-3 text-sm font-extrabold text-white"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  // The confirmation endpoint intentionally does not expose customer IDs.
  // When signed in, the existing guarded customer endpoint authoritatively
  // decides whether this order belongs to the current customer.
  const customerOrderResponse = currentCustomer
    ? await fetchCustomerApi(
        `/customers/me/orders/${encodeURIComponent(order.orderNumber)}`,
      )
    : null;
  const belongsToCurrentCustomer = Boolean(customerOrderResponse?.ok);

  return (
    <div className="container-px mx-auto max-w-3xl py-10">
      <div className="rounded-lg border border-line bg-white p-6 text-center shadow-sm sm:p-8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-3xl font-medium text-forest">
          Order placed successfully
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your order number is{" "}
          <span className="font-extrabold text-ink">{order.orderNumber}</span>.
          {belongsToCurrentCustomer
            ? " You can also view it from your account."
            : " Please keep it for future communication."}
        </p>
        {belongsToCurrentCustomer ? (
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="premium-button-secondary mt-5"
          >
            View from account
          </Link>
        ) : null}
      </div>

      <div className="mt-5 rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-forest">Order details</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Date" value={formatDate(order.createdAt)} />
          <Info label="Payment method" value={paymentMethodLabels[order.paymentMethod]} />
          <Info label="Payment status" value={paymentStatusLabels[order.paymentStatus]} />
          <Info label="Order status" value={orderStatusLabels[order.orderStatus]} />
          <Info label="Delivery charge" value={formatCurrency(order.totals.delivery)} />
          <Info label="Grand total" value={formatCurrency(order.totals.grandTotal)} />
        </div>

        <div className="mt-5 border-t border-line pt-4">
          {order.items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex justify-between gap-4 py-2 text-sm">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span className="font-bold">{formatCurrency(item.price)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bold text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}
