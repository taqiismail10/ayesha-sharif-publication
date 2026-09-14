import { notFound } from "next/navigation";
import { getAdminTaxonomy } from "@/lib/admin-taxonomy";
import { adminApi, requireAdmin } from "@/lib/auth";
import type { Book, BookTag } from "@prisma/client";
import { updateBookAction } from "@/app/admin/actions";
import { AdminBookForm } from "@/components/admin/admin-book-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: PageProps) {
  await requireAdmin(["super_admin", "admin", "editor"]);
  const { id } = await params;
  const [bookResponse, categories, tags] = await Promise.all([
    adminApi(`/admin/books/${encodeURIComponent(id)}`),
    getAdminTaxonomy("categories"),
    getAdminTaxonomy("tags")
  ]);
  if (!bookResponse.ok) notFound();
  const payload = await bookResponse.json();
  const book = {
    ...payload,
    publicationDate: payload.publicationDate ? new Date(payload.publicationDate) : null,
    discountStart: payload.discountStart ? new Date(payload.discountStart) : null,
    discountEnd: payload.discountEnd ? new Date(payload.discountEnd) : null,
  } as unknown as Book & { tags: BookTag[] };

  const action = updateBookAction.bind(null, book.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">Edit book</h1>
        <p className="mt-2 text-sm text-muted">{book.title}</p>
      </div>
      <AdminBookForm book={book} categories={categories} tags={tags} action={action} />
    </div>
  );
}
