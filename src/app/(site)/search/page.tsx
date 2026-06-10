import type { Metadata } from "next";
import { Search } from "lucide-react";
import { BookListView } from "@/components/books/book-list-view";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Search Results",
  description: "Search books by title, author, or ISBN."
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  return (
    <>
      {/* ── Prominent search bar ── */}
      <div
        className="border-b py-10"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(176, 168, 156, 0.2)",
        }}
      >
        <div className="mx-auto max-w-[560px] px-6">
          <form action="/search" className="relative">
            <label htmlFor="search-page-input" className="sr-only">
              Search books
            </label>
            <input
              id="search-page-input"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search books, authors, topics…"
              className="search-page-input h-[52px] w-full rounded-[6px] pl-4 pr-[52px] text-base transition-[border-color,box-shadow] duration-150"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2"
              aria-label="Search"
            >
              <Search
                className="h-5 w-5"
                style={{ color: "#6B8E6F" }}
                aria-hidden="true"
              />
            </button>
          </form>
        </div>
      </div>

      {/* ── Results + filters ── */}
      <BookListView
        searchParams={params}
        title="Search Results"
        description="Find books by title, author, ISBN, category, tag, status, and price."
      />
    </>
  );
}
