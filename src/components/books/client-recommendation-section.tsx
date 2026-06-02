"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { BookCardData } from "@/types";
import { peekAnonymousRecommendationId } from "@/lib/consent-client";
import { ProductCard } from "@/components/books/product-card";

type RecommendationResponse = {
  ok?: boolean;
  books?: BookCardData[];
};

export function PersonalizedRecommendationSection() {
  const [books, setBooks] = useState<BookCardData[]>([]);

  useEffect(() => {
    const anonymousId = peekAnonymousRecommendationId();
    const params = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : "";
    fetch(`/api/recommendations${params}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<RecommendationResponse>)
      .then((data) => setBooks(data.books || []))
      .catch(() => setBooks([]));
  }, []);

  if (!books.length) return null;

  return (
    <RecommendationGrid
      title="Recommended for you"
      subtitle="A private, consent-aware shelf based on your account or browser preferences."
      books={books}
    />
  );
}

export function CartRecommendationSection({ bookIds }: { bookIds: string[] }) {
  const [books, setBooks] = useState<BookCardData[]>([]);

  useEffect(() => {
    if (!bookIds.length) return;
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookIds }),
      cache: "no-store"
    })
      .then((response) => response.json() as Promise<RecommendationResponse>)
      .then((data) => setBooks(data.books || []))
      .catch(() => setBooks([]));
  }, [bookIds]);

  if (!books.length) return null;

  return (
    <RecommendationGrid
      title="You may also like"
      subtitle="Books related to the titles currently in your cart."
      books={books}
    />
  );
}

function RecommendationGrid({
  title,
  subtitle,
  books
}: {
  title: string;
  subtitle: string;
  books: BookCardData[];
}) {
  return (
    <section className="section-shell">
      <div className="mb-6 flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-navy text-gold shadow-[0_12px_26px_rgba(16,35,63,0.12)]">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="section-heading">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="book-grid grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {books.slice(0, 4).map((book) => (
          <ProductCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
