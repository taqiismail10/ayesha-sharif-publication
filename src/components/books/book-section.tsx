import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import type { BookCardData } from "@/types";
import { ProductCard } from "@/components/books/product-card";

type BookSectionProps = {
  title: string;
  subtitle?: string;
  books: BookCardData[];
  href?: string;
};

export function BookSection({ title, subtitle, books, href }: BookSectionProps) {
  if (!books.length) return null;

  return (
    <section className="book-section section-shell">
      <div className="book-section-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-navy text-gold shadow-[0_12px_26px_rgba(16,35,63,0.12)]">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="h-px w-20 bg-gradient-to-r from-gold via-gold/55 to-transparent" />
          </div>
          <h2 className="section-heading">{title}</h2>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="premium-button-secondary min-h-11 w-fit px-4 py-2.5"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className="book-grid grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {books.map((book) => (
          <ProductCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
