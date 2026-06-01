"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ShoppingCart } from "lucide-react";
import type { PaymentMethod } from "@prisma/client";
import {
  type DeliveryAreaOption,
  paymentInstructions,
  paymentMethodLabels
} from "@/lib/constants";
import { clearCart, useCart } from "@/lib/cart-client";
import { formatCurrency } from "@/lib/format";
import { calculateCartTotals } from "@/lib/order-utils";
import { EmptyState } from "@/components/site/empty-state";

export function CheckoutPageClient({
  deliveryOptions
}: {
  deliveryOptions: DeliveryAreaOption[];
}) {
  const router = useRouter();
  const cart = useCart();
  const [deliveryArea, setDeliveryArea] = useState("other");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totals = calculateCartTotals(cart.items, deliveryArea, deliveryOptions);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      customerEmail: formData.get("customerEmail"),
      shippingAddress: formData.get("shippingAddress"),
      district: formData.get("district"),
      deliveryArea,
      paymentMethod,
      transactionId: formData.get("transactionId"),
      notes: formData.get("notes"),
      items: cart.items.map((item) => ({
        bookId: item.bookId,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        ok?: boolean;
        orderNumber?: string;
        message?: string;
      };
      if (!response.ok || !result.ok || !result.orderNumber) {
        throw new Error(result.message || "Failed to create order.");
      }
      clearCart();
      router.push(`/order-success/${result.orderNumber}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!cart.items.length) {
    return (
      <div className="container-px mx-auto max-w-4xl py-10">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add at least one book before starting guest checkout."
        />
        <div className="mt-5 text-center">
          <Link
            href="/books"
            className="inline-flex rounded-md bg-navy px-5 py-3 text-sm font-extrabold text-white"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-px mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">
          Guest Checkout
        </h1>
        <p className="mt-2 text-sm text-muted">
          No customer account, login, or registration needed.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5 rounded-lg border border-line bg-white p-5 shadow-sm">
          {error ? (
            <div className="flex gap-2 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="form-label">Customer name *</span>
              <input name="customerName" required className="form-input mt-1" />
            </label>
            <label>
              <span className="form-label">Phone number *</span>
              <input
                name="customerPhone"
                required
                placeholder="01XXXXXXXXX"
                className="form-input mt-1"
              />
            </label>
            <label>
              <span className="form-label">Email</span>
              <input
                name="customerEmail"
                type="email"
                className="form-input mt-1"
              />
            </label>
            <label>
              <span className="form-label">District *</span>
              <input name="district" required className="form-input mt-1" />
            </label>
          </div>

          <label>
            <span className="form-label">Full shipping address *</span>
            <textarea
              name="shippingAddress"
              required
              rows={4}
              className="form-input mt-1"
            />
          </label>

          <label>
            <span className="form-label">Delivery area *</span>
            <select
              value={deliveryArea}
              onChange={(event) => setDeliveryArea(event.target.value)}
              className="form-input mt-1"
            >
              {deliveryOptions.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label} - {formatCurrency(area.charge)}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="form-label">Payment method *</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  "cash_on_delivery",
                  "bkash",
                  "nagad",
                  "rocket"
                ] as PaymentMethod[]
              ).map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-line p-3 text-sm font-bold"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  {paymentMethodLabels[method]}
                </label>
              ))}
            </div>
          </div>

          {paymentMethod !== "cash_on_delivery" ? (
            <div className="rounded-md border border-gold bg-gold/10 p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-navy">
                <CheckCircle2 className="h-4 w-4 text-emerald" aria-hidden="true" />
                Manual payment instructions
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {paymentInstructions[paymentMethod]}
              </p>
              <label className="mt-3 block">
                <span className="form-label">Transaction ID *</span>
                <input name="transactionId" required className="form-input mt-1" />
              </label>
            </div>
          ) : null}

          <label>
            <span className="form-label">Order note</span>
            <textarea name="notes" rows={3} className="form-input mt-1" />
          </label>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-navy">Order summary</h2>
          <div className="mt-4 grid gap-3">
            {cart.items.map((item) => (
              <div key={item.bookId} className="flex justify-between gap-3 text-sm">
                <span className="text-muted">
                  {item.title} × {item.quantity}
                </span>
                <span className="font-bold">
                  {formatCurrency(item.salePrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-bold">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Discount</span>
              <span className="font-bold text-danger">
                -{formatCurrency(totals.discountTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span className="font-bold">{formatCurrency(totals.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <span className="font-extrabold text-navy">Grand total</span>
              <span className="font-extrabold text-navy">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring mt-5 min-h-12 w-full rounded-md bg-emerald px-5 py-3 text-sm font-extrabold text-white disabled:bg-muted/40"
          >
            {isSubmitting ? "Creating order..." : "Place order"}
          </button>
        </aside>
      </form>
    </div>
  );
}
