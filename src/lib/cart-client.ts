"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CartItem } from "@/types";

export type { CartItem };

const CART_KEY = "asp_guest_cart";
const EMPTY_CART: CartItem[] = [];

let cartSnapshot: CartItem[] | undefined;
let storageListenerAttached = false;
const cartListeners = new Set<() => void>();

function readCart(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCartSnapshot() {
  if (cartSnapshot === undefined) cartSnapshot = readCart();
  return cartSnapshot;
}

function sameCartItem(a: CartItem, b: CartItem) {
  return (
    a.bookId === b.bookId &&
    a.title === b.title &&
    a.slug === b.slug &&
    a.author === b.author &&
    a.coverImage === b.coverImage &&
    a.regularPrice === b.regularPrice &&
    a.salePrice === b.salePrice &&
    a.stockQuantity === b.stockQuantity &&
    a.quantity === b.quantity
  );
}

function publishCart(nextItems: CartItem[]) {
  const previous = getCartSnapshot();
  const previousById = new Map(previous.map((item) => [item.bookId, item]));
  const reconciled = nextItems.map((item) => {
    const existing = previousById.get(item.bookId);
    return existing && sameCartItem(existing, item) ? existing : item;
  });

  if (
    previous.length === reconciled.length &&
    previous.every((item, index) => item === reconciled[index])
  ) {
    return;
  }

  cartSnapshot = reconciled;
  cartListeners.forEach((listener) => listener());
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  publishCart(items);
}

function handleStorage(event: StorageEvent) {
  if (event.key === CART_KEY || event.key === null) publishCart(readCart());
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);

  if (!storageListenerAttached && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    storageListenerAttached = true;
  }

  return () => {
    cartListeners.delete(listener);
    if (
      cartListeners.size === 0 &&
      storageListenerAttached &&
      typeof window !== "undefined"
    ) {
      window.removeEventListener("storage", handleStorage);
      storageListenerAttached = false;
    }
  };
}

function maxQuantityFor(item: CartItem) {
  return Number.isFinite(item.stockQuantity)
    ? Math.max(0, Math.floor(item.stockQuantity))
    : Number.POSITIVE_INFINITY;
}

function clampQuantity(item: CartItem, quantity: number) {
  return Math.max(
    0,
    Math.min(Math.floor(quantity), maxQuantityFor(item)),
  );
}

function updateCartItemQuantity(
  bookId: string,
  getNextQuantity: (current: number) => number,
) {
  const current = getCartSnapshot();
  const item = current.find((cartItem) => cartItem.bookId === bookId);
  if (!item) return 0;

  const quantity = clampQuantity(item, getNextQuantity(item.quantity));
  if (quantity === item.quantity) return quantity;

  const next = quantity === 0
    ? current.filter((cartItem) => cartItem.bookId !== bookId)
    : current.map((cartItem) =>
        cartItem.bookId === bookId ? { ...cartItem, quantity } : cartItem,
      );
  writeCart(next);
  return quantity;
}

export function addCartItem(item: CartItem) {
  const current = getCartSnapshot();
  const existing = current.find((cartItem) => cartItem.bookId === item.bookId);
  const nextQuantity = clampQuantity(
    item,
    (existing?.quantity ?? 0) + item.quantity,
  );

  if (nextQuantity === 0) return 0;

  const nextItem = { ...item, quantity: nextQuantity };
  const next = existing
    ? current.map((cartItem) =>
        cartItem.bookId === item.bookId ? nextItem : cartItem,
      )
    : [...current, nextItem];
  writeCart(next);
  return nextQuantity;
}

export function setCartItemQuantity(bookId: string, quantity: number) {
  return updateCartItemQuantity(bookId, () => quantity);
}

export function incrementCartItem(bookId: string) {
  return updateCartItemQuantity(bookId, (quantity) => quantity + 1);
}

export function decrementCartItem(bookId: string) {
  return updateCartItemQuantity(bookId, (quantity) => quantity - 1);
}

export function removeCartItem(bookId: string) {
  const current = getCartSnapshot();
  if (!current.some((item) => item.bookId === bookId)) return;
  writeCart(current.filter((item) => item.bookId !== bookId));
}

export function getItemQuantity(bookId: string) {
  return getCartSnapshot().find((item) => item.bookId === bookId)?.quantity ?? 0;
}

export function clearCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_KEY);
  publishCart([]);
}

export function useCartItemQuantity(bookId: string) {
  const subscribe = useCallback(
    (listener: () => void) => {
      let quantity = getItemQuantity(bookId);
      return subscribeToCart(() => {
        const nextQuantity = getItemQuantity(bookId);
        if (nextQuantity === quantity) return;
        quantity = nextQuantity;
        listener();
      });
    },
    [bookId],
  );
  const getSnapshot = useCallback(() => getItemQuantity(bookId), [bookId]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

export function useCart() {
  const items = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    () => EMPTY_CART,
  );
  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  return useMemo(
    () => ({
      items,
      count,
      addItem: addCartItem,
      incrementItem: incrementCartItem,
      decrementItem: decrementCartItem,
      setQuantity: setCartItemQuantity,
      removeItem: removeCartItem,
      getItemQuantity,
      clear: clearCart,
    }),
    [count, items],
  );
}
