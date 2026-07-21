"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  LogOut,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  UserCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

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
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ left: number; top: number } | null>(
    null,
  );
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 224;
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const viewportPadding = 16;
    const preferredTop = rect.bottom + 8;

    setMenuStyle({
      top:
        menuHeight > 0
          ? Math.max(
              viewportPadding,
              Math.min(
                preferredTop,
                window.innerHeight - menuHeight - viewportPadding,
              ),
            )
          : preferredTop,
      left: Math.min(
        Math.max(viewportPadding, rect.right - menuWidth),
        window.innerWidth - menuWidth - viewportPadding,
      ),
    });
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    // Phase 2F: retargeted from Next's /api/account/me to the NestJS API.
    // Response shape is identical: { ok, customer: {name,email,phone} | null }
    apiFetch("/auth/customer/me", { cache: "no-store" })
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

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const positionFrame = window.requestAnimationFrame(updateMenuPosition);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    return () => {
      window.cancelAnimationFrame(positionFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
    };
  }, [closeMenu, isOpen, updateMenuPosition]);

  const handleLogout = useCallback(() => {
    closeMenu();
    apiFetch("/auth/customer/logout", { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        window.location.href = "/";
      });
  }, [closeMenu]);

  if (isLoading) {
    return (
      <div
        className="h-11 w-11 rounded-full border border-white/75 bg-white/70 shadow-sm sm:w-[112px]"
        aria-hidden="true"
      />
    );
  }

  if (!customer) return null;

  return (
    <div className="hidden md:block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) updateMenuPosition();
          setIsOpen((open) => !open);
        }}
        className="focus-ring inline-flex h-10 min-h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/90 text-forest shadow-sm sm:w-auto sm:gap-2 sm:px-3.5"
        aria-label="Customer account menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        <UserCircle className="h-5 w-5" aria-hidden="true" />
        <span className="hidden max-w-28 truncate text-sm font-extrabold sm:inline">
          Account
        </span>
      </button>
      {/* Escape the morphing header's overflow clipping context. */}
      {isOpen &&
        createPortal(
          <div
            id={menuId}
            ref={menuRef}
            style={{
              left: menuStyle?.left ?? 16,
              top: menuStyle?.top ?? 72,
            }}
            className="fixed z-[100] max-h-[calc(100vh-2rem)] w-56 overflow-y-auto rounded-md border border-line bg-white p-2 text-sm shadow-soft"
            role="menu"
            aria-label="Customer account"
          >
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Signed in as {customer.name}
            </p>
            <Link
              href="/account"
              onClick={closeMenu}
              className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
              role="menuitem"
            >
              <UserCircle className="h-4 w-4 text-gold" aria-hidden="true" />
              My Account
            </Link>
            <Link
              href="/account/orders"
              onClick={closeMenu}
              className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
              role="menuitem"
            >
              <PackageCheck className="h-4 w-4 text-gold" aria-hidden="true" />
              Orders
            </Link>
            <Link
              href="/account/saved-books"
              onClick={closeMenu}
              className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
              role="menuitem"
            >
              <BookMarked className="h-4 w-4 text-gold" aria-hidden="true" />
              Saved Books
            </Link>
            <Link
              href="/cart"
              onClick={closeMenu}
              className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
              role="menuitem"
            >
              <ShoppingCart className="h-4 w-4 text-gold" aria-hidden="true" />
              Cart
            </Link>
            <Link
              href="/account/settings#profile"
              onClick={closeMenu}
              className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
              role="menuitem"
            >
              <UserCircle className="h-4 w-4 text-gold" aria-hidden="true" />
              Profile &amp; Delivery
            </Link>
            <Link
              href="/account/security"
              onClick={closeMenu}
              className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 py-2 font-bold text-forest hover:bg-cream"
              role="menuitem"
            >
              <ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" />
              Security
            </Link>
            <div className="my-1 border-t border-line/70" aria-hidden="true" />
            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left font-bold text-danger hover:bg-danger/10"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
