import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { updateBookAction } from "@/app/admin/actions";
import { AdminBookForm } from "@/components/admin/admin-book-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: PageProps) {
  await requireAdmin(["super_admin", "admin", "editor"]);
  const { id } = await params;
  const [book, categories, tags] = await Promise.all([
    prisma.book.findUnique({ where: { id }, include: { tags: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } })
  ]);
  if (!book) notFound();

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
