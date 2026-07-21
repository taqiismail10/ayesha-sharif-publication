import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { EmptyState } from "@/components/site/empty-state";
import { AccountSavedBooksSection } from "@/components/account/account-saved-books-section";

export const metadata: Metadata = {
  title: "Saved Books",
  description: "View and manage the books saved to your account.",
};

export default async function CustomerSavedBooksPage() {
  const customer = await requireCustomer();
  const savedBooks = await prisma.savedBook.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    select: {
      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          salePrice: true,
          regularPrice: true,
          stockQuantity: true,
          status: true,
          coverImage: true,
        },
      },
    },
  });

  return (
    <div className="container-px mx-auto max-w-6xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="story-kicker">Reader account</p>
          <h1 className="font-serif text-3xl font-medium text-forest">
            Saved Books
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Titles you saved for later shopping decisions.
          </p>
        </div>
        <Link href="/account" className="premium-button-secondary w-fit">
          Back to account
        </Link>
      </div>

      {savedBooks.length ? (
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
          <AccountSavedBooksSection
            books={savedBooks.map(({ book }) => ({
              id: book.id,
              title: book.title,
              slug: book.slug,
              author: book.author,
              salePrice: Number(book.salePrice),
              regularPrice: Number(book.regularPrice),
              stockQuantity: book.stockQuantity,
              status: book.status,
              coverImage: book.coverImage,
            }))}
          />
        </section>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="No saved books yet"
          description="Save books you want to return to later and they will appear here."
          action={{ label: "Browse books", href: "/books" }}
        />
      )}
    </div>
  );
}
