"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import type { BookStatus } from "@prisma/client";
import { addCartItem } from "@/lib/cart-client";
import { trackBookEvent } from "@/lib/tracking-client";
import { SavedBookToggle } from "@/components/books/saved-book-toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import type { BookDetailData } from "@/types";

const purchasableStatuses: BookStatus[] = ["published", "pre_order"];

/* Shared transition for both action buttons */
const btnTransition =
  "transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[1px] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-2";
const UNAVAILABLE_COPY = "This book is currently not available for purchase.";

export function BookPurchasePanel({ book }: { book: BookDetailData }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const canBuy = purchasableStatuses.includes(book.status) && book.stockQuantity > 0;
  const maxQuantity = Math.max(book.stockQuantity, 1);

  const item = useMemo(
    () => ({
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      author: book.author,
      coverImage: book.coverImage,
      regularPrice: book.regularPrice,
      salePrice: book.salePrice,
      stockQuantity: book.stockQuantity,
      quantity,
    }),
    [book.id, book.title, book.slug, book.author, book.coverImage, book.regularPrice, book.salePrice, book.stockQuantity, quantity],
  );

  const handleAddToCart = useCallback(() => {
    addCartItem(item);
    trackBookEvent({ bookId: book.id, eventType: "add_to_cart", source: "book_detail" });
  }, [item, book.id]);

  const handleBuyNow = useCallback(() => {
    addCartItem(item);
    trackBookEvent({ bookId: book.id, eventType: "add_to_cart", source: "buy_now" });
    router.push("/checkout");
  }, [item, book.id, router]);

  const addToCartButton = (
    <button
      type="button"
      disabled={!canBuy}
      onClick={handleAddToCart}
      className={`flex w-full items-center justify-center gap-2 rounded-[4px] py-[14px] text-[15px] font-medium text-white ${btnTransition}`}
      style={{ backgroundColor: canBuy ? "#6B8E6F" : "#B0A89C" }}
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      {canBuy ? "Add to cart" : "Unavailable"}
    </button>
  );

  const buyNowButton = (
    <button
      type="button"
      disabled={!canBuy}
      onClick={handleBuyNow}
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
  );

  return (
    <div className="glass-panel rounded-[8px] p-5">
      {/* Quantity stepper */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium" style={{ color: "#B0A89C" }}>
          Quantity
        </span>
        <QuantityStepper
          value={quantity}
          min={1}
          max={maxQuantity}
          disabled={!canBuy}
          onChange={setQuantity}
        />
      </div>

      {/* Add to Cart */}
      {canBuy ? (
        addToCartButton
      ) : (
        <Tooltip content={UNAVAILABLE_COPY} side="top">
          {addToCartButton}
        </Tooltip>
      )}

      {/* Buy Now */}
      {canBuy ? (
        buyNowButton
      ) : (
        <Tooltip content={UNAVAILABLE_COPY} side="top">
          {buyNowButton}
        </Tooltip>
      )}

      <SavedBookToggle
        bookId={book.id}
        title={book.title}
        variant="detail"
        className="mt-2"
      />

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
