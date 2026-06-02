"use client";

import { getAnonymousRecommendationId } from "@/lib/consent-client";

type BookEventType =
  | "view"
  | "add_to_cart"
  | "purchase"
  | "search_click"
  | "sample_open";

function recentlyTracked(bookId: string, eventType: BookEventType) {
  if (typeof window === "undefined" || eventType !== "view") return false;
  const key = `asp_book_event_${eventType}_${bookId}`;
  if (window.sessionStorage.getItem(key)) return true;
  window.sessionStorage.setItem(key, Date.now().toString());
  return false;
}

export function trackBookEvent({
  bookId,
  eventType,
  source
}: {
  bookId: string;
  eventType: BookEventType;
  source?: string;
}) {
  if (recentlyTracked(bookId, eventType)) return;
  const anonymousId = getAnonymousRecommendationId();

  fetch("/api/recommendation-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookId,
      eventType,
      source,
      anonymousId
    }),
    keepalive: true
  }).catch(() => {
    // Recommendation tracking must never interrupt browsing, cart, or checkout UX.
  });
}
