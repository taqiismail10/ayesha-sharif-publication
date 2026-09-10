import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  cardInclude,
  recommendationStatuses,
  serializeBookCard,
  type BookCardData,
  type BookWithCardInclude,
} from "../common/contracts/book-card";

/**
 * Recommendation engine — ported 1:1 from src/lib/recommendations.ts.
 * Same signal accumulation, candidate scoring, ranking tie-break (createdAt
 * desc), candidate pool sizes (32 / 48), and popularity fallback.
 *
 * Deliberate deviations (documented in API_ROUTES.md):
 *  - No unstable_cache (Next-only mechanism) — queries run per request.
 *  - No sample-data demo mode: with no DB configured the controller returns
 *    { ok: true, books: [] } instead of canned books (frontend sections
 *    hide themselves when the list is empty).
 */

type SignalSet = {
  categoryIds: Map<string, number>;
  tagIds: Map<string, number>;
  authors: Map<string, number>;
  languages: Map<string, number>;
  excludeBookIds: Set<string>;
};

function createSignalSet(): SignalSet {
  return {
    categoryIds: new Map(),
    tagIds: new Map(),
    authors: new Map(),
    languages: new Map(),
    excludeBookIds: new Set(),
  };
}

function addScore(
  map: Map<string, number>,
  key: string | null | undefined,
  score: number,
) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + score);
}

function addBookSignals(
  signals: SignalSet,
  book: BookWithCardInclude,
  score: number,
  exclude = false,
) {
  if (exclude) signals.excludeBookIds.add(book.id);
  addScore(signals.categoryIds, book.categoryId, score);
  addScore(signals.authors, book.author, Math.max(1, Math.floor(score / 2)));
  addScore(signals.languages, book.language, Math.max(1, Math.floor(score / 2)));
  for (const item of book.tags) {
    addScore(signals.tagIds, item.tagId, score);
  }
}

function candidateScore(book: BookWithCardInclude, signals: SignalSet) {
  let score = 0;
  score += book.categoryId ? signals.categoryIds.get(book.categoryId) || 0 : 0;
  score += signals.authors.get(book.author) || 0;
  score += signals.languages.get(book.language) || 0;
  for (const item of book.tags) {
    score += signals.tagIds.get(item.tagId) || 0;
  }
  if (
    book.stockQuantity > 0 &&
    ["published", "pre_order"].includes(book.status)
  ) {
    score += 2;
  }
  if (book.discountPercent > 0) score += 1;
  if (["upcoming", "pre_order"].includes(book.status)) score += 1;
  if (book.isBestSeller) score += 2;
  if (book.isFeatured) score += 1;
  return score;
}

function sortRecommendations(
  books: BookWithCardInclude[],
  signals: SignalSet,
  take: number,
): BookCardData[] {
  return books
    .filter((book) => !signals.excludeBookIds.has(book.id))
    .map((book) => ({ book, score: candidateScore(book, signals) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.book.createdAt.getTime() - a.book.createdAt.getTime();
    })
    .slice(0, take)
    .map((item) => serializeBookCard(item.book));
}

@Injectable()
export class RecommendationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Popularity fallback — bestSeller > featured > newArrival > newest. */
  private async fallbackRecommendations(take: number): Promise<BookCardData[]> {
    const books = await this.prisma.client.book.findMany({
      where: { status: { in: [...recommendationStatuses] } },
      include: cardInclude,
      orderBy: [
        { isBestSeller: "desc" },
        { isFeatured: "desc" },
        { isNewArrival: "desc" },
        { createdAt: "desc" },
      ],
      take,
    });
    return books.map(serializeBookCard);
  }

  /** Cart-based: signals from cart books (score 5, excluded), pool of 32. */
  async getCartRecommendations(
    bookIds: string[],
    take = 4,
  ): Promise<BookCardData[]> {
    if (!this.prisma.isAvailable()) return [];
    if (!bookIds.length) return this.fallbackRecommendations(take);

    const db = this.prisma.client;
    const cartBooks = await db.book.findMany({
      where: { id: { in: bookIds }, status: { in: [...recommendationStatuses] } },
      include: cardInclude,
    });
    if (!cartBooks.length) return this.fallbackRecommendations(take);

    const signals = createSignalSet();
    for (const book of cartBooks) addBookSignals(signals, book, 5, true);

    const categoryIds = [...signals.categoryIds.keys()];
    const tagIds = [...signals.tagIds.keys()];
    const cartWhere: Prisma.BookWhereInput[] = [];
    if (categoryIds.length) cartWhere.push({ categoryId: { in: categoryIds } });
    if (tagIds.length) {
      cartWhere.push({ tags: { some: { tagId: { in: tagIds } } } });
    }

    const candidates = await db.book.findMany({
      where: {
        status: { in: [...recommendationStatuses] },
        id: { notIn: [...signals.excludeBookIds] },
        OR: cartWhere.length ? cartWhere : undefined,
      },
      include: cardInclude,
      take: 32,
    });

    const scored = sortRecommendations(candidates, signals, take);
    return scored.length ? scored : this.fallbackRecommendations(take);
  }

  /**
   * Personalized: customer events (last 40) + orders (last 10, score 6) +
   * stated preferences (cat 6 / tag 4 / lang 3); anonymous falls back to the
   * anonymousId event history (last 30). Consent-gated for customers.
   */
  async getPersonalizedRecommendations({
    customerId,
    anonymousId,
    take = 8,
  }: {
    customerId?: string | null;
    anonymousId?: string | null;
    take?: number;
  }): Promise<BookCardData[]> {
    if (!this.prisma.isAvailable()) return [];
    if (!customerId && !anonymousId) return this.fallbackRecommendations(take);

    const db = this.prisma.client;
    const signals = createSignalSet();

    if (customerId) {
      const customer = await db.customer.findUnique({
        where: { id: customerId },
        include: { profile: true, preferences: true },
      });
      if (!customer?.profile?.personalizationConsent) {
        return this.fallbackRecommendations(take);
      }

      const [events, orders] = await Promise.all([
        db.customerBookEvent.findMany({
          where: { customerId },
          orderBy: { createdAt: "desc" },
          take: 40,
          include: { book: { include: cardInclude } },
        }),
        db.order.findMany({
          where: { customerId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: { include: { book: { include: cardInclude } } } },
        }),
      ]);

      for (const event of events) {
        addBookSignals(signals, event.book, Math.max(1, event.weight), true);
      }
      for (const order of orders) {
        for (const item of order.items) {
          addBookSignals(signals, item.book, 6, true);
        }
      }

      const preferredCategories = Array.isArray(
        customer.preferences?.preferredCategories,
      )
        ? customer.preferences.preferredCategories
        : [];
      const preferredTags = Array.isArray(customer.preferences?.preferredTags)
        ? customer.preferences.preferredTags
        : [];
      const preferredLanguages = Array.isArray(
        customer.preferences?.preferredLanguages,
      )
        ? customer.preferences.preferredLanguages
        : [];

      for (const categoryId of preferredCategories) {
        if (typeof categoryId === "string") {
          addScore(signals.categoryIds, categoryId, 6);
        }
      }
      for (const tagId of preferredTags) {
        if (typeof tagId === "string") addScore(signals.tagIds, tagId, 4);
      }
      for (const language of preferredLanguages) {
        if (typeof language === "string") {
          addScore(signals.languages, language, 3);
        }
      }
    } else if (anonymousId) {
      const events = await db.customerBookEvent.findMany({
        where: { anonymousId },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { book: { include: cardInclude } },
      });
      for (const event of events) {
        addBookSignals(signals, event.book, Math.max(1, event.weight), true);
      }
    }

    const categoryIds = [...signals.categoryIds.keys()];
    const tagIds = [...signals.tagIds.keys()];
    const authors = [...signals.authors.keys()];
    const languages = [...signals.languages.keys()];

    if (
      !categoryIds.length &&
      !tagIds.length &&
      !authors.length &&
      !languages.length
    ) {
      return this.fallbackRecommendations(take);
    }

    const personalizedWhere: Prisma.BookWhereInput[] = [];
    if (categoryIds.length) {
      personalizedWhere.push({ categoryId: { in: categoryIds } });
    }
    if (tagIds.length) {
      personalizedWhere.push({ tags: { some: { tagId: { in: tagIds } } } });
    }
    if (authors.length) personalizedWhere.push({ author: { in: authors } });
    if (languages.length) {
      personalizedWhere.push({ language: { in: languages } });
    }

    const candidates = await db.book.findMany({
      where: {
        status: { in: [...recommendationStatuses] },
        id: { notIn: [...signals.excludeBookIds] },
        OR: personalizedWhere,
      },
      include: cardInclude,
      take: 48,
    });

    const scored = sortRecommendations(candidates, signals, take);
    return scored.length ? scored : this.fallbackRecommendations(take);
  }
}
