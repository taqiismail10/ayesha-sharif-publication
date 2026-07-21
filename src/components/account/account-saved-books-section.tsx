"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BookMarked } from "lucide-react";
import type { BookStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart-client";
import { formatCurrency } from "@/lib/format";
import { SavedBookToggle } from "@/components/books/saved-book-toggle";
import { BookCover } from "@/components/books/book-cover";
import { useToast } from "@/components/ui/toast";

const purchasableStatuses: BookStatus[] = ["published", "pre_order"];

type SavedBookRow = {
  id: string;
  title: string;
  slug: string;
  author: string;
  salePrice: number;
  regularPrice: number;
  stockQuantity: number;
  status: BookStatus;
  coverImage: string | null;
};

function availabilityCopy(book: SavedBookRow) {
  if (purchasableStatuses.includes(book.status) && book.stockQuantity > 0) {
    return book.status === "pre_order" ? "Available for pre-order" : "In stock";
  }
  if (book.status === "archived") return "Unavailable";
  return "Currently unavailable";
}

export function AccountSavedBooksSection({ books }: { books: SavedBookRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [visibleBooks, setVisibleBooks] = useState(books);

  const handleRemove = useCallback(
    (bookId: string) => {
      setVisibleBooks((current) => current.filter((book) => book.id !== bookId));
      router.refresh();
    },
    [router],
  );

  const handleAddToCart = useCallback(
    (book: SavedBookRow) => {
      if (!(purchasableStatuses.includes(book.status) && book.stockQuantity > 0)) {
        toast.info({
          title: "Book unavailable",
          description: `${book.title} is not available to add right now.`,
          duration: 2200,
        });
        return;
      }

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

      toast.success({
        title: "Added to cart",
        description: book.title,
        duration: 2200,
      });
    },
    [toast],
  );

  return (
    <div className="grid gap-3">
      {visibleBooks.map((book) => {
        const canAddToCart =
          purchasableStatuses.includes(book.status) && book.stockQuantity > 0;

        return (
          <div
            key={book.id}
            className="grid grid-cols-[72px_1fr] gap-4 rounded-lg border border-line/80 bg-page/35 p-3 sm:grid-cols-[84px_1fr_auto]"
          >
            <BookCover title={book.title} author={book.author} image={book.coverImage} />
            <div className="min-w-0">
              <Link
                href={`/books/${book.slug}`}
                className="line-clamp-2 text-base font-medium text-forest"
              >
                {book.title}
              </Link>
              <p className="mt-1 text-sm text-muted">{book.author}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-forest">
                  {formatCurrency(book.salePrice)}
                </span>
                {book.salePrice < book.regularPrice ? (
                  <span className="text-muted line-through">
                    {formatCurrency(book.regularPrice)}
                  </span>
                ) : null}
                <span className="text-muted">{availabilityCopy(book)}</span>
              </div>
            </div>
            <div className="col-span-2 flex flex-wrap gap-3 sm:col-span-1 sm:flex-col sm:items-end">
              <button
                type="button"
                onClick={() => handleAddToCart(book)}
                disabled={!canAddToCart}
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-emerald px-4 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:bg-muted/40"
              >
                Add to cart
              </button>
              <SavedBookToggle
                bookId={book.id}
                title={book.title}
                variant="text"
                mode="remove"
                savedLabel="Remove"
                onStatusChange={(isSaved) => {
                  if (!isSaved) handleRemove(book.id);
                }}
              />
            </div>
          </div>
        );
      })}

      {!visibleBooks.length ? (
        <div className="rounded-lg border border-line/80 bg-page/35 p-4 text-center">
          <BookMarked className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
          <p className="mt-3 text-base font-medium text-forest">No saved books yet</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Save books you want to return to later and they will appear here.
          </p>
          <Link
            href="/books"
            className="focus-ring mt-4 inline-flex text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
          >
            Browse books
          </Link>
        </div>
      ) : null}
    </div>
  );
}
