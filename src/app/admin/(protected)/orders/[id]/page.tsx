import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { adminApi, requireAdmin } from "@/lib/auth";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateOrderAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  district: string | null;
  deliveryArea: string | null;
  shippingAddress: string | null;
  notes: string | null;
  stockReduced: boolean;
  orderStatus: keyof typeof orderStatusLabels;
  paymentMethod: keyof typeof paymentMethodLabels;
  paymentStatus: keyof typeof paymentStatusLabels;
  transactionId: string | null;
  subtotal: number | string;
  discountTotal: number | string;
  deliveryCharge: number | string;
  grandTotal: number | string;
  courierName: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  customer: { name: string; email: string | null; phone: string | null; isActive: boolean } | null;
  items: Array<{ id: string; bookTitleSnapshot: string; quantity: number; unitPrice: number | string; totalPrice: number | string; book: { stockQuantity: number } }>;
  linkedOrders: Array<{ id: string; orderNumber: string; grandTotal: number | string; orderStatus: keyof typeof orderStatusLabels }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  await requireAdmin(["super_admin", "admin", "order_manager"]);
  const { id } = await params;
  const response = await adminApi(`/admin/orders/${encodeURIComponent(id)}`);
  if (!response.ok) notFound();
  const order = (await response.json()) as AdminOrderDetail;
  const linkedOrders = order.linkedOrders;

  const action = updateOrderAction.bind(null, order.id);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-navy">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Placed {formatDate(order.createdAt)} by {order.customerName}
          </p>
        </div>
        <Link
          href={`/admin/orders/${order.id}/invoice`}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gold px-4 py-2 text-sm font-extrabold text-navy"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Invoice
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">Customer</h2>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Name" value={order.customerName} />
              <Info label="Phone" value={order.customerPhone} />
              <Info label="Email" value={order.customerEmail} />
              <Info label="District" value={order.district} />
              <Info label="Delivery area" value={order.deliveryArea} />
              <Info label="Address" value={order.shippingAddress} />
              <Info label="Customer note" value={order.notes} />
              <Info
                label="Linked account"
                value={
                  order.customer
                    ? `${order.customer.name} (${order.customer.email || order.customer.phone})`
                    : "Guest order"
                }
              />
              <Info
                label="Stock reduced"
                value={order.stockReduced ? "Yes" : "No"}
              />
            </div>
          </section>

          {order.customer ? (
            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-navy">
                Customer account history
              </h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Account name" value={order.customer.name} />
                <Info label="Account email" value={order.customer.email} />
                <Info label="Account phone" value={order.customer.phone} />
                <Info
                  label="Account status"
                  value={order.customer.isActive ? "Active" : "Inactive"}
                />
              </div>
              <div className="mt-4 grid gap-2">
                {linkedOrders.length ? (
                  linkedOrders.map((linkedOrder) => (
                    <Link
                      key={linkedOrder.id}
                      href={`/admin/orders/${linkedOrder.id}`}
                      className="flex justify-between gap-3 rounded-md bg-page p-3 text-sm"
                    >
                      <span className="font-extrabold text-navy">
                        {linkedOrder.orderNumber}
                      </span>
                      <span className="text-muted">
                        {orderStatusLabels[linkedOrder.orderStatus]} ·{" "}
                        {formatCurrency(linkedOrder.grandTotal)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-md bg-page p-3 text-sm text-muted">
                    No other linked orders for this customer.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-navy">Items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="admin-table w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Quantity</th>
                    <th>Unit price</th>
                    <th>Total</th>
                    <th>Current stock</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.bookTitleSnapshot}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                      <td>{item.book.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-navy">Manage order</h2>
          <form action={action} className="mt-4 grid gap-4">
            <label>
              <span className="form-label">Order status</span>
              <select
                name="orderStatus"
                defaultValue={order.orderStatus}
                className="form-input mt-1"
              >
                {Object.entries(orderStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="form-label">Payment status</span>
              <select
                name="paymentStatus"
                defaultValue={order.paymentStatus}
                className="form-input mt-1"
              >
                {Object.entries(paymentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="form-label">Courier name</span>
              <input
                name="courierName"
                defaultValue={order.courierName || ""}
                className="form-input mt-1"
              />
            </label>
            <label>
              <span className="form-label">Tracking number</span>
              <input
                name="trackingNumber"
                defaultValue={order.trackingNumber || ""}
                className="form-input mt-1"
              />
            </label>
            <label>
              <span className="form-label">Admin note</span>
              <textarea
                name="adminNote"
                rows={4}
                defaultValue={order.adminNote || ""}
                className="form-input mt-1"
              />
            </label>
            <button className="focus-ring min-h-12 rounded-md bg-emerald px-5 py-3 text-sm font-extrabold text-white">
              Save updates
            </button>
          </form>

          <div className="mt-6 grid gap-3 border-t border-line pt-4 text-sm">
            <Info label="Payment method" value={paymentMethodLabels[order.paymentMethod]} />
            <Info label="Payment status" value={paymentStatusLabels[order.paymentStatus]} />
            <Info label="Transaction ID" value={order.transactionId} />
            <Info label="Subtotal" value={formatCurrency(order.subtotal)} />
            <Info label="Discount" value={`-${formatCurrency(order.discountTotal)}`} />
            <Info label="Delivery" value={formatCurrency(order.deliveryCharge)} />
            <Info label="Grand total" value={formatCurrency(order.grandTotal)} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="font-bold text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-line font-semibold text-ink">
        {value || "Not set"}
      </p>
    </div>
  );
}
