"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-client";

export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="focus-ring shine-hover relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white/90 text-forest shadow-card transition hover:-translate-y-0.5 hover:border-white/40"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
      title="Cart"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
