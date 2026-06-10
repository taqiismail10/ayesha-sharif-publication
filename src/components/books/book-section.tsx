import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BookCardData } from "@/types";
import { ProductCard } from "@/components/books/product-card";
import { SectionTitle } from "@/components/site/section-title";
import { ScrollReveal } from "@/components/site/scroll-reveal";

type BookSectionProps = {
  title: string;
  subtitle?: string;
  /** Small uppercase overline label above the title, e.g. "— Featured —" */
  overline?: string;
  books: BookCardData[];
  href?: string;
};

export function BookSection({
  title,
  subtitle,
  overline,
  books,
  href,
}: BookSectionProps) {
  if (!books.length) return null;

  return (
    <section className="py-12 md:py-[72px]">
      <div className="mb-10 flex flex-col items-center gap-3">
        {/* SectionTitle handles overline + title + underline + subtitle animations */}
        <SectionTitle title={title} subtitle={subtitle} overline={overline} />

        {href ? (
          <ScrollReveal variant="rise" delay={200}>
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#6B8E6F] transition-colors duration-150 hover:text-[#2D4A2B]"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </ScrollReveal>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {books.map((book, i) => (
          <ScrollReveal
            key={book.id}
            variant="scale"
            delay={Math.min(i, 4) * 60}
            className="h-full"
          >
            <ProductCard book={book} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
