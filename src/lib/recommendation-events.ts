import "server-only";

import type { CustomerBookEventType } from "@prisma/client";
import type { CurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { hasUsableDatabaseUrl } from "@/lib/env";

export const recommendationEventTypes = [
  "view",
  "add_to_cart",
  "purchase",
  "search_click",
  "sample_open"
] as const satisfies CustomerBookEventType[];

const eventWeights: Record<CustomerBookEventType, number> = {
  view: 1,
  add_to_cart: 4,
  purchase: 8,
  search_click: 2,
  sample_open: 3
};

export function cleanAnonymousRecommendationId(value: unknown) {
  if (typeof value !== "string") return null;
  return /^[a-zA-Z0-9_-]{16,80}$/.test(value) ? value : null;
}

export async function recordRecommendationEvent({
  customer,
  anonymousId,
  bookId,
  eventType,
  source
}: {
  customer?: CurrentCustomer | null;
  anonymousId?: string | null;
  bookId: string;
  eventType: CustomerBookEventType;
  source?: string | null;
}) {
  if (!hasUsableDatabaseUrl()) return false;
  if (customer && !customer.profile?.personalizationConsent) return false;

  const cleanAnonymousId = customer
    ? null
    : cleanAnonymousRecommendationId(anonymousId);
  if (!customer && !cleanAnonymousId) return false;

  const book = await prisma.book.findFirst({
    where: {
      id: bookId,
      status: { in: ["published", "pre_order", "upcoming", "out_of_stock"] }
    },
    select: { id: true }
  });
  if (!book) return false;

  if (eventType === "view") {
    const recentWindow = new Date(Date.now() - 30 * 60 * 1000);
    const duplicate = await prisma.customerBookEvent.findFirst({
      where: {
        bookId,
        eventType,
        createdAt: { gte: recentWindow },
        ...(customer
          ? { customerId: customer.id }
          : { anonymousId: cleanAnonymousId || undefined })
      },
      select: { id: true }
    });
    if (duplicate) return false;
  }

  await prisma.customerBookEvent.create({
    data: {
      customerId: customer?.id,
      anonymousId: cleanAnonymousId,
      bookId,
      eventType,
      weight: eventWeights[eventType],
      source: source?.slice(0, 80)
    }
  });

  // Retention policy: delete anonymous recommendation events older than 180 days
  // with a scheduled production cleanup job. Keeping this out of request handling
  // avoids surprising latency during customer browsing.
  return true;
}
