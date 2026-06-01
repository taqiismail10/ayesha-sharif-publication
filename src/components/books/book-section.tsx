import Link from "next/link";
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
    <section className="py-8 sm:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-navy sm:text-3xl">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="rounded-md border border-gold px-3 py-2 text-sm font-bold text-navy transition hover:bg-gold/15"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <ProductCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
