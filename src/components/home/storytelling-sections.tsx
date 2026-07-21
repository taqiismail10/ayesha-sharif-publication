import Link from "next/link";
import {
  ArrowRight,
  BookCheck,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HandCoins,
  Headphones,
  Library,
  MessageCircle,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck
} from "lucide-react";
import { defaultContact } from "@/lib/constants";
import type { HomepageFeature } from "@/lib/homepage-content-definitions";
import { SectionTitle } from "@/components/site/section-title";
import { ScrollReveal } from "@/components/site/scroll-reveal";

type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  _count: { books: number };
};

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Original publication",
    text: "Books come from the publisher catalogue, with a clear focus on authentic printed titles."
  },
  {
    icon: ShoppingBag,
    title: "Easy guest checkout",
    text: "Readers can order without account creation, login friction, or unnecessary steps."
  },
  {
    icon: HandCoins,
    title: "Manual payment support",
    text: "Cash on Delivery plus manual bKash, Nagad, and Rocket options for practical ordering."
  },
  {
    icon: Truck,
    title: "Delivery across Bangladesh",
    text: "Simple delivery-area pricing and manual tracking support for early-stage operations."
  }
];

const orderingSteps = [
  {
    icon: BookOpen,
    title: "Choose your book",
    text: "Browse curated titles by section, category, price, or availability."
  },
  {
    icon: ShoppingBag,
    title: "Add to cart",
    text: "Keep ordering simple with clear price, discount, and stock information."
  },
  {
    icon: ClipboardCheck,
    title: "Checkout as guest",
    text: "Submit your phone, address, delivery area, and payment method."
  },
  {
    icon: CheckCircle2,
    title: "Admin confirms order",
    text: "The team verifies payment, confirms stock, and prepares delivery."
  },
  {
    icon: PackageCheck,
    title: "Receive delivery",
    text: "Books are delivered to your doorstep with manual support when needed."
  }
];

const categoryIcons = [Library, GraduationCap, BookCheck, BookOpen, PackageCheck];

export function ReaderTrustSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-10 sm:py-12">
      <div className="story-section-heading">
        <p className="story-kicker">Reader confidence</p>
        <h2 className="section-heading">Why readers trust us</h2>
        <p>
          Ayesha-Sharif Publication keeps the first version simple: original
          books, clear ordering, and human support where it matters.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trustCards.map((card) => (
          <article key={card.title} className="story-card group">
            <span className="story-icon">
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function OrderingStepsSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-8 sm:py-10">
      <div className="premium-panel p-5 sm:p-7">
        <div className="story-section-heading story-section-heading-left">
          <p className="story-kicker">Simple order flow</p>
          <h2 className="section-heading">How ordering works</h2>
          <p>
            The process is designed for a low-budget publishing MVP: fast for
            customers, manageable for the admin team.
          </p>
        </div>

        <div className="order-steps mt-7 grid gap-4 md:grid-cols-5">
          {orderingSteps.map((step, index) => (
            <article key={step.title} className="order-step-card">
              <span className="order-step-number">{index + 1}</span>
              <span className="story-icon">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryStorySection({ categories }: { categories: HomeCategory[] }) {
  if (!categories.length) return null;

  return (
    <section className="container-px mx-auto max-w-7xl py-8 sm:py-10">
      <div className="story-section-heading">
        <p className="story-kicker">Browse the shelves</p>
        <h2 className="section-heading">Explore by category</h2>
        <p>
          Move through the catalogue by learning need, reading habit, or subject
          area.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];

          return (
            <Link
              key={category.id}
              href={`/books?category=${category.slug}`}
              className="category-story-card group"
            >
              <span className="story-icon">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3>{category.name}</h3>
              <p>{category._count.books} books</p>
              <span className="category-story-arrow">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function FutureLearningSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-8 sm:py-10">
      <div className="future-learning-panel">
        <div className="relative z-10 max-w-2xl">
          <p className="story-kicker">Future learning platform</p>
          <h2 className="section-heading">
            More than a bookstore — a learning platform in progress.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Today, Ayesha-Sharif Publication helps readers discover and order
            books. Tomorrow, the platform is planned to support smarter exam
            preparation and digital learning tools.
          </p>
          <Link href="/books" className="premium-button mt-6 w-fit">
            Explore books
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="learning-visual" aria-hidden="true">
          <div className="learning-card learning-card-book">
            <BookOpen className="h-7 w-7 text-gold" />
            <span>Book</span>
          </div>
          <div className="learning-card learning-card-exam">
            <ClipboardCheck className="h-7 w-7 text-emerald" />
            <span>Exam prep</span>
          </div>
          <div className="learning-card learning-card-study">
            <GraduationCap className="h-7 w-7 text-gold" />
            <span>Learning</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HelpOrderingSection() {
  const whatsappNumber = defaultContact.whatsapp.replace(/\D/g, "");

  return (
    <section className="container-px mx-auto max-w-7xl py-8 pb-12 sm:py-10 sm:pb-14">
      <div className="help-order-panel">
        <div className="help-order-visual" aria-hidden="true">
          <Headphones className="h-12 w-12 text-gold" />
          <span />
        </div>

        <div className="relative z-10">
          <p className="story-kicker">Assisted ordering</p>
          <h2 className="section-heading">Need help ordering?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Message us with the book name, delivery district, and payment
            preference. We can confirm stock, delivery charge, and manual payment
            instructions before processing the order.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <p className="help-contact-line">
              <Phone className="h-4 w-4 text-gold" aria-hidden="true" />
              {defaultContact.phone}
            </p>
            <p className="help-contact-line">
              <MessageCircle className="h-4 w-4 text-gold" aria-hidden="true" />
              {defaultContact.whatsapp}
            </p>
          </div>
        </div>

        <a
          href={`https://wa.me/${whatsappNumber}`}
          className="premium-button relative z-10 w-full sm:w-fit"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Contact on WhatsApp
        </a>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   New editorial homepage sections (Phase 5)
───────────────────────────────────────────── */

export function CategoriesSection({ categories }: { categories: HomeCategory[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-12 md:py-[72px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionTitle overline="— Browse —" title="Browse by Category" />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {categories.slice(0, 8).map((category, i) => (
            <ScrollReveal
              key={category.id}
              variant="rise"
              delay={Math.min(i, 4) * 40}
            >
              <Link
                href={`/books?category=${category.slug}`}
                className="glass-pill rounded-full px-5 py-[10px] text-[12px] font-medium uppercase tracking-[0.04em] text-white hover:bg-[#2D4A2B] hover:text-[#D4A574] hover:scale-[1.03] sm:px-6 sm:text-[13px]"
                style={{
                  transition:
                    "background-color 150ms cubic-bezier(0.4,0,0.2,1), color 150ms cubic-bezier(0.4,0,0.2,1), transform 150ms cubic-bezier(0.4,0,0.2,1), box-shadow 150ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {category.name}
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const trustIcons = {
  "book-open": BookOpen,
  "hand-coins": HandCoins,
  "rotate-ccw": RotateCcw,
  truck: Truck,
  "shield-check": ShieldCheck,
  "package-check": PackageCheck,
  "book-check": BookCheck,
} as const;

export function TrustStrip({ items }: { items: HomepageFeature[] }) {
  const visibleItems = [...items]
    .filter((item) => item.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!visibleItems.length) return null;

  return (
    <section
      className="py-12"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.38)",
        borderTop: "1px solid rgba(176, 168, 156, 0.16)",
        borderBottom: "1px solid rgba(176, 168, 156, 0.16)",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-x-12 gap-y-8 px-6">
        {visibleItems.map(({ iconKey, label }, i) => {
          const Icon = trustIcons[iconKey];
          return (
            <ScrollReveal key={label} variant="rise" delay={i * 80}>
              <div className="flex flex-col items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  aria-hidden="true"
                  style={{ color: "#6B8E6F" }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    color: "#B0A89C",
                  }}
                >
                  {label}
                </span>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}

export function WhatsAppSection() {
  const whatsappNumber = defaultContact.whatsapp.replace(/\D/g, "");

  return (
    <section
      className="pb-16 pt-20"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(212,165,116,0.09) 0%, transparent 55%),
          radial-gradient(ellipse at 10% 100%, rgba(107,142,111,0.12) 0%, transparent 45%),
          #2D4A2B
        `,
        borderTop: "1px solid rgba(212, 165, 116, 0.12)",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-6 text-center">
        {/* Heading — rise */}
        <ScrollReveal variant="rise" delay={0}>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "24px",
              fontWeight: 400,
              color: "#F5F1E8",
              margin: 0,
            }}
          >
            Need help choosing?
          </h2>
        </ScrollReveal>

        {/* Subtext — rise */}
        <ScrollReveal variant="rise" delay={80}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              color: "rgba(245, 241, 232, 0.7)",
              margin: 0,
            }}
          >
            Chat with us on WhatsApp
          </p>
        </ScrollReveal>

        {/* Button — scale */}
        <ScrollReveal variant="scale" delay={160}>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            className="btn-lift mt-2 inline-flex items-center gap-2 rounded-[4px] px-8 py-3 font-semibold"
            style={{
              backgroundColor: "#D4A574",
              color: "#2D4A2B",
              fontSize: "14px",
            }}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Chat on WhatsApp
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
