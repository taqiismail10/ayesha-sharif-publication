import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { publicNav } from "@/lib/constants";
import { AccountMenu } from "@/components/site/account-menu";
import { CartLink } from "@/components/site/cart-link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-page/90 shadow-[0_10px_30px_rgba(16,35,63,0.07)] backdrop-blur-xl">
      <div className="container-px mx-auto flex max-w-7xl items-center gap-3 py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <Image
            src="/logo/logo.png"
            alt="Ayesha-Sharif Publication"
            width={44}
            height={44}
            className="h-11 w-11 rounded-md object-contain shadow-sm transition group-hover:scale-105"
            priority
          />
          <span className="hidden text-sm font-extrabold leading-tight text-navy sm:block">
            Ayesha-Sharif
            <br />
            Publication
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-5 md:flex">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-bold text-ink/80 transition hover:bg-white/70 hover:text-navy hover:shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form
          action="/search"
          className="ml-auto hidden min-w-0 flex-1 items-center md:flex md:max-w-xs"
        >
          <label className="sr-only" htmlFor="site-search">
            Search books
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search books"
              className="form-input h-11 min-w-0 rounded-full border-white/75 bg-white/90 pl-9 shadow-[0_10px_24px_rgba(16,35,63,0.07)]"
            />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <AccountMenu />
          <CartLink />
        </div>
      </div>

      <form action="/search" className="container-px mx-auto max-w-7xl pb-3 md:hidden">
        <label className="sr-only" htmlFor="mobile-site-search">
          Search books
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="mobile-site-search"
            name="q"
            type="search"
            placeholder="Search books"
            className="form-input h-11 rounded-full border-white/75 bg-white/90 pl-9"
          />
        </div>
      </form>
      <nav className="container-px mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-3 md:hidden">
        {publicNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-white/80 bg-white/80 px-3 py-2 text-sm font-bold text-ink shadow-sm"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
