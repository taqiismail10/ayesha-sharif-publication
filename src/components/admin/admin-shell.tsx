"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Settings,
  Tags,
  Ticket,
  Users,
} from "lucide-react";
import type { Admin } from "@prisma/client";
import { adminRoleLabels } from "@/lib/constants";
import { logoutAction } from "@/app/admin/actions";

const links = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard, exact: true  },
  { href: "/admin/books",        label: "Books",        icon: BookOpen,        exact: false },
  { href: "/admin/orders",       label: "Orders",       icon: PackageCheck,    exact: false },
  { href: "/admin/customers",    label: "Customers",    icon: Users,           exact: false },
  { href: "/admin/categories",   label: "Categories",   icon: Ticket,          exact: false },
  { href: "/admin/tags",         label: "Tags",         icon: Tags,            exact: false },
  { href: "/admin/site-content", label: "Site Content", icon: FileText,        exact: false },
  { href: "/admin/settings",     label: "Settings",     icon: Settings,        exact: false },
];

function AdminNav({ admin }: { admin: Admin }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:flex lg:flex-col" style={{ backgroundColor: "#2D4A2B" }}>
        {/* Brand */}
        <div className="flex-shrink-0 px-5 pt-6 pb-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
            style={{ color: "rgba(245,241,232,0.95)", fontFamily: "var(--font-serif)" }}
          >
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-[10px] font-black"
              style={{ backgroundColor: "#D4A574", color: "#2D4A2B" }}
            >
              ASP
            </span>
            Admin
          </Link>
          <p className="mt-1 text-[11px]" style={{ color: "rgba(245,241,232,0.45)" }}>
            {adminRoleLabels[admin.role]}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="grid gap-0.5">
            {links.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors duration-150"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
                    color: active ? "#FFFFFF" : "rgba(245,241,232,0.68)",
                  }}
                >
                  <item.icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: active ? "#D4A574" : "rgba(212,165,116,0.6)" }}
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
              className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors duration-150 hover:bg-white/10"
              style={{ color: "rgba(245,241,232,0.6)" }}
            >
              <LogOut className="h-4 w-4 shrink-0" style={{ color: "rgba(212,165,116,0.6)" }} aria-hidden="true" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="sticky top-0 z-30 border-b px-4 py-3 lg:hidden"
        style={{ backgroundColor: "#2D4A2B", borderColor: "rgba(245,241,232,0.1)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="text-[15px] font-semibold"
            style={{ color: "rgba(245,241,232,0.9)", fontFamily: "var(--font-serif)" }}
          >
            ASP Admin
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md"
              style={{ color: "rgba(245,241,232,0.7)" }}
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
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors duration-150"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                  color: active ? "#FFFFFF" : "rgba(245,241,232,0.65)",
                }}
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
    <div className="min-h-screen bg-cream">
      <AdminNav admin={admin} />
      <div className="lg:pl-64">
        <main className="container-px mx-auto max-w-7xl py-6">{children}</main>
      </div>
    </div>
  );
}
