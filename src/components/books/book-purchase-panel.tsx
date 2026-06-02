"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import type { BookStatus } from "@prisma/client";
import { addCartItem } from "@/lib/cart-client";
import { trackBookEvent } from "@/lib/tracking-client";
import type { BookDetailData } from "@/types";

const purchasableStatuses: BookStatus[] = ["published", "pre_order"];

export function BookPurchasePanel({ book }: { book: BookDetailData }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const canBuy = purchasableStatuses.includes(book.status) && book.stockQuantity > 0;
  const maxQuantity = Math.max(book.stockQuantity, 1);

  const item = {
    bookId: book.id,
    title: book.title,
    slug: book.slug,
    author: book.author,
    coverImage: book.coverImage,
    regularPrice: book.regularPrice,
    salePrice: book.salePrice,
    stockQuantity: book.stockQuantity,
    quantity
  };

  return (
    <div className="premium-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-muted">Quantity</span>
        <div className="flex items-center rounded-md border border-line bg-page">
          <button
            type="button"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center text-navy disabled:text-muted"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={!canBuy || quantity <= 1}
            aria-label="Decrease quantity"
            title="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-extrabold">{quantity}</span>
          <button
            type="button"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center text-navy disabled:text-muted"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            disabled={!canBuy || quantity >= maxQuantity}
            aria-label="Increase quantity"
            title="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!canBuy}
          onClick={() => {
            addCartItem(item);
            trackBookEvent({
              bookId: book.id,
              eventType: "add_to_cart",
              source: "book_detail"
            });
          }}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-emerald px-4 py-3 text-sm font-extrabold text-emerald transition hover:bg-emerald/10 disabled:cursor-not-allowed disabled:border-muted/40 disabled:text-muted"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          Add to cart
        </button>
        <button
          type="button"
          disabled={!canBuy}
          onClick={() => {
            addCartItem(item);
            trackBookEvent({
              bookId: book.id,
              eventType: "add_to_cart",
              source: "buy_now"
            });
            router.push("/checkout");
          }}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald/90 disabled:cursor-not-allowed disabled:bg-muted/40"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          Buy now
        </button>
      </div>

      {!canBuy ? (
        <p className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          This book is currently not available for checkout.
        </p>
      ) : null}
    </div>
  );
}
