"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/types";

export type { CartItem };

const CART_KEY = "asp_guest_cart";
const CART_EVENT = "asp_cart_changed";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addCartItem(item: CartItem) {
  const cart = readCart();
  const existing = cart.find((cartItem) => cartItem.bookId === item.bookId);
  const maxQuantity = item.stockQuantity > 0 ? item.stockQuantity : 99;

  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, maxQuantity);
  } else {
    cart.push({ ...item, quantity: Math.min(item.quantity, maxQuantity) });
  }

  writeCart(cart);
}

export function clearCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setQuantity = useCallback((bookId: string, quantity: number) => {
    const next = readCart()
      .map((item) =>
        item.bookId === bookId
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(quantity, item.stockQuantity > 0 ? item.stockQuantity : 99)
              )
            }
          : item
      )
      .filter((item) => item.quantity > 0);
    writeCart(next);
  }, []);

  const removeItem = useCallback((bookId: string) => {
    writeCart(readCart().filter((item) => item.bookId !== bookId));
  }, []);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const api = useMemo(
    () => ({
      items,
      count,
      setQuantity,
      removeItem,
      clear: clearCart
    }),
    [count, items, removeItem, setQuantity]
  );

  return api;
}
