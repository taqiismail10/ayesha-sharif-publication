import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CurrentCustomer } from "../customer-auth/customer-auth.service";

/**
 * Ported 1:1 from src/lib/recommendation-events.ts.
 * Phase 2D needs recordRecommendationEvent for checkout "purchase" events;
 * the HTTP endpoints around this service arrive in Phase 2E.
 */

export const recommendationEventTypes = [
  "view",
  "add_to_cart",
  "purchase",
  "search_click",
  "sample_open",
] as const;

export type RecommendationEventType =
  (typeof recommendationEventTypes)[number];

const eventWeights: Record<RecommendationEventType, number> = {
  view: 1,
  add_to_cart: 4,
  purchase: 8,
  search_click: 2,
  sample_open: 3,
};

export function cleanAnonymousRecommendationId(value: unknown) {
  if (typeof value !== "string") return null;
  return /^[a-zA-Z0-9_-]{16,80}$/.test(value) ? value : null;
}

@Injectable()
export class RecommendationEventsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Consent-aware event write — identical rules to the old lib:
   *  - logged-in customer WITHOUT personalizationConsent → not tracked
   *  - guest without a valid anonymousId → not tracked
   *  - book must exist in a publicly visible status
   *  - "view" deduped per actor+book within 30 minutes
   */
  async record({
    customer,
    anonymousId,
    bookId,
    eventType,
    source,
  }: {
    customer?: CurrentCustomer | null;
    anonymousId?: string | null;
    bookId: string;
    eventType: RecommendationEventType;
    source?: string | null;
  }): Promise<boolean> {
    if (!this.prisma.isAvailable()) return false;
    if (customer && !customer.profile?.personalizationConsent) return false;

    const cleanAnonymousId = customer
      ? null
      : cleanAnonymousRecommendationId(anonymousId);
    if (!customer && !cleanAnonymousId) return false;

    const db = this.prisma.client;

    const book = await db.book.findFirst({
      where: {
        id: bookId,
        status: { in: ["published", "pre_order", "upcoming", "out_of_stock"] },
      },
      select: { id: true },
    });
    if (!book) return false;

    if (eventType === "view") {
      const recentWindow = new Date(Date.now() - 30 * 60 * 1000);
      const duplicate = await db.customerBookEvent.findFirst({
        where: {
          bookId,
          eventType,
          createdAt: { gte: recentWindow },
          ...(customer
            ? { customerId: customer.id }
            : { anonymousId: cleanAnonymousId || undefined }),
        },
        select: { id: true },
      });
      if (duplicate) return false;
    }

    await db.customerBookEvent.create({
      data: {
        customerId: customer?.id,
        anonymousId: cleanAnonymousId,
        bookId,
        eventType,
        weight: eventWeights[eventType],
        source: source?.slice(0, 80),
      },
    });

    return true;
  }
}
