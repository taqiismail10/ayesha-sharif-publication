import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "@/lib/constants";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true }
  });

  if (!order) {
    return (
      <div className="container-px mx-auto max-w-3xl py-12">
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <h1 className="text-2xl font-extrabold text-navy">Order not found</h1>
          <Link
            href="/books"
            className="mt-5 inline-flex rounded-md bg-navy px-5 py-3 text-sm font-extrabold text-white"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-px mx-auto max-w-3xl py-10">
      <div className="rounded-lg border border-line bg-white p-6 text-center shadow-sm sm:p-8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-3xl font-extrabold text-navy">
          Order placed successfully
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your order number is{" "}
          <span className="font-extrabold text-ink">{order.orderNumber}</span>.
          Please keep it for future communication.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Order details</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Date" value={formatDate(order.createdAt)} />
          <Info label="Payment method" value={paymentMethodLabels[order.paymentMethod]} />
          <Info label="Payment status" value={paymentStatusLabels[order.paymentStatus]} />
          <Info label="Order status" value={orderStatusLabels[order.orderStatus]} />
          <Info label="Delivery charge" value={formatCurrency(order.deliveryCharge)} />
          <Info label="Grand total" value={formatCurrency(order.grandTotal)} />
        </div>

        <div className="mt-5 border-t border-line pt-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 py-2 text-sm">
              <span>
                {item.bookTitleSnapshot} × {item.quantity}
              </span>
              <span className="font-bold">{formatCurrency(item.totalPrice)}</span>
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
