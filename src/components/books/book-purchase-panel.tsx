"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import type { BookStatus } from "@prisma/client";
import { addCartItem } from "@/lib/cart-client";
import { trackBookEvent } from "@/lib/tracking-client";
import type { BookDetailData } from "@/types";

const purchasableStatuses: BookStatus[] = ["published", "pre_order"];

/* Shared transition for both action buttons */
const btnTransition =
  "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[1px] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

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
    quantity,
  };

  return (
    <div
      className="glass-panel rounded-[8px] p-5"
    >
      {/* Quantity stepper */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className="text-[13px] font-medium"
          style={{ color: "#B0A89C" }}
        >
          Quantity
        </span>
        <div
          className="flex items-center"
          style={{
            border: "1px solid rgba(176,168,156,0.4)",
            borderRadius: "4px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <button
            type="button"
            onClick={() => setQuantity((v) => Math.max(1, v - 1))}
            disabled={!canBuy || quantity <= 1}
            aria-label="Decrease quantity"
            className="inline-flex h-10 w-10 items-center justify-center transition-colors duration-150 hover:text-[#6B8E6F] disabled:opacity-40"
            style={{ color: "#2D4A2B" }}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span
            className="w-10 select-none text-center text-sm font-semibold"
            style={{ color: "#2D4A2B" }}
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((v) => Math.min(maxQuantity, v + 1))}
            disabled={!canBuy || quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="inline-flex h-10 w-10 items-center justify-center transition-colors duration-150 hover:text-[#6B8E6F] disabled:opacity-40"
            style={{ color: "#2D4A2B" }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <button
        type="button"
        disabled={!canBuy}
        onClick={() => {
          addCartItem(item);
          trackBookEvent({ bookId: book.id, eventType: "add_to_cart", source: "book_detail" });
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-[4px] py-[14px] text-[15px] font-medium text-white ${btnTransition}`}
        style={{ backgroundColor: canBuy ? "#6B8E6F" : "#B0A89C" }}
      >
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        {canBuy ? "Add to cart" : "Unavailable"}
      </button>

      {/* Buy Now */}
      <button
        type="button"
        disabled={!canBuy}
        onClick={() => {
          addCartItem(item);
          trackBookEvent({ bookId: book.id, eventType: "add_to_cart", source: "buy_now" });
          router.push("/checkout");
        }}
        className={`mt-2 flex w-full items-center justify-center gap-2 rounded-[4px] bg-transparent py-[14px] text-[15px] font-medium ${btnTransition}`}
        style={{
          border: "2px solid #2D4A2B",
          color: canBuy ? "#2D4A2B" : "#B0A89C",
          borderColor: canBuy ? "#2D4A2B" : "rgba(176,168,156,0.4)",
        }}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        Buy now
      </button>

      {/* Unavailability notice */}
      {!canBuy && (
        <p
          className="mt-3 rounded-[4px] px-3 py-2 text-[13px]"
          style={{
            backgroundColor: "rgba(176,168,156,0.1)",
            color: "#B0A89C",
          }}
        >
          This book is currently not available for purchase.
        </p>
      )}
    </div>
  );
}
