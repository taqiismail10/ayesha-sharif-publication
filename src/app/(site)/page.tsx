import Link from "next/link";
import {
  HandCoins,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck
} from "lucide-react";
import { defaultContact } from "@/lib/constants";
import { getHomeData } from "@/lib/data";
import { BookSection } from "@/components/books/book-section";
import { PremiumHero } from "@/components/home/premium-hero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();

  const whyBuy = [
    { icon: ShieldCheck, title: "Original publication", text: "Curated titles from the publisher." },
    { icon: ShoppingBag, title: "Easy ordering", text: "Guest checkout without account friction." },
    { icon: HandCoins, title: "Manual payments", text: "COD, bKash, Nagad, and Rocket support." },
    { icon: Truck, title: "Bangladesh-wide delivery", text: "Clear delivery areas and charges." }
  ];

  return (
    <div>
      <PremiumHero books={data.featured} />

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
