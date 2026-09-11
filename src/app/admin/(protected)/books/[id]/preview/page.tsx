import { notFound } from "next/navigation";
import { adminApi, requireAdmin } from "@/lib/auth";
import { bookStatusLabels } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { BookCover } from "@/components/books/book-cover";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type PreviewBook = {
  title: string; author: string; status: keyof typeof bookStatusLabels; coverImage: string | null;
  salePrice: number | string; regularPrice: number | string; publisher: string; category: { name: string } | null;
  isbn13: string | null; edition: string | null; language: string; publicationDate: string | null;
  stockQuantity: number; tags: Array<{ tag: { name: string } }>; description: string | null;
};

export default async function BookPreviewPage({ params }: PageProps) {
  await requireAdmin(["super_admin", "admin", "editor"]);
  const { id } = await params;
  const response = await adminApi(`/admin/books/${encodeURIComponent(id)}`);
  if (!response.ok) notFound();
  const book = await response.json() as PreviewBook;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">
          Preview book
        </h1>
        <p className="mt-2 text-sm text-muted">
          Draft-safe admin preview before publishing.
        </p>
      </div>
      <div className="grid gap-7 lg:grid-cols-[360px_1fr]">
        <BookCover title={book.title} author={book.author} image={book.coverImage} />
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="admin-status-badge mb-3">
            {bookStatusLabels[book.status]}
          </p>
          <h2 className="text-3xl font-extrabold text-navy">{book.title}</h2>
          <p className="mt-2 text-muted">{book.author}</p>
          <div className="mt-5 flex items-end gap-3">
            <p className="text-3xl font-extrabold text-navy">
              {formatCurrency(book.salePrice)}
            </p>
            {Number(book.salePrice) < Number(book.regularPrice) ? (
              <p className="font-semibold text-muted line-through">
                {formatCurrency(book.regularPrice)}
              </p>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Publisher" value={book.publisher} />
            <Info label="Category" value={book.category?.name} />
            <Info label="ISBN-13" value={book.isbn13} />
            <Info label="Edition" value={book.edition} />
            <Info label="Language" value={book.language} />
            <Info label="Publication date" value={formatDate(book.publicationDate)} />
            <Info label="Stock" value={`${book.stockQuantity}`} />
            <Info label="Tags" value={book.tags.map((item) => item.tag.name).join(", ")} />
          </div>
          {book.description ? (
            <p className="mt-5 whitespace-pre-line leading-8 text-ink">
              {book.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="font-bold text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value || "Not set"}</p>
    </div>
  );
}
