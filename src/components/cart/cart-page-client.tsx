"use client";

import Link from "next/link";
import { memo, useCallback, useMemo, useState } from "react";
import { ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import type { DeliveryAreaOption } from "@/lib/constants";
import { getItemQuantity, useCart, type CartItem } from "@/lib/cart-client";
import { formatCurrency } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useToast } from "@/components/ui/toast";
import { calculateCartTotals } from "@/lib/order-utils";
import { BookCover } from "@/components/books/book-cover";
import { CartRecommendationSection } from "@/components/books/client-recommendation-section";
import { EmptyState } from "@/components/site/empty-state";

export function CartPageClient({
  deliveryOptions
}: {
  deliveryOptions: DeliveryAreaOption[];
}) {
  const cart = useCart();
  const [deliveryArea, setDeliveryArea] = useState("other");
  const totals = useMemo(
    () => calculateCartTotals(cart.items, deliveryArea, deliveryOptions),
    [cart.items, deliveryArea, deliveryOptions],
  );
  const cartBookIds = useMemo(
    () => cart.items.map((item) => item.bookId),
    [cart.items],
  );

  if (!cart.items.length) {
    return (
      <div className="container-px mx-auto max-w-4xl py-10">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the catalogue and add books to place a guest order."
          action={{ label: "Browse Books", href: "/books" }}
        />
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
            <CartRow
              key={item.bookId}
              item={item}
              onIncrement={cart.incrementItem}
              onDecrement={cart.decrementItem}
              onRemove={cart.removeItem}
            />
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

      <div className="mt-8">
        <CartRecommendationSection bookIds={cartBookIds} />
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

/**
 * CartRow — single line item.
 * Memoised so unrelated state (delivery area, totals) does not re-render the row.
 * Handlers are wrapped in useCallback inside so QuantityStepper + remove button
 * see stable props between renders.
 */
const CartRow = memo(function CartRow({
  item,
  onIncrement,
  onDecrement,
  onRemove
}: {
  item: CartItem;
  onIncrement: (bookId: string) => number;
  onDecrement: (bookId: string) => number;
  onRemove: (bookId: string) => void;
}) {
  const toast = useToast();
  const decreaseLabel = `Decrease quantity for ${item.title}`;
  const increaseLabel = `Increase quantity for ${item.title}`;
  const removeLabel = `Remove ${item.title} from cart`;

  const handleIncrement = useCallback(
    () => onIncrement(item.bookId),
    [onIncrement, item.bookId],
  );
  const handleDecrement = useCallback(
    () => {
      const previousQuantity = getItemQuantity(item.bookId);
      const nextQuantity = onDecrement(item.bookId);
      if (previousQuantity === 1 && nextQuantity === 0) {
        toast.info({
          title: "Removed from cart",
          description: item.title,
          duration: 2200,
        });
      }
    },
    [item.bookId, item.title, onDecrement, toast],
  );
  const handleRemove = useCallback(
    () => {
      if (getItemQuantity(item.bookId) === 0) return;
      onRemove(item.bookId);
      toast.info({
        title: "Removed from cart",
        description: item.title,
        duration: 2200,
      });
    },
    [item.bookId, item.title, onRemove, toast],
  );

  return (
    <div
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
        <QuantityStepper
          value={item.quantity}
          min={0}
          max={Math.max(item.stockQuantity, item.quantity)}
          size="md"
          active
          valueLabel={`Quantity for ${item.title}`}
          decreaseLabel={decreaseLabel}
          increaseLabel={increaseLabel}
          onDecrement={handleDecrement}
          onIncrement={handleIncrement}
        />
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <p
            className="whitespace-nowrap text-sm font-bold text-navy"
            aria-label={`Subtotal for ${item.title}: ${formatCurrency(item.salePrice * item.quantity)}`}
          >
            Subtotal: {formatCurrency(item.salePrice * item.quantity)}
          </p>
          <button
            type="button"
            onClick={handleRemove}
            className="cart-remove-button inline-flex h-11 w-11 items-center justify-center"
            aria-label={removeLabel}
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
});

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
        <span className="font-bold"><AnimatedNumber value={totals.subtotal} format={formatCurrency} /></span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Discount</span>
        <span className="font-bold text-danger">-<AnimatedNumber value={totals.discountTotal} format={formatCurrency} /></span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Delivery</span>
        <span className="font-bold"><AnimatedNumber value={totals.deliveryCharge} format={formatCurrency} /></span>
      </div>
      <div className="border-t border-line pt-3">
        <div className="flex justify-between text-base">
          <span className="font-extrabold text-navy">Grand total</span>
          <span className="font-extrabold text-navy"><AnimatedNumber value={totals.grandTotal} format={formatCurrency} /></span>
        </div>
      </div>
    </div>
  );
}
