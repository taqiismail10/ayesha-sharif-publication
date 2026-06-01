"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
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

  return (
    <article className="group flex h-full flex-col rounded-lg border border-line bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link href={`/books/${book.slug}`} className="block">
        <BookCover title={book.title} author={book.author} image={book.coverImage} />
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={book.status} />
          {discount ? (
            <span className="rounded-sm bg-danger px-2 py-1 text-xs font-bold text-white">
              {book.discountPercent}% off
            </span>
          ) : null}
        </div>
        <Link href={`/books/${book.slug}`} className="group-hover:text-navy">
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-ink">
            {book.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-muted">{book.author}</p>
        <div className="mt-3 flex items-end gap-2">
          <p className="text-lg font-extrabold text-navy">
            {formatCurrency(book.salePrice)}
          </p>
          {book.salePrice < book.regularPrice ? (
            <p className="text-sm font-semibold text-muted line-through">
              {formatCurrency(book.regularPrice)}
            </p>
          ) : null}
        </div>
        <p className="mt-1 text-xs font-semibold text-muted">
          {book.stockQuantity > 0 ? `${book.stockQuantity} in stock` : "Out of stock"}
        </p>
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
          className="focus-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald/90 disabled:cursor-not-allowed disabled:bg-muted/40"
          aria-label={`Add ${book.title} to cart`}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {book.status === "pre_order" ? "Pre-order" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
