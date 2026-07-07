"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { BookStatus } from "@prisma/client";
import { addCartItem } from "@/lib/cart-client";
import { formatCurrency } from "@/lib/format";
import { trackBookEvent } from "@/lib/tracking-client";
import type { BookCardData } from "@/types";
import { BookCover } from "@/components/books/book-cover";

const purchasableStatuses: BookStatus[] = ["published", "pre_order"];

/** Derives a 2-character display label from the title (first 2 non-space chars) */
function initials(title: string): string {
  return title.replace(/\s+/g, "").slice(0, 2) || "—";
}

export const ProductCard = memo(function ProductCard({ book }: { book: BookCardData }) {
  const isAvailable =
    purchasableStatuses.includes(book.status) && book.stockQuantity > 0;
  const isPreOrder = book.status === "pre_order";
  const isArchived = book.status === "archived";
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const coverError = Boolean(
    book.coverImage && failedCover === book.coverImage,
  );

  // Disable the card if it cannot be added to cart AND is not a published/pre-order
  const isCardDisabled = !isAvailable && !isPreOrder;

  const handleCoverClick = useCallback(() => {
    trackBookEvent({
      bookId: book.id,
      eventType: "search_click",
      source: "product_card_cover",
    });
  }, [book.id]);

  const handleTitleClick = useCallback(() => {
    trackBookEvent({
      bookId: book.id,
      eventType: "search_click",
      source: "product_card_title",
    });
  }, [book.id]);

  const handleAddToCart = useCallback(() => {
    addCartItem({
      bookId: book.id,
      title: book.title,
      slug: book.slug,
      author: book.author,
      coverImage: book.coverImage,
      regularPrice: book.regularPrice,
      salePrice: book.salePrice,
      stockQuantity: book.stockQuantity,
      quantity: 1,
    });
    trackBookEvent({
      bookId: book.id,
      eventType: "add_to_cart",
      source: "product_card",
    });
  }, [
    book.id,
    book.title,
    book.slug,
    book.author,
    book.coverImage,
    book.regularPrice,
    book.salePrice,
    book.stockQuantity,
  ]);

  const buttonLabel = isPreOrder
    ? "Pre-order"
    : isAvailable
      ? "Add to cart"
      : isArchived
        ? "Discontinued"
        : "Currently unavailable";

  const ariaLabel = `${isPreOrder ? "Pre-order" : "Add"} ${book.title} to cart`;

  return (
    <article
      className="group book-card-hover cv-auto flex h-full flex-col overflow-hidden rounded-[8px]"
      style={{
        /* Reserve the real rendered height so the SSR placeholder prevents CLS
           when cards stream in on scroll. Tune to your actual final height. */
        contentVisibility: "auto",
        containIntrinsicSize: "0 480px",
        /* Glass card: frosted panel with translucent white + blur */
        background: "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(12px) saturate(150%)",
        WebkitBackdropFilter: "blur(12px) saturate(150%)",
        border: "1px solid rgba(255, 255, 255, 0.55)",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      {/* Cover area */}
      <Link
        href={`/books/${book.slug}`}
        onClick={handleCoverClick}
        aria-label={`View ${book.title}`}
        tabIndex={isCardDisabled ? -1 : undefined}
        aria-disabled={isCardDisabled || undefined}
        className="cover-zoom-container block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-2 rounded-t-[8px]"
      >
        {coverError ? (
          /* Image load error → show initials fallback */
          <div
            className="flex aspect-[3/4] w-full items-center justify-center"
            style={{ backgroundColor: "rgba(107, 142, 111, 0.1)" }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "28px",
                color: "#B0A89C",
                userSelect: "none",
              }}
            >
              {initials(book.title)}
            </span>
          </div>
        ) : (
          <BookCover
            title={book.title}
            author={book.author}
            image={book.coverImage}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onImageError={() => setFailedCover(book.coverImage)}
          />
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <Link
          href={`/books/${book.slug}`}
          onClick={handleTitleClick}
          tabIndex={isCardDisabled ? -1 : undefined}
          aria-disabled={isCardDisabled || undefined}
          className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-2"
        >
          <h3
            className="line-clamp-2 transition-colors duration-150 hover:text-[#D4A574]"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "16px",
              fontWeight: 400,
              color: "#2D4A2B",
              lineHeight: 1.35,
            }}
          >
            {book.title}
          </h3>
        </Link>

        {/* Author — Crimson Text italic (approved italic use) */}
        <p
          className="mt-1 line-clamp-1"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "13px",
            color: "#B0A89C",
          }}
        >
          {book.author}
        </p>

        {/* Price + button pushed to card bottom */}
        <div className="mt-auto">
          {/* Price row */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#6B8E6F",
              }}
            >
              {formatCurrency(book.salePrice)}
            </span>
            {book.salePrice < book.regularPrice ? (
              <span
                style={{
                  fontSize: "12px",
                  color: "#B0A89C",
                  textDecoration: "line-through",
                }}
              >
                {formatCurrency(book.regularPrice)}
              </span>
            ) : null}
          </div>

          {/* Add to Cart */}
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className={`btn-lift mt-3 flex w-full select-none items-center justify-center gap-1.5 rounded-[4px] py-[10px] text-[12px] font-medium uppercase tracking-[0.06em] text-white transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-2 ${
              isAvailable
                ? "bg-[#6B8E6F] hover:bg-[#2D4A2B]"
                : "bg-[#B0A89C]"
            }`}
            aria-label={ariaLabel}
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            {buttonLabel}
          </button>
        </div>{/* /mt-auto */}
      </div>
    </article>
  );
});
