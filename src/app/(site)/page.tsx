import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  HandCoins,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Truck
} from "lucide-react";
import { brand, defaultContact } from "@/lib/constants";
import { getHomeData } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { BookCover } from "@/components/books/book-cover";
import { BookSection } from "@/components/books/book-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();
  const heroBooks = data.featured.slice(0, 3);

  const whyBuy = [
    { icon: ShieldCheck, title: "Original publication", text: "Curated titles from the publisher." },
    { icon: ShoppingBag, title: "Easy ordering", text: "Guest checkout without account friction." },
    { icon: HandCoins, title: "Manual payments", text: "COD, bKash, Nagad, and Rocket support." },
    { icon: Truck, title: "Bangladesh-wide delivery", text: "Clear delivery areas and charges." }
  ];

  const heroStats = [
    { label: "Catalogue focus", value: "Books" },
    { label: "Readers served", value: "BD" },
    { label: "Platform path", value: "Learning-ready" }
  ];

  return (
    <div>
      <section
        className="relative isolate overflow-hidden bg-navy text-white shadow-hero"
        style={{
          backgroundImage:
            "linear-gradient(115deg, rgba(16,35,63,0.98), rgba(16,35,63,0.84) 46%, rgba(16,35,63,0.56)), url('/banners/homepage-banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="floating-orb left-[6%] top-24 h-24 w-24" />
        <div className="floating-orb bottom-20 right-[10%] h-32 w-32 [animation-delay:1.5s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_24%,rgba(201,162,39,0.22),transparent_26rem)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-page to-transparent" />

        <div className="container-px relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-10 py-16 lg:grid-cols-[1fr_430px] lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-4 py-2 text-sm font-extrabold text-gold backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Premium Bangladeshi publication house
            </p>
            <h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
              {brand.name}
            </h1>
            <div className="gold-divider my-6 max-w-xl" />
            <p className="max-w-2xl text-lg leading-8 text-white/80">
              {brand.tagline} Built for books today, with a polished foundation for
              future learning and exam experiences.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/books"
                className="premium-button"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Browse Books
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={`https://wa.me/${defaultContact.whatsapp.replace(/\D/g, "")}`}
                className="premium-button-secondary border-white/30 bg-white/15 text-white hover:bg-white/20"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Order on WhatsApp
              </a>
            </div>
            <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="glass-panel rounded-lg p-3">
                  <p className="text-xl font-extrabold text-gold">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel hidden rounded-lg p-5 lg:block">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
                  Featured shelf
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-white">
                  Books with a learning-first feel
                </h2>
              </div>
              <BookOpenCheck className="h-9 w-9 text-gold" aria-hidden="true" />
            </div>
            <div className="grid gap-4">
              {heroBooks.map((book, index) => (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="group grid grid-cols-[86px_1fr] items-center gap-4 rounded-lg border border-white/15 bg-white/10 p-3 transition hover:bg-white/15"
                  style={{ transform: `translateX(${index * 10}px)` }}
                >
                  <BookCover
                    title={book.title}
                    author={book.author}
                    image={book.coverImage}
                    className="book-shadow"
                  />
                  <div>
                    <p className="line-clamp-2 font-extrabold leading-snug text-white">
                      {book.title}
                    </p>
                    <p className="mt-1 text-sm text-white/70">{book.author}</p>
                    <p className="mt-3 font-extrabold text-gold">
                      {formatCurrency(book.salePrice)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-cream/95 p-4 text-navy">
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 h-5 w-5 text-gold" aria-hidden="true" />
                <p className="text-sm font-bold leading-6">
                  Academic, admission, children, Islamic, and literature collections
                  can grow into learning sections later without changing the brand feel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-px relative z-10 mx-auto -mt-10 max-w-7xl">
        <div className="premium-panel grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyBuy.map((item) => (
            <div key={item.title} className="flex gap-3 rounded-lg bg-white/70 p-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-navy text-gold shadow-sm">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-extrabold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm leading-5 text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="container-px mx-auto max-w-7xl">
        <BookSection
          title="Featured books"
          subtitle="Selected titles from our first catalogue."
          books={data.featured}
          href="/books"
        />
        <BookSection
          title="New arrivals"
          subtitle="Freshly added books for readers and students."
          books={data.newArrivals}
          href="/books?sort=newest"
        />
        <BookSection
          title="Discount books"
          subtitle="Launch offers and limited-time savings."
          books={data.discountBooks}
          href="/books?tag=discount"
        />
        <BookSection
          title="Upcoming books"
          subtitle="Planned titles and pre-order-ready books."
          books={data.upcoming}
          href="/books?status=upcoming"
        />
        <BookSection
          title="Best sellers"
          subtitle="Popular titles from the collection."
          books={data.bestSellers}
          href="/books?sort=best-selling"
        />

        <section className="section-shell">
          <div className="mb-5">
            <div className="mb-3 h-1 w-14 rounded-full bg-gold" />
            <h2 className="section-heading">Categories</h2>
            <p className="mt-1 text-sm text-muted">
              Browse by academic, Islamic, literature, children, and admission books.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.categories.map((category) => (
              <Link
                key={category.id}
                href={`/books?category=${category.slug}`}
                className="premium-card shine-hover p-4"
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-navy text-gold">
                  <PackageCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-extrabold text-navy">{category.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {category._count.books} books
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="premium-panel my-10 p-6 sm:p-8">
          <div className="floating-orb right-8 top-6 h-20 w-20" />
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
                Assisted ordering
              </p>
              <h2 className="section-heading">
                Need help placing an order?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Message us on WhatsApp with the book name and delivery address. We can
                confirm stock, payment instructions, and delivery charge manually.
              </p>
            </div>
            <a
              href={`https://wa.me/${defaultContact.whatsapp.replace(/\D/g, "")}`}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(15,118,110,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald/90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp order
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
