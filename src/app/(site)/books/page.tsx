import type { Metadata } from "next";
import { BookListView } from "@/components/books/book-list-view";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All Books",
  description: "Browse all books from Ayesha-Sharif Publication."
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BooksPage({ searchParams }: PageProps) {
  return (
    <BookListView
      searchParams={await searchParams}
      title="All Books"
      description="Search, filter, and order books from Ayesha-Sharif Publication."
    />
  );
}
