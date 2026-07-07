import Link from "next/link";
import { Archive, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { bookStatusLabels } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import {
  archiveBookAction,
  deleteBookAction
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminBooksPage({ searchParams }: PageProps) {
  await requireAdmin(["super_admin", "admin", "editor"]);
  const params = await searchParams;
  const q = pick(params.q);

  const books = await prisma.book.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
            { isbn13: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    include: {
      category: true,
      _count: { select: { orderItems: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-navy">Books</h1>
          <p className="mt-2 text-sm text-muted">
            Create, edit, archive, preview, and manage stock.
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald px-4 py-2 text-sm font-extrabold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New book
        </Link>
      </div>

      <form className="mb-4 flex gap-2 rounded-lg border border-line bg-white p-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title, author, ISBN"
          className="form-input"
        />
        <button className="rounded-md bg-navy px-4 py-2 text-sm font-extrabold text-white">
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full min-w-[900px]">
            <thead>
              <tr>
                <th>Book</th>
                <th>Category</th>
                <th>Status</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>
                    <p className="font-extrabold text-navy">{book.title}</p>
                    <p className="text-xs text-muted">{book.author}</p>
                  </td>
                  <td>{book.category?.name || "No category"}</td>
                  <td>
                    <span className="admin-status-badge">
                      {bookStatusLabels[book.status]}
                    </span>
                  </td>
                  <td>
                    <p className="font-bold">{formatCurrency(book.salePrice)}</p>
                    {Number(book.salePrice) < Number(book.regularPrice) ? (
                      <p className="text-xs text-muted line-through">
                        {formatCurrency(book.regularPrice)}
                      </p>
                    ) : null}
                  </td>
                  <td>{book.stockQuantity}</td>
                  <td>{formatDate(book.updatedAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/books/${book.id}/preview`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-navy"
                        aria-label="Preview"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/books/${book.id}/edit`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-navy"
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <form action={archiveBookAction}>
                        <input type="hidden" name="id" value={book.id} />
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-danger"
                          aria-label="Archive"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={deleteBookAction}>
                        <input type="hidden" name="id" value={book.id} />
                        <button
                          disabled={book._count.orderItems > 0}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-danger disabled:cursor-not-allowed disabled:text-muted"
                          aria-label="Delete"
                          title={
                            book._count.orderItems > 0
                              ? "Cannot delete books that have orders"
                              : "Delete"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!books.length ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No books found.
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
