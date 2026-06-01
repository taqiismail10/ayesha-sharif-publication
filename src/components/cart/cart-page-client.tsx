"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import type { DeliveryAreaOption } from "@/lib/constants";
import { useCart } from "@/lib/cart-client";
import { formatCurrency } from "@/lib/format";
import { calculateCartTotals } from "@/lib/order-utils";
import { BookCover } from "@/components/books/book-cover";
import { EmptyState } from "@/components/site/empty-state";
import { useState } from "react";

export function CartPageClient({
  deliveryOptions
}: {
  deliveryOptions: DeliveryAreaOption[];
}) {
  const cart = useCart();
  const [deliveryArea, setDeliveryArea] = useState("other");
  const totals = calculateCartTotals(cart.items, deliveryArea, deliveryOptions);

  if (!cart.items.length) {
    return (
      <div className="container-px mx-auto max-w-4xl py-10">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the catalogue and add books to place a guest order."
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
    <div className="container-px mx-auto max-w-6xl py-8 pb-28 md:pb-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">Cart</h1>
        <p className="mt-2 text-sm text-muted">
          Review quantities before checkout. No account is required.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3">
          {cart.items.map((item) => (
            <div
              key={item.bookId}
              className="grid grid-cols-[92px_1fr] gap-4 rounded-lg border border-line bg-white p-3 shadow-sm sm:grid-cols-[120px_1fr_auto]"
            >
              <BookCover title={item.title} author={item.author} image={item.coverImage} />
              <div>
                <Link
                  href={`/books/${item.slug}`}
                  className="font-extrabold leading-snug text-navy"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted">{item.author}</p>
                <p className="mt-3 font-extrabold text-navy">
                  {formatCurrency(item.salePrice)}
                </p>
                {item.salePrice < item.regularPrice ? (
                  <p className="text-sm text-muted line-through">
                    {formatCurrency(item.regularPrice)}
                  </p>
                ) : null}
              </div>
              <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
                <div className="flex items-center rounded-md border border-line bg-page">
                  <button
                    type="button"
                    className="focus-ring inline-flex h-10 w-10 items-center justify-center text-navy"
                    onClick={() => cart.setQuantity(item.bookId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-extrabold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="focus-ring inline-flex h-10 w-10 items-center justify-center text-navy"
                    onClick={() => cart.setQuantity(item.bookId, item.quantity + 1)}
                    aria-label="Increase quantity"
                    title="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => cart.removeItem(item.bookId)}
                  className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-danger"
                  aria-label={`Remove ${item.title}`}
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-navy">Order summary</h2>
          <label className="mt-4 block">
            <span className="form-label">Delivery area</span>
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
          <SummaryRows totals={totals} />
          <Link
            href="/checkout"
            className="focus-ring mt-5 hidden min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald px-5 py-3 text-sm font-extrabold text-white lg:inline-flex"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Checkout
          </Link>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-4 shadow-soft lg:hidden">
        <Link
          href="/checkout"
          className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald px-5 py-3 text-sm font-extrabold text-white"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Checkout - {formatCurrency(totals.grandTotal)}
        </Link>
      </div>
    </div>
  );
}

function SummaryRows({
  totals
}: {
  totals: {
    subtotal: number;
    discountTotal: number;
    deliveryCharge: number;
    grandTotal: number;
  };
}) {
  return (
    <div className="mt-5 grid gap-3 text-sm">
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
      <div className="border-t border-line pt-3">
        <div className="flex justify-between text-base">
          <span className="font-extrabold text-navy">Grand total</span>
          <span className="font-extrabold text-navy">
            {formatCurrency(totals.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
