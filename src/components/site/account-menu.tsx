"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, PackageCheck, UserCircle } from "lucide-react";

type AccountResponse = {
  ok?: boolean;
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export function AccountMenu() {
  const [customer, setCustomer] = useState<AccountResponse["customer"]>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/me", { cache: "no-store" })
      .then((response) => response.json() as Promise<AccountResponse>)
      .then((data) => {
        if (active) setCustomer(data.customer || null);
      })
      .catch(() => {
        if (active) setCustomer(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!customer) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account/login"
          className="focus-ring hidden min-h-10 items-center gap-2 rounded-full border border-white/75 bg-white/85 px-3 py-2 text-sm font-extrabold text-navy shadow-sm sm:inline-flex"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Login
        </Link>
        <Link
          href="/account/register"
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/85 text-navy shadow-sm sm:hidden"
          aria-label="Account login"
          title="Account"
        >
          <UserCircle className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/90 text-navy shadow-sm sm:w-auto sm:gap-2 sm:px-3"
        aria-label="Customer account menu"
      >
        <UserCircle className="h-5 w-5" aria-hidden="true" />
        <span className="hidden max-w-28 truncate text-sm font-extrabold sm:inline">
          {customer.name}
        </span>
      </button>
      <div className="invisible absolute right-0 top-full z-50 mt-2 w-52 rounded-md border border-line bg-white p-2 text-sm shadow-soft opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <Link
          href="/account/profile"
          className="flex items-center gap-2 rounded-md px-3 py-2 font-bold text-navy hover:bg-page"
        >
          <UserCircle className="h-4 w-4 text-gold" aria-hidden="true" />
          Profile
        </Link>
        <Link
          href="/account/orders"
          className="flex items-center gap-2 rounded-md px-3 py-2 font-bold text-navy hover:bg-page"
        >
          <PackageCheck className="h-4 w-4 text-gold" aria-hidden="true" />
          Orders
        </Link>
        <Link
          href="/account/logout"
          className="block rounded-md px-3 py-2 font-bold text-danger hover:bg-danger/10"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}
