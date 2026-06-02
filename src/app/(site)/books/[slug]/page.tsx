import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Tag } from "lucide-react";
import { brand, bookStatusLabels } from "@/lib/constants";
import { getBookBySlug } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { BookCover } from "@/components/books/book-cover";
import { BookPurchasePanel } from "@/components/books/book-purchase-panel";
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
      images: data.book.coverImage ? [data.book.coverImage] : ["/banners/homepage-banner.png"]
    }
  };
}

export default async function BookDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getBookBySlug(slug);
  if (!data) notFound();

  const { book, related } = data;
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
      url: `/books/${book.slug}`
    }
  };

  return (
    <div className="container-px mx-auto max-w-7xl py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="section-shell grid gap-7 lg:grid-cols-[420px_1fr]">
        <div>
          <BookCover
            title={book.title}
            author={book.author}
            image={book.coverImage}
            className="book-shadow"
          />
          {book.galleryImages.length ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {book.galleryImages.map((image) => (
                <div
                  key={image}
                  className="relative aspect-[3/4] overflow-hidden rounded-md border border-line bg-cream"
                >
                  <Image
                    src={image}
                    alt={`${book.title} gallery`}
                    fill
                    sizes="(max-width: 1024px) 25vw, 96px"
                    className="object-cover"
                    unoptimized={image.toLowerCase().endsWith(".svg")}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={book.status} />
            {book.discountPercent > 0 ? (
              <span className="rounded-sm bg-danger px-2 py-1 text-xs font-bold text-white">
                {book.discountPercent}% off
              </span>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-navy sm:text-5xl">
            {book.title}
          </h1>
          {book.subtitle ? (
            <p className="mt-2 text-lg font-semibold text-muted">{book.subtitle}</p>
          ) : null}
          <p className="mt-3 text-base text-muted">By {book.author}</p>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-extrabold text-navy">
              {formatCurrency(book.salePrice)}
            </p>
            {book.salePrice < book.regularPrice ? (
              <p className="text-lg font-semibold text-muted line-through">
                {formatCurrency(book.regularPrice)}
              </p>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-bold text-muted">
            {book.stockQuantity > 0
              ? `${book.stockQuantity} copies available`
              : bookStatusLabels[book.status]}
          </p>
          {book.shortDescription ? (
            <p className="mt-5 leading-7 text-ink">{book.shortDescription}</p>
          ) : null}

          <div className="mt-6">
            <BookPurchasePanel book={book} />
          </div>

          <div className="premium-panel mt-6 grid gap-3 p-4 text-sm sm:grid-cols-2">
            <Info label="Publisher" value={book.publisher} />
            <Info label="ISBN-13" value={book.isbn13} />
            <Info label="Edition" value={book.edition} />
            <Info label="Language" value={book.language} />
            <Info label="Pages" value={book.pages?.toString()} />
            <Info label="Binding" value={book.binding} />
            <Info label="Publication date" value={formatDate(book.publicationDate)} />
            <Info label="Category" value={book.category?.name} />
          </div>

          {book.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-sm bg-cream px-2 py-1 text-xs font-bold text-navy"
                >
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {book.samplePdf ? (
            <Link
              href={book.samplePdf}
              className="mt-5 inline-flex items-center gap-2 rounded-md border border-gold px-4 py-2 text-sm font-bold text-navy"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Preview sample
            </Link>
          ) : null}
        </div>
      </div>

      {book.description ? (
        <section className="premium-panel mt-10 p-5 sm:p-7">
          <h2 className="section-heading">Description</h2>
          <p className="mt-4 whitespace-pre-line leading-8 text-ink">{book.description}</p>
        </section>
      ) : null}

      <BookSection title="Related books" books={related} href="/books" />
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="font-bold text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value || "Not set"}</p>
    </div>
  );
}
