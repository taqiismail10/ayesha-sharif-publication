import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "@/lib/constants";
import { PrintButton } from "@/components/admin/print-button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: PageProps) {
  await requireAdmin(["super_admin", "admin", "order_manager"]);
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 shadow-sm print:shadow-none">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-extrabold text-navy">Invoice</h1>
        <PrintButton />
      </div>

      <div className="border-b border-line pb-5">
        <h2 className="text-3xl font-extrabold text-navy">
          Ayesha-Sharif Publication
        </h2>
        <p className="mt-1 text-sm text-muted">Simple bookstore invoice</p>
      </div>

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold text-muted">Invoice for</p>
          <p className="mt-1 font-extrabold">{order.customerName}</p>
          <p>{order.customerPhone}</p>
          <p>{order.shippingAddress}</p>
          <p>{order.district}</p>
        </div>
        <div className="sm:text-right">
          <p>
            <span className="font-bold text-muted">Order:</span> {order.orderNumber}
          </p>
          <p>
            <span className="font-bold text-muted">Date:</span>{" "}
            {formatDate(order.createdAt)}
          </p>
          <p>
            <span className="font-bold text-muted">Payment:</span>{" "}
            {paymentMethodLabels[order.paymentMethod]}
          </p>
          <p>
            <span className="font-bold text-muted">Payment status:</span>{" "}
            {paymentStatusLabels[order.paymentStatus]}
          </p>
          <p>
            <span className="font-bold text-muted">Order status:</span>{" "}
            {orderStatusLabels[order.orderStatus]}
          </p>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-cream text-left">
            <th className="p-3">Book</th>
            <th className="p-3">Qty</th>
            <th className="p-3">Unit</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-line">
              <td className="p-3">{item.bookTitleSnapshot}</td>
              <td className="p-3">{item.quantity}</td>
              <td className="p-3">{formatCurrency(item.unitPrice)}</td>
              <td className="p-3 text-right">{formatCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-5 grid max-w-xs gap-2 text-sm">
        <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
        <Row label="Discount" value={`-${formatCurrency(order.discountTotal)}`} />
        <Row label="Delivery" value={formatCurrency(order.deliveryCharge)} />
        <Row label="Grand total" value={formatCurrency(order.grandTotal)} strong />
      </div>
    </div>
  );
}

function Row({
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
      className={`flex justify-between gap-4 ${strong ? "border-t border-line pt-2 text-base font-extrabold text-navy" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
