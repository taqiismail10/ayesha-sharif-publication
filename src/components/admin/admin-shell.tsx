"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutGrid,
  FileText,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Settings,
  ScrollText,
  Tags,
  Ticket,
  Users,
} from "lucide-react";
import type { Admin } from "@prisma/client";
import { adminRoleLabels } from "@/lib/constants";
import { logoutAction } from "@/app/admin/actions";
import { ToastProvider } from "@/components/ui/toast";

const links = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard, exact: true  },
  { href: "/admin/books",        label: "Books",        icon: BookOpen,        exact: false },
  { href: "/admin/orders",       label: "Orders",       icon: PackageCheck,    exact: false },
  { href: "/admin/customers",    label: "Customers",    icon: Users,           exact: false },
  { href: "/admin/categories",   label: "Categories",   icon: Ticket,          exact: false },
  { href: "/admin/tags",         label: "Tags",         icon: Tags,            exact: false },
  { href: "/admin/homepage",     label: "Homepage Content", icon: LayoutGrid,  exact: false },
  { href: "/admin/site-content", label: "Site Content", icon: FileText,        exact: false },
  { href: "/admin/policies",     label: "Policies",     icon: ScrollText,       exact: false },
  { href: "/admin/settings",     label: "Settings",     icon: Settings,        exact: false },
];

function AdminNav({ admin }: { admin: Admin }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <aside className="admin-sidebar fixed inset-y-0 left-0 hidden w-64 lg:flex lg:flex-col">
        {/* Brand */}
        <div className="flex-shrink-0 px-5 pt-6 pb-4">
          <Link
            href="/admin"
            className="admin-brand-link flex items-center gap-2 text-[15px] font-semibold tracking-tight"
          >
            <span
              className="admin-brand-mark inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-[10px] font-black"
            >
              ASP
            </span>
            Admin
          </Link>
          <p className="admin-role-label mt-1 text-[11px]">
            {adminRoleLabels[admin.role]}
          </p>
        </div>

        {/* Nav */}
        <nav className="admin-sidebar-nav flex-1 overflow-y-auto px-3 pb-4">
          <div className="grid gap-0.5">
            {links.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="admin-nav-link flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium"
                >
                  <item.icon
                    className="admin-nav-icon h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="flex-shrink-0 px-3 pb-5">
          <form action={logoutAction}>
            <button
              type="submit"
              className="admin-logout-button flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="admin-mobile-topbar sticky top-0 z-30 border-b px-4 py-3 lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="admin-brand-link text-[15px] font-semibold"
          >
            ASP Admin
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="admin-mobile-logout inline-flex h-11 w-11 items-center justify-center rounded-md"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
        <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {links.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="admin-mobile-nav-link inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em]"
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}

export function AdminShell({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="admin-theme min-h-screen bg-cream">
        <AdminNav admin={admin} />
        <div className="lg:pl-64">
          <main className="admin-main container-px mx-auto max-w-7xl py-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
