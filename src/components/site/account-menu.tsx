"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetch("/api/account/me", { cache: "no-store", credentials: "include" })
      .then((response) => response.json() as Promise<AccountResponse>)
      .then((data) => {
        if (active) {
          setCustomer(data.customer || null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setCustomer(null);
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  if (isLoading) {
    return (
      <div
        className="h-10 w-10 rounded-full border border-white/75 bg-white/70 shadow-sm sm:w-[92px]"
        aria-hidden="true"
      />
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account/login"
          className="focus-ring hidden min-h-[44px] items-center gap-2 rounded-full border border-white/75 bg-white/85 px-3 py-2 text-sm font-extrabold text-forest shadow-sm sm:inline-flex"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Login
        </Link>
        <Link
          href="/account/register"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/75 bg-white/85 text-forest shadow-sm sm:hidden"
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
        className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/75 bg-white/90 text-forest shadow-sm sm:w-auto sm:gap-2 sm:px-3"
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
          className="flex items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
        >
          <UserCircle className="h-4 w-4 text-gold" aria-hidden="true" />
          Profile
        </Link>
        <Link
          href="/account/orders"
          className="flex items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
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
