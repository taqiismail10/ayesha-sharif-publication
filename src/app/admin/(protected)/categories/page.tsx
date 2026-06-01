import { Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  archiveCategoryAction,
  createCategoryAction,
  updateCategoryAction
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin(["super_admin", "admin", "editor"]);
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } }
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">Categories</h1>
        <p className="mt-2 text-sm text-muted">
          Create, edit, and archive book categories.
        </p>
      </div>

      <form
        action={createCategoryAction}
        className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_2fr_auto]"
      >
        <input name="name" placeholder="Category name" className="form-input" required />
        <input name="slug" placeholder="category-slug" className="form-input" />
        <input name="description" placeholder="Description" className="form-input" />
        <button className="rounded-md bg-emerald px-4 py-2 text-sm font-extrabold text-white">
          Create
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full min-w-[800px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Books</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const updateAction = updateCategoryAction.bind(null, category.id);
                return (
                  <tr key={category.id}>
                    <td colSpan={6}>
                      <form
                        action={updateAction}
                        className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_80px_100px_60px]"
                      >
                        <input
                          name="name"
                          defaultValue={category.name}
                          className="form-input"
                        />
                        <input
                          name="slug"
                          defaultValue={category.slug}
                          className="form-input"
                        />
                        <input
                          name="description"
                          defaultValue={category.description || ""}
                          className="form-input"
                        />
                        <span className="self-center text-sm font-bold">
                          {category._count.books}
                        </span>
                        <label className="flex items-center gap-2 text-sm font-bold">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={category.isActive}
                          />
                          Active
                        </label>
                        <button className="rounded-md bg-navy px-3 py-2 text-sm font-bold text-white">
                          Save
                        </button>
                      </form>
                      <form action={archiveCategoryAction} className="mt-2">
                        <input type="hidden" name="id" value={category.id} />
                        <button className="inline-flex items-center gap-2 text-sm font-bold text-danger">
                          <Archive className="h-4 w-4" aria-hidden="true" />
                          Archive
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!categories.length ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No categories yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
