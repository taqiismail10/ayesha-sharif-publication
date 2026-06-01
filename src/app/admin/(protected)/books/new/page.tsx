import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createBookAction } from "@/app/admin/actions";
import { AdminBookForm } from "@/components/admin/admin-book-form";

export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  await requireAdmin(["super_admin", "admin", "editor"]);
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">New book</h1>
        <p className="mt-2 text-sm text-muted">
          Add catalogue details, pricing, stock, labels, and upload assets.
        </p>
      </div>
      <AdminBookForm categories={categories} tags={tags} action={createBookAction} />
    </div>
  );
}
