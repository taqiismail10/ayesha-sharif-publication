"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-client";

export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="focus-ring shine-hover relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-gold/40 bg-white/90 text-navy shadow-[0_10px_26px_rgba(16,35,63,0.1)] transition hover:-translate-y-0.5 hover:border-gold"
      aria-label="Open cart"
      title="Cart"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
