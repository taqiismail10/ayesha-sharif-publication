import Link from "next/link";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  await requireAdmin(["super_admin", "admin", "order_manager"]);
  const q = pick((await searchParams).q);
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    include: {
      _count: {
        select: {
          orders: true,
          savedBooks: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">
          Customers
        </h1>
        <p className="mt-2 text-sm text-muted">
          Basic customer visibility for linked account orders. Passwords and
          session tokens are never shown.
        </p>
      </div>

      <form className="mb-4 grid gap-3 rounded-lg border border-line bg-white p-3 sm:grid-cols-[1fr_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, or phone"
          className="form-input"
        />
        <button className="rounded-md bg-navy px-4 py-2 text-sm font-extrabold text-white">
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="admin-table w-full min-w-[820px]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Saved</th>
                <th>Status</th>
                <th>Created</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-extrabold text-navy">{customer.name}</td>
                  <td>
                    <p>{customer.email || "No email"}</p>
                    <p className="text-xs text-muted">{customer.phone || "No phone"}</p>
                  </td>
                  <td>{customer._count.orders}</td>
                  <td>{customer._count.savedBooks}</td>
                  <td>{customer.isActive ? "Active" : "Inactive"}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td>
                    <Link
                      href={`/admin/orders?q=${encodeURIComponent(
                        customer.email || customer.phone || customer.name
                      )}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-navy"
                      aria-label="View customer orders"
                      title="View customer orders"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!customers.length ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No customers found.
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
