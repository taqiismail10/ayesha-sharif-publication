import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, PackageCheck, Truck } from "lucide-react";
import { fetchCustomerApi, requireCustomer } from "@/lib/customer-auth";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "@/lib/constants";

type PageProps = {
  params: Promise<{ orderNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber}`
  };
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  await requireCustomer();
  const { orderNumber } = await params;
  const response = await fetchCustomerApi(
    `/customers/me/orders/${encodeURIComponent(orderNumber)}`,
  );
  const order = response?.ok ? await response.json() : null;

  if (!order) notFound();

  return (
    <div className="container-px mx-auto max-w-5xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="story-kicker">Order details</p>
          <h1 className="font-serif text-3xl font-medium text-forest">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <Link href="/account/orders" className="premium-button-secondary w-fit">
          Back to orders
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-medium text-forest">Books ordered</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 rounded-md bg-cream p-3 text-sm"
              >
                <div>
                  <Link
                    href={`/books/${item.book.slug}`}
                    className="font-medium text-forest"
                  >
                    {item.bookTitleSnapshot}
                  </Link>
                  <p className="mt-1 text-muted">
                    {item.book.author} · Qty {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(item.totalPrice)}</p>
                  <p className="text-xs text-muted">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 border-t border-line pt-4 text-sm">
            <TotalLine label="Subtotal" value={formatCurrency(Number(order.subtotal))} />
            <TotalLine
              label="Discount"
              value={`-${formatCurrency(Number(order.discountTotal))}`}
            />
            <TotalLine
              label="Delivery"
              value={formatCurrency(Number(order.deliveryCharge))}
            />
            <TotalLine
              label="Grand total"
              value={formatCurrency(Number(order.grandTotal))}
              strong
            />
          </div>
        </section>

        <aside className="grid h-fit gap-5">
          <InfoPanel
            icon={PackageCheck}
            title="Status"
            rows={[
              ["Order", orderStatusLabels[order.orderStatus]],
              ["Payment", paymentStatusLabels[order.paymentStatus]],
              ["Method", paymentMethodLabels[order.paymentMethod]]
            ]}
          />
          <InfoPanel
            icon={MapPin}
            title="Delivery"
            rows={[
              ["Name", order.customerName],
              ["Phone", order.customerPhone],
              ["District", order.district],
              ["Area", order.deliveryArea],
              ["Address", order.shippingAddress]
            ]}
          />
          <InfoPanel
            icon={Truck}
            title="Courier"
            rows={[
              ["Courier", order.courierName || "Not set"],
              ["Tracking", order.trackingNumber || "Not set"]
            ]}
          />
        </aside>
      </div>
    </div>
  );
}

function TotalLine({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? "text-base font-medium text-forest" : ""}`}
    >
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  rows
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-gold" aria-hidden={true} />
        <h2 className="text-lg font-medium text-forest">{title}</h2>
      </div>
      <div className="grid gap-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="font-bold text-muted">{label}</p>
            <p className="mt-1 font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
