"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { publicNav } from "@/lib/constants";
import { useCart } from "@/lib/cart-client";

const HEADER_MORPH_THRESHOLD = 80;

export function Header() {
  const pathname  = usePathname();
  const { count: cartCount } = useCart();
  /* Item 1 — cart bump: trigger a brief animation when count increments */
  const prevCountRef = useRef(cartCount);
  const [bumpKey, setBumpKey] = useState(0);
  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      setBumpKey((k) => k + 1);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /** True when `href` matches the current pathname */
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  /* Toggle the shell only when native scrolling crosses the morph threshold. */
  useEffect(() => {
    const header = document.getElementById("morph-header");
    if (!header) return;
    let rafId = 0;
    let framePending = false;
    let isScrolled: boolean | null = null;

    const updateHeaderState = () => {
      framePending = false;
      const nextIsScrolled = window.scrollY >= HEADER_MORPH_THRESHOLD;
      if (nextIsScrolled === isScrolled) return;

      isScrolled = nextIsScrolled;
      header.dataset.state = isScrolled ? "locked" : "resting";
    };

    const handleScroll = () => {
      if (framePending) return;
      framePending = true;
      rafId = window.requestAnimationFrame(() => {
        updateHeaderState();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateHeaderState();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  /* ── Search overlay: auto-focus ── */
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [searchOpen]);

  /* ── Search overlay: Escape to close ── */
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  return (
    <>
      {/* ── Search overlay ─────────────────────────────────────────────── */}
      <div
        role="search"
        aria-label="Site search"
        aria-hidden={!searchOpen}
        className="fixed inset-x-0 top-0 z-[60] flex justify-center px-6 py-6"
        style={{
          backgroundColor: "rgba(45, 74, 43, 0.97)",
          transform: searchOpen ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="flex w-full max-w-[600px] flex-col gap-3">
          <form action="/search" className="relative flex items-end">
            <label htmlFor="header-search-input" className="sr-only">Search books</label>
            <input
              id="header-search-input"
              ref={searchInputRef}
              name="q"
              type="search"
              placeholder="Search books, authors, topics…"
              tabIndex={searchOpen ? 0 : -1}
              className="search-overlay-input"
            />
            <button
              type="submit"
              tabIndex={searchOpen ? 0 : -1}
              className="absolute bottom-2 right-0 inline-flex h-11 w-11 items-center justify-center text-white/60 transition-colors duration-150 hover:text-white"
              aria-label="Submit search"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
          {/* Esc hint — Tailwind classes to avoid inline-style hydration mismatch */}
          <p
            aria-hidden="true"
            className="font-sans text-[11px] tracking-[0.04em] text-center text-[rgba(245,241,232,0.4)]"
          >
            Press Esc to close
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(false)}
          tabIndex={searchOpen ? 0 : -1}
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center text-white transition-colors duration-150 hover:text-[#D4A574]"
          aria-label="Close search"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* ── Morphing capsule navbar ─────────────────────────────────────── */}
      <header
        id="morph-header"
        data-state="resting"
        className="fixed inset-x-0 top-0 z-50"
      >
        <div id="site-nav">

          {/* Left: brand mark */}
          <Link
            href="/"
            className="header-logo-link flex flex-shrink-0 items-center transition-opacity duration-150 hover:opacity-85"
            aria-label="Ayesha-Sharif Publication — home"
          >
            <Image
              src="/logo/logo-horizontal-light-transparent-trimmed.png"
              alt="Ayesha-Sharif Publication"
              width={1510}
              height={272}
              sizes="(max-width: 767px) 124px, 184px"
              priority
              className="header-logo-image object-contain"
            />
          </Link>

          {/* Center: desktop nav links */}
          <nav
            role="navigation"
            aria-label="Main navigation"
            className="hidden items-center gap-0.5 md:flex"
          >
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`nav-link relative px-3 py-2 font-sans text-[12.5px] font-semibold uppercase tracking-[0.14em] transition-colors duration-150 hover:text-white ${
                  isActive(item.href) ? "nav-link-active text-white" : "text-white/85"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: icons + CTA (desktop) / hamburger (mobile) */}
          <div className="header-actions flex flex-shrink-0 items-center gap-2">

            {/* Search — desktop */}
            <button
              type="button"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="hidden h-11 w-11 items-center justify-center text-white/85 transition-colors duration-150 hover:text-white md:inline-flex"
            >
              <Search className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>

            {/* Cart — desktop */}
            <Link
              key={`cart-bump-${bumpKey}`}
              href="/cart"
              aria-label={
                cartCount > 0
                  ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`
                  : "Open cart"
              }
              className={
                `relative hidden h-11 w-11 items-center justify-center text-white/85 transition-colors duration-150 hover:text-white md:inline-flex ${bumpKey > 0 ? "cart-bump" : ""}`
              }
            >
              <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
              {cartCount > 0 && (
                <span
                  key={`cart-badge-${bumpKey}`}
                  aria-hidden="true"
                  className={`absolute -right-0.5 -top-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-gold text-[9px] font-bold leading-none text-white ${bumpKey > 0 ? "cart-badge-flash" : ""}`}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Login — desktop only, white pill button */}
            <Link
              href="/account/login"
              className="hidden select-none items-center whitespace-nowrap rounded-full bg-white px-5 py-2 font-sans text-[11.5px] font-semibold uppercase tracking-[0.18em] text-forest transition-[background-color,transform] duration-150 hover:scale-[1.02] hover:bg-cream md:inline-flex"
            >
              Login
            </Link>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
              className="site-mobile-menu-button h-11 w-11 items-center justify-center text-white"
            >
              {mobileOpen
                ? <X className="h-[22px] w-[22px]" aria-hidden="true" />
                : <Menu className="h-[22px] w-[22px]" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <nav
          id="mobile-nav"
          role="navigation"
          aria-label="Mobile navigation"
          aria-hidden={!mobileOpen}
          className="overflow-hidden md:hidden"
          style={{
            maxHeight: mobileOpen ? "340px" : "0",
            transition: "max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            backgroundColor: "#2D4A2B",
          }}
        >
          <div className="flex flex-col">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className="block font-sans text-base text-cream px-6 py-[18px] transition-colors duration-150 hover:text-gold"
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile: Login link */}
            <Link
              href="/account/login"
              onClick={() => setMobileOpen(false)}
              className="block font-sans text-base text-cream/70 px-6 py-[18px] transition-colors duration-150 hover:text-cream"
            >
              Login
            </Link>

            {/* Mobile: search + cart row */}
            <div className="flex items-center gap-4 border-t border-cream/10 px-6 py-4">
              <button
                type="button"
                aria-label="Open search"
                onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
                className="flex items-center gap-2 font-sans text-sm text-cream/70 transition-colors duration-150 hover:text-cream"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search
              </button>
              <Link
                href="/cart"
                aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Open cart"}
                onClick={() => setMobileOpen(false)}
                className="relative flex items-center gap-2 font-sans text-sm text-cream/70 transition-colors duration-150 hover:text-cream"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Cart
                {cartCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-white"
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
