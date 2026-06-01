import Link from "next/link";
import { BookOpenCheck, Home, Search } from "lucide-react";
import { brand } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="soft-grid-bg container-px grid min-h-screen place-items-center bg-page py-12">
      <section className="premium-panel max-w-2xl p-6 text-center sm:p-10">
        <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-md bg-navy text-gold shadow-hero">
          <BookOpenCheck className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
          Page not found
        </p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold text-navy sm:text-4xl">
          This page is not on the shelf
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
          The link may be old, moved, or unavailable. Return to {brand.name} and
          continue browsing books.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="premium-button">
            <Home className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
          <Link href="/books" className="premium-button-secondary">
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse books
          </Link>
        </div>
      </section>
    </main>
  );
}
