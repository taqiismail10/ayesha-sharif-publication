import Link from "next/link";
import { BookOpenCheck, Home, Search } from "lucide-react";
import { brand } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="container-px grid min-h-screen place-items-center py-12">
      <section
        className="max-w-2xl rounded-[8px] p-6 text-center sm:p-10"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(176,168,156,0.2)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: "#6B8E6F" }}
        >
          <BookOpenCheck className="h-8 w-8 text-white" aria-hidden="true" />
        </div>

        <p
          className="text-xs font-medium uppercase tracking-[0.10em]"
          style={{ color: "#D4A574" }}
        >
          Page not found
        </p>

        <h1
          className="mt-3 text-3xl sm:text-4xl"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            color: "#2D4A2B",
            lineHeight: 1.2,
          }}
        >
          This page is not on the shelf
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6" style={{ color: "#B0A89C" }}>
          The link may be old, moved, or unavailable. Return to {brand.name} and
          continue browsing books.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {/* Primary: sage bg, white text */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[4px] py-[14px] px-9 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#2D4A2B]"
            style={{ backgroundColor: "#6B8E6F" }}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
          {/* Secondary: forest outline */}
          <Link
            href="/books"
            className="inline-flex items-center justify-center gap-2 rounded-[4px] py-[14px] px-9 text-sm font-medium transition-colors duration-150 hover:bg-[#2D4A2B] hover:text-white"
            style={{
              border: "2px solid #2D4A2B",
              color: "#2D4A2B",
              background: "transparent",
            }}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse books
          </Link>
        </div>
      </section>
    </main>
  );
}
