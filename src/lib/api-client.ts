"use client";

/**
 * Centralized client for the NestJS backend (Phase 2F).
 *
 * Base URL resolution (first match wins):
 *   1. NEXT_PUBLIC_API_BASE_URL  — preferred going forward
 *   2. NEXT_PUBLIC_API_URL       — legacy name introduced in Phase 2C
 *   3. http://localhost:4000     — local dev default
 *
 * NOTE: the NestJS API has NO global /api prefix — routes are /orders,
 * /auth/customer/me, /recommendations, … (see docs/API_ROUTES.md).
 *
 * All requests send cookies (credentials: "include") because customer auth
 * is a httpOnly session cookie shared with the Next.js app. Auth tokens are
 * never stored in localStorage and never readable from JavaScript.
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

/** Absolute URL for an API path ("/orders" → "http://localhost:4000/orders"). */
export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** fetch() against the API with cookies included by default. */
export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...init,
  });
}
