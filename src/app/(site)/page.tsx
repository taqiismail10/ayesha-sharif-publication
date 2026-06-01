import Link from "next/link";
import {
  HandCoins,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck
} from "lucide-react";
import { brand, defaultContact } from "@/lib/constants";
import { getHomeData } from "@/lib/data";
import { BookSection } from "@/components/books/book-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();

  const whyBuy = [
    { icon: ShieldCheck, title: "Original publication" },
    { icon: ShoppingBag, title: "Easy ordering" },
    { icon: HandCoins, title: "Cash on Delivery" },
    { icon: Truck, title: "Bangladesh-wide delivery" }
  ];

  return (
    <div>
      <section
        className="relative overflow-hidden bg-navy text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(16,35,63,0.94), rgba(16,35,63,0.68)), url('/banners/homepage-banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="container-px mx-auto grid min-h-[520px] max-w-7xl items-center py-16">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-sm bg-gold px-3 py-1 text-sm font-extrabold text-navy">
              New Bangladeshi publishing house
            </p>
            <h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-6xl">
              {brand.name}
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/82">{brand.tagline}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/books"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-extrabold text-navy"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Browse Books
              </Link>
              <a
                href={`https://wa.me/${defaultContact.whatsapp.replace(/\D/g, "")}`}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-3 text-sm font-extrabold text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Contact on WhatsApp
              </a>
            </div>
          </div>
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

        <section className="py-8 sm:py-10">
          <div className="mb-5">
            <h2 className="font-heading text-2xl font-extrabold text-navy sm:text-3xl">
              Categories
            </h2>
            <p className="mt-1 text-sm text-muted">
              Browse by academic, Islamic, literature, children, and admission books.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.categories.map((category) => (
              <Link
                key={category.id}
                href={`/books?category=${category.slug}`}
                className="rounded-lg border border-line bg-white p-4 shadow-sm transition hover:border-gold hover:shadow-soft"
              >
                <PackageCheck className="mb-4 h-6 w-6 text-gold" aria-hidden="true" />
                <h3 className="font-extrabold text-navy">{category.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {category._count.books} books
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {whyBuy.map((item) => (
            <div key={item.title} className="rounded-lg border border-line bg-white p-5">
              <item.icon className="h-7 w-7 text-gold" aria-hidden="true" />
              <h3 className="mt-4 font-extrabold text-navy">{item.title}</h3>
            </div>
          ))}
        </section>

        <section className="my-8 rounded-lg bg-cream p-6 sm:p-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-heading text-2xl font-extrabold text-navy">
                Need help placing an order?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Message us on WhatsApp with the book name and delivery address. We can
                confirm stock, payment instructions, and delivery charge manually.
              </p>
            </div>
            <a
              href={`https://wa.me/${defaultContact.whatsapp.replace(/\D/g, "")}`}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald px-5 py-3 text-sm font-extrabold text-white"
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
