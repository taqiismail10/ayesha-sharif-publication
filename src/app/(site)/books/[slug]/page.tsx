import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Tag } from "lucide-react";
import { brand } from "@/lib/constants";
import { getBookBySlug } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { getSimilarBooks } from "@/lib/recommendations";
import { BookCover } from "@/components/books/book-cover";
import { BookInteractionTracker } from "@/components/books/book-interaction-tracker";
import { BookPurchasePanel } from "@/components/books/book-purchase-panel";
import { BookSampleLink } from "@/components/books/book-sample-link";
import { BookSection } from "@/components/books/book-section";
import { StatusBadge } from "@/components/books/status-badge";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBookBySlug(slug);
  if (!data) return {};
  return {
    title: data.book.title,
    description: data.book.shortDescription || data.book.description || brand.tagline,
    openGraph: {
      title: `${data.book.title} | ${brand.name}`,
      description: data.book.shortDescription || brand.tagline,
      images: data.book.coverImage ? [data.book.coverImage] : ["/banners/homepage-banner.png"],
    },
  };
}

export default async function BookDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getBookBySlug(slug);
  if (!data) notFound();

  const { book, related } = data;
  const similarBooks = await getSimilarBooks(slug, 4);
  const hasDiscount = book.salePrice < book.regularPrice;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: book.author,
    publisher: book.publisher,
    isbn: book.isbn13,
    bookEdition: book.edition,
    inLanguage: book.language,
    numberOfPages: book.pages,
    image: book.coverImage,
    description: book.shortDescription || book.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: book.salePrice,
      availability:
        book.stockQuantity > 0 && ["published", "pre_order"].includes(book.status)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `/books/${book.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <BookInteractionTracker bookId={book.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 2-column grid: 45% image / 55% info ── */}
      <div className="grid gap-10 lg:grid-cols-[45%_1fr] lg:items-start">

        {/* ── Left: cover + gallery ── */}
        <div>
          <div
            style={{
              borderRadius: "8px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            <BookCover
              title={book.title}
              author={book.author}
              image={book.coverImage}
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>

          {book.galleryImages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {book.galleryImages.map((image, index) => (
                <div
                  key={image}
                  className="relative aspect-[3/4] w-[60px] shrink-0 overflow-hidden"
                  style={{
                    borderRadius: "4px",
                    border: `2px solid ${index === 0 ? "#6B8E6F" : "transparent"}`,
                  }}
                >
                  <Image
                    src={image}
                    alt={`${book.title} thumbnail ${index + 1}`}
                    fill
                    sizes="60px"
                    loading="lazy"
                    className="object-cover"
                    unoptimized={image.toLowerCase().endsWith(".svg")}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: info + sticky purchase panel ── */}
        <div className="flex min-w-0 flex-col gap-6">

          {/* Category + status row */}
          <div className="flex flex-wrap items-center gap-3">
            {book.category && (
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#6B8E6F",
                  fontWeight: 500,
                }}
              >
                {book.category.name}
              </span>
            )}
            <StatusBadge status={book.status} />
          </div>

          {/* Title */}
          <div>
            <h1
              className="text-[26px] leading-[1.2] lg:text-[36px]"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                color: "#2D4A2B",
              }}
            >
              {book.title}
            </h1>
            {book.subtitle && (
              <p
                className="mt-2 text-base"
                style={{ fontFamily: "var(--font-sans)", color: "#B0A89C" }}
              >
                {book.subtitle}
              </p>
            )}
            <p
              className="mt-[6px] text-[15px]"
              style={{ fontFamily: "var(--font-sans)", color: "#B0A89C" }}
            >
              By {book.author}
            </p>
          </div>

          {/* Price section */}
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "28px",
                fontWeight: 600,
                color: "#6B8E6F",
              }}
            >
              {formatCurrency(book.salePrice)}
            </span>
            {hasDiscount && (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "18px",
                    color: "#B0A89C",
                    textDecoration: "line-through",
                    marginLeft: "2px",
                  }}
                >
                  {formatCurrency(book.regularPrice)}
                </span>
                <span
                  className="inline-flex items-center px-2 py-[3px] text-[12px] font-medium text-white"
                  style={{
                    backgroundColor: "#D4A574",
                    borderRadius: "999px",
                    lineHeight: 1,
                  }}
                >
                  {book.discountPercent}% off
                </span>
              </>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(176,168,156,0.25)",
              margin: "4px 0",
            }}
            aria-hidden="true"
          />

          {/* Short description */}
          {book.shortDescription && (
            <p
              className="text-[15px]"
              style={{
                fontFamily: "var(--font-sans)",
                lineHeight: 1.75,
                color: "#B0A89C",
              }}
            >
              {book.shortDescription}
            </p>
          )}

          {/* Sticky purchase panel */}
          <div className="lg:sticky lg:top-[88px]">
            <BookPurchasePanel book={book} />
          </div>

          {/* Book metadata grid */}
          <div
            className="grid gap-3 rounded-[6px] p-4 text-sm sm:grid-cols-2"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(176,168,156,0.2)",
            }}
          >
            <Info label="Publisher"        value={book.publisher} />
            <Info label="ISBN-13"          value={book.isbn13} />
            <Info label="Edition"          value={book.edition} />
            <Info label="Language"         value={book.language} />
            <Info label="Pages"            value={book.pages?.toString()} />
            <Info label="Binding"          value={book.binding} />
            <Info label="Publication date" value={formatDate(book.publicationDate)} />
            <Info label="Category"         value={book.category?.name} />
          </div>

          {/* Tags */}
          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(107,142,111,0.1)",
                    color: "#6B8E6F",
                    border: "1px solid rgba(107,142,111,0.2)",
                  }}
                >
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {book.samplePdf && (
            <BookSampleLink href={book.samplePdf} bookId={book.id} />
          )}
        </div>
      </div>

      {/* ── Full description ── */}
      {book.description && (
        <section
          className="mt-12 rounded-[8px] p-6 sm:p-8"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(176,168,156,0.2)",
          }}
        >
          <h2
            className="mb-4 text-2xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              color: "#2D4A2B",
            }}
          >
            About this book
          </h2>
          <p
            className="whitespace-pre-line text-[15px]"
            style={{
              fontFamily: "var(--font-sans)",
              lineHeight: 1.85,
              color: "#B0A89C",
            }}
          >
            {book.description}
          </p>
        </section>
      )}

      {/* ── Similar books ── */}
      <BookSection
        title="Similar books"
        subtitle="Matched by category, tags, author, language, price, and availability."
        books={similarBooks.length ? similarBooks : related}
        href="/books"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p
        className="text-[11px] font-medium uppercase tracking-[0.08em]"
        style={{ color: "#B0A89C" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-[14px]"
        style={{ color: "#2D4A2B", fontWeight: 500 }}
      >
        {value || "—"}
      </p>
    </div>
  );
}
