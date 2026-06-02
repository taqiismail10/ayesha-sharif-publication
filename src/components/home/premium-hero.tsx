import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  HandCoins,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck
} from "lucide-react";
import { BookCover } from "@/components/books/book-cover";
import { brand, defaultContact } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { BookCardData } from "@/types";

type HeroBook = Pick<
  BookCardData,
  "id" | "title" | "slug" | "author" | "coverImage" | "salePrice"
>;

type PremiumHeroProps = {
  books: BookCardData[];
};

const fallbackBooks: HeroBook[] = [
  {
    id: "hero-fallback-academic",
    title: "Academic Launch Title",
    slug: "",
    author: brand.name,
    coverImage: null,
    salePrice: 0
  },
  {
    id: "hero-fallback-literature",
    title: "Literature Collection",
    slug: "",
    author: brand.name,
    coverImage: null,
    salePrice: 0
  },
  {
    id: "hero-fallback-children",
    title: "Children Book Series",
    slug: "",
    author: brand.name,
    coverImage: null,
    salePrice: 0
  }
];

const trustItems = [
  { icon: ShieldCheck, label: "Original publication" },
  { icon: HandCoins, label: "Cash on Delivery" },
  { icon: Smartphone, label: "bKash/Nagad/Rocket" },
  { icon: Truck, label: "Bangladesh-wide delivery" }
];

const bookPlacements = [
  "hero-book-card hero-book-card-main",
  "hero-book-card hero-book-card-left",
  "hero-book-card hero-book-card-right"
];

export function PremiumHero({ books }: PremiumHeroProps) {
  const displayBooks = [...books.slice(0, 3), ...fallbackBooks].slice(0, 3);
  const whatsappNumber = defaultContact.whatsapp.replace(/\D/g, "");

  return (
    <section className="home-hero">
      <div className="hero-pattern" aria-hidden="true" />
      <div className="hero-edge-glow" aria-hidden="true" />

      <div className="container-px relative z-10 mx-auto grid max-w-7xl gap-8 py-8 sm:py-10 lg:min-h-[660px] lg:grid-cols-[minmax(0,0.95fr)_minmax(390px,0.85fr)] lg:items-center lg:gap-12 lg:py-14">
        <div className="min-w-0 max-w-xs text-white sm:max-w-3xl">
          <p className="hero-ribbon">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            New publication
          </p>

          <h1 className="mt-5 max-w-3xl break-words font-heading text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Quality books for readers, students, and lifelong learners.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
            Explore original titles from Ayesha-Sharif Publication with simple
            ordering, manual payment support, and doorstep delivery across
            Bangladesh.
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/books" className="premium-button min-w-full sm:min-w-0">
              Browse Books
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              className="premium-button-secondary min-w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:min-w-0"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Contact on WhatsApp
            </a>
          </div>

          <div className="mt-6 inline-flex w-full max-w-2xl min-w-0 items-start gap-3 rounded-md border border-gold/30 bg-white/10 px-4 py-3 text-sm font-bold leading-6 text-white/90 shadow-[0_18px_48px_rgba(0,0,0,0.12)] backdrop-blur sm:w-auto">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
            <span>Built for books today. Ready for smarter learning tomorrow.</span>
          </div>

        </div>

        <div className="hero-showcase min-w-0 lg:row-span-2" aria-label="Ayesha-Sharif Publication book showcase">
          <div className="hero-showcase-lines" aria-hidden="true" />
          <div className="hero-publication-mark">
            <BookOpenCheck className="h-5 w-5 text-gold" aria-hidden="true" />
            <div>
              <p>Ayesha-Sharif Publication</p>
              <span>Launch shelf</span>
            </div>
          </div>

          {displayBooks.map((book, index) => (
            <Link
              key={`${book.id}-${index}`}
              href={book.slug ? `/books/${book.slug}` : "/books"}
              className={bookPlacements[index]}
            >
              <BookCover
                title={book.title}
                author={book.author}
                image={book.coverImage}
                priority={index === 0}
                className="h-full"
              />
              {index === 0 ? (
                <span className="hero-price-chip">
                  {book.salePrice ? formatCurrency(book.salePrice) : "New title"}
                </span>
              ) : null}
            </Link>
          ))}

          <div className="hero-mini-note hero-mini-note-payment">
            <span>Manual payment support</span>
            <strong>COD, bKash, Nagad, Rocket</strong>
          </div>
          <div className="hero-mini-note hero-mini-note-delivery">
            <span>Delivery</span>
            <strong>Across Bangladesh</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-start-1 lg:row-start-2 lg:max-w-2xl">
          {trustItems.map((item) => (
            <div key={item.label} className="hero-trust-badge">
              <item.icon className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
