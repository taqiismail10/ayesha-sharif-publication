import type { Metadata } from "next";
import { BookListView } from "@/components/books/book-list-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Results",
  description: "Search books by title, author, or ISBN."
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  return (
    <BookListView
      searchParams={await searchParams}
      title="Search Results"
      description="Find books by title, author, ISBN, category, tag, status, and price."
    />
  );
}
