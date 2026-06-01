import { Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  archiveTagAction,
  createTagAction,
  updateTagAction
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  await requireAdmin(["super_admin", "admin", "editor"]);
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } }
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">Tags</h1>
        <p className="mt-2 text-sm text-muted">Create, edit, and archive book tags.</p>
      </div>

      <form
        action={createTagAction}
        className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]"
      >
        <input name="name" placeholder="Tag name" className="form-input" required />
        <input name="slug" placeholder="tag-slug" className="form-input" />
        <button className="rounded-md bg-emerald px-4 py-2 text-sm font-extrabold text-white">
          Create
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full min-w-[700px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Books</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => {
                const updateAction = updateTagAction.bind(null, tag.id);
                return (
                  <tr key={tag.id}>
                    <td colSpan={5}>
                      <form
                        action={updateAction}
                        className="grid gap-3 md:grid-cols-[1fr_1fr_80px_100px_60px]"
                      >
                        <input name="name" defaultValue={tag.name} className="form-input" />
                        <input name="slug" defaultValue={tag.slug} className="form-input" />
                        <span className="self-center text-sm font-bold">
                          {tag._count.books}
                        </span>
                        <label className="flex items-center gap-2 text-sm font-bold">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={tag.isActive}
                          />
                          Active
                        </label>
                        <button className="rounded-md bg-navy px-3 py-2 text-sm font-bold text-white">
                          Save
                        </button>
                      </form>
                      <form action={archiveTagAction} className="mt-2">
                        <input type="hidden" name="id" value={tag.id} />
                        <button className="inline-flex items-center gap-2 text-sm font-bold text-danger">
                          <Archive className="h-4 w-4" aria-hidden="true" />
                          Archive
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!tags.length ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No tags yet.
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
