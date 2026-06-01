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
    <section className="section-shell">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="mb-3 h-1 w-14 rounded-full bg-gold" />
          <h2 className="section-heading">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="premium-button-secondary min-h-10 px-4 py-2"
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
