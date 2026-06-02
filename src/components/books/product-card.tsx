"use client";

import Link from "next/link";
import { ArrowUpRight, ShoppingCart } from "lucide-react";
import type { BookStatus } from "@prisma/client";
import { addCartItem } from "@/lib/cart-client";
import { formatCurrency } from "@/lib/format";
import type { BookCardData } from "@/types";
import { BookCover } from "@/components/books/book-cover";
import { StatusBadge } from "@/components/books/status-badge";

const purchasableStatuses: BookStatus[] = ["published", "pre_order"];

export function ProductCard({ book }: { book: BookCardData }) {
  const isAvailable =
    purchasableStatuses.includes(book.status) && book.stockQuantity > 0;
  const discount = book.discountPercent > 0;
  const isPreOrder = book.status === "pre_order";

  return (
    <article className="publication-card shine-hover group grid h-full min-w-0 grid-cols-[104px_minmax(0,1fr)] gap-3 p-3 sm:flex sm:flex-col sm:gap-0">
      <Link
        href={`/books/${book.slug}`}
        className="publication-cover-link block self-start sm:self-auto"
        aria-label={`View ${book.title}`}
      >
        <BookCover
          title={book.title}
          author={book.author}
          image={book.coverImage}
          className="book-shadow"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col sm:pt-4">
        <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2 sm:mb-3">
          <StatusBadge status={book.status} />
          {discount ? (
            <span className="discount-badge">
              {book.discountPercent}% off
            </span>
          ) : null}
        </div>
        <Link href={`/books/${book.slug}`} className="min-w-0 group-hover:text-navy">
          <h3 className="line-clamp-3 text-base font-black leading-snug text-ink transition group-hover:text-navy sm:line-clamp-2 sm:min-h-[2.65rem]">
            {book.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-sm font-medium text-muted">
          {book.author}
        </p>
        {book.category ? (
          <Link
            href={`/books?category=${book.category.slug}`}
            className="mt-2 inline-flex w-fit rounded-sm border border-gold/25 bg-gold/10 px-2 py-1 text-[11px] font-black uppercase text-navy transition hover:border-gold/60 hover:bg-gold/15 sm:mt-3"
          >
            {book.category.name}
          </Link>
        ) : null}
        <div className="mt-auto pt-3 sm:pt-4">
          <div className="flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
            <p className="text-lg font-black text-navy sm:text-xl">
              {formatCurrency(book.salePrice)}
            </p>
            {book.salePrice < book.regularPrice ? (
              <p className="text-sm font-semibold text-muted line-through">
                {formatCurrency(book.regularPrice)}
              </p>
            ) : null}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-muted">
              {book.stockQuantity > 0 ? `${book.stockQuantity} in stock` : "Out of stock"}
            </p>
            <ArrowUpRight className="h-4 w-4 text-gold opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden="true" />
          </div>
        </div>
        <button
          type="button"
          disabled={!isAvailable}
          onClick={() =>
            addCartItem({
              bookId: book.id,
              title: book.title,
              slug: book.slug,
              author: book.author,
              coverImage: book.coverImage,
              regularPrice: book.regularPrice,
              salePrice: book.salePrice,
              stockQuantity: book.stockQuantity,
              quantity: 1
            })
          }
          className="cart-button focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald px-3 py-2.5 text-sm font-black text-white shadow-[0_14px_28px_rgba(15,118,110,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald/90 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-white/80 disabled:shadow-none sm:mt-4 sm:min-h-12"
          aria-label={`${isPreOrder ? "Pre-order" : "Add"} ${book.title} to cart`}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {isPreOrder ? "Pre-order" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
