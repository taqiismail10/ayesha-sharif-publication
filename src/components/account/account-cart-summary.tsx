"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-client";
import { formatCurrency } from "@/lib/format";

function cartTotal(items: ReturnType<typeof useCart>["items"]) {
  return items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
}

function cartLabel(count: number) {
  return count === 1 ? "1 book" : `${count} books`;
}

export function AccountCartOverviewCard({
  title = "Cart",
  helperText,
  emptyLabel = "Empty",
  linkLabel,
  href,
}: {
  title?: string;
  helperText?: string;
  emptyLabel?: string;
  linkLabel?: string;
  href?: string;
}) {
  const cart = useCart();
  const total = cartTotal(cart.items);
  const targetHref = href || (cart.count > 0 ? "/cart" : "/books");
  const targetLabel = linkLabel || (cart.count > 0 ? "View cart" : "Browse books");

  return (
    <div className="flex min-h-[188px] flex-col rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-soft">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-page text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <p className="mt-2 text-2xl font-medium text-forest">
        {cart.count > 0 ? cartLabel(cart.count) : emptyLabel}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        {cart.count > 0
          ? helperText || `Estimated total: ${formatCurrency(total)}`
          : helperText || "Your cart is empty"}
      </p>
      <Link
        href={targetHref}
        className="focus-ring mt-auto inline-flex w-fit pt-4 text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
      >
        {targetLabel}
      </Link>
    </div>
  );
}

export function AccountCartShortcutSection() {
  const cart = useCart();
  const total = cartTotal(cart.items);

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-medium text-forest">Cart</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Pick up where you left off and head back to checkout when you are ready.
      </p>

      {cart.count > 0 ? (
        <div className="mt-4 rounded-lg border border-line/80 bg-page/40 p-4">
          <p className="text-base font-medium text-forest">{cartLabel(cart.count)}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Estimated total: {formatCurrency(total)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cart" className="premium-button-secondary w-fit">
              View cart
            </Link>
            <Link
              href="/checkout"
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-emerald px-4 py-2 text-sm font-extrabold text-white"
            >
              Checkout
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-line/80 bg-page/35 p-4">
          <p className="text-base font-medium text-forest">Your cart is empty</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Add a few books and come back here to jump into checkout.
          </p>
          <Link
            href="/books"
            className="focus-ring mt-4 inline-flex text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
          >
            Browse books
          </Link>
        </div>
      )}
    </section>
  );
}
