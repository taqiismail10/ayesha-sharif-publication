import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Settings,
  Tags,
  Ticket,
  Users
} from "lucide-react";
import type { Admin } from "@prisma/client";
import { adminRoleLabels } from "@/lib/constants";
import { logoutAction } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/orders", label: "Orders", icon: PackageCheck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Ticket },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminShell({
  admin,
  children
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-page">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-navy p-5 text-white lg:block">
        <Link href="/admin" className="text-xl font-extrabold">
          ASP Admin
        </Link>
        <p className="mt-2 text-xs text-white/60">{adminRoleLabels[admin.role]}</p>
        <nav className="mt-8 grid gap-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4 text-gold" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="absolute bottom-5 left-5 right-5">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-bold text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </form>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="font-extrabold text-navy">
              ASP Admin
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-navy"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-line px-3 py-2 text-sm font-bold text-navy"
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="container-px mx-auto max-w-7xl py-6">{children}</main>
      </div>
    </div>
  );
}
