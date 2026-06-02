import "server-only";

import { unstable_cache } from "next/cache";
import { Prisma, type BookStatus } from "@prisma/client";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, bookCacheTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { hasUsableDatabaseUrl } from "@/lib/env";
import { serializeBookCard } from "@/lib/data";
import { getSampleHomeData } from "@/lib/sample-data";
import type { BookCardData } from "@/types";

const recommendationStatuses: BookStatus[] = [
  "published",
  "pre_order",
  "upcoming",
  "out_of_stock"
];

const recommendationInclude = {
  category: { select: { name: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } }
} satisfies Prisma.BookInclude;

type RecommendationBook = Prisma.BookGetPayload<{
  include: typeof recommendationInclude;
}>;

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
    excludeBookIds: new Set()
  };
}

function addScore(map: Map<string, number>, key: string | null | undefined, score: number) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + score);
}

function addBookSignals(
  signals: SignalSet,
  book: RecommendationBook,
  score: number,
  exclude = false
) {
  if (exclude) signals.excludeBookIds.add(book.id);
  addScore(signals.categoryIds, book.categoryId, score);
  addScore(signals.authors, book.author, Math.max(1, Math.floor(score / 2)));
  addScore(signals.languages, book.language, Math.max(1, Math.floor(score / 2)));
  for (const item of book.tags) {
    addScore(signals.tagIds, item.tagId, score);
  }
}

function candidateScore(book: RecommendationBook, signals: SignalSet) {
  let score = 0;
  score += book.categoryId ? signals.categoryIds.get(book.categoryId) || 0 : 0;
  score += signals.authors.get(book.author) || 0;
  score += signals.languages.get(book.language) || 0;
  for (const item of book.tags) {
    score += signals.tagIds.get(item.tagId) || 0;
  }
  if (book.stockQuantity > 0 && ["published", "pre_order"].includes(book.status)) {
    score += 2;
  }
  if (book.discountPercent > 0) score += 1;
  if (["upcoming", "pre_order"].includes(book.status)) score += 1;
  if (book.isBestSeller) score += 2;
  if (book.isFeatured) score += 1;
  return score;
}

function sortRecommendations(books: RecommendationBook[], signals: SignalSet, take: number) {
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

async function fallbackRecommendations(take: number): Promise<BookCardData[]> {
  if (!hasUsableDatabaseUrl()) {
    return getSampleHomeData().bestSellers.slice(0, take);
  }

  const books = await prisma.book.findMany({
    where: { status: { in: recommendationStatuses } },
    include: recommendationInclude,
    orderBy: [
      { isBestSeller: "desc" },
      { isFeatured: "desc" },
      { isNewArrival: "desc" },
      { createdAt: "desc" }
    ],
    take
  });
  return books.map(serializeBookCard);
}

async function querySimilarBooks(slug: string, take: number) {
  if (!hasUsableDatabaseUrl()) {
    return getSampleHomeData().featured.slice(0, take);
  }

  const source = await prisma.book.findFirst({
    where: { slug, status: { in: recommendationStatuses } },
    include: recommendationInclude
  });
  if (!source) return fallbackRecommendations(take);

  const tagIds = source.tags.map((item) => item.tagId);
  const similarWhere: Prisma.BookWhereInput[] = [
    { author: source.author },
    { language: source.language }
  ];
  if (source.categoryId) similarWhere.push({ categoryId: source.categoryId });
  if (tagIds.length) {
    similarWhere.push({ tags: { some: { tagId: { in: tagIds } } } });
  }

  const candidates = await prisma.book.findMany({
    where: {
      id: { not: source.id },
      status: { in: recommendationStatuses },
      OR: similarWhere
    },
    include: recommendationInclude,
    orderBy: [{ stockQuantity: "desc" }, { createdAt: "desc" }],
    take: 32
  });

  const signals = createSignalSet();
  addBookSignals(signals, source, 5, true);
  return sortRecommendations(candidates, signals, take);
}

export async function getSimilarBooks(slug: string, take = 4) {
  return unstable_cache(() => querySimilarBooks(slug, take), ["similar-books", slug], {
    revalidate: CACHE_REVALIDATE_SECONDS.book,
    tags: [CACHE_TAGS.publicCatalogue, CACHE_TAGS.books, bookCacheTag(slug)]
  })();
}

export async function getCartRecommendations(bookIds: string[], take = 4) {
  if (!bookIds.length) return fallbackRecommendations(take);
  if (!hasUsableDatabaseUrl()) return getSampleHomeData().bestSellers.slice(0, take);

  const cartBooks = await prisma.book.findMany({
    where: { id: { in: bookIds }, status: { in: recommendationStatuses } },
    include: recommendationInclude
  });
  if (!cartBooks.length) return fallbackRecommendations(take);

  const signals = createSignalSet();
  for (const book of cartBooks) addBookSignals(signals, book, 5, true);

  const categoryIds = [...signals.categoryIds.keys()];
  const tagIds = [...signals.tagIds.keys()];
  const cartWhere: Prisma.BookWhereInput[] = [];
  if (categoryIds.length) cartWhere.push({ categoryId: { in: categoryIds } });
  if (tagIds.length) {
    cartWhere.push({ tags: { some: { tagId: { in: tagIds } } } });
  }

  const candidates = await prisma.book.findMany({
    where: {
      status: { in: recommendationStatuses },
      id: { notIn: [...signals.excludeBookIds] },
      OR: cartWhere.length ? cartWhere : undefined
    },
    include: recommendationInclude,
    take: 32
  });

  const scored = sortRecommendations(candidates, signals, take);
  return scored.length ? scored : fallbackRecommendations(take);
}

export async function getPersonalizedRecommendations({
  customerId,
  anonymousId,
  take = 8
}: {
  customerId?: string | null;
  anonymousId?: string | null;
  take?: number;
}) {
  if (!hasUsableDatabaseUrl()) return getSampleHomeData().bestSellers.slice(0, take);
  if (!customerId && !anonymousId) return fallbackRecommendations(take);

  const signals = createSignalSet();

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { profile: true, preferences: true }
    });
    if (!customer?.profile?.personalizationConsent) {
      return fallbackRecommendations(take);
    }

    const [events, orders] = await Promise.all([
      prisma.customerBookEvent.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { book: { include: recommendationInclude } }
      }),
      prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: { include: { book: { include: recommendationInclude } } } }
      })
    ]);

    for (const event of events) {
      addBookSignals(signals, event.book, Math.max(1, event.weight), true);
    }
    for (const order of orders) {
      for (const item of order.items) {
        addBookSignals(signals, item.book, 6, true);
      }
    }

    const preferredCategories = Array.isArray(customer.preferences?.preferredCategories)
      ? customer.preferences.preferredCategories
      : [];
    const preferredTags = Array.isArray(customer.preferences?.preferredTags)
      ? customer.preferences.preferredTags
      : [];
    const preferredLanguages = Array.isArray(customer.preferences?.preferredLanguages)
      ? customer.preferences.preferredLanguages
      : [];

    for (const categoryId of preferredCategories) {
      if (typeof categoryId === "string") addScore(signals.categoryIds, categoryId, 6);
    }
    for (const tagId of preferredTags) {
      if (typeof tagId === "string") addScore(signals.tagIds, tagId, 4);
    }
    for (const language of preferredLanguages) {
      if (typeof language === "string") addScore(signals.languages, language, 3);
    }
  } else if (anonymousId) {
    const events = await prisma.customerBookEvent.findMany({
      where: { anonymousId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { book: { include: recommendationInclude } }
    });
    for (const event of events) {
      addBookSignals(signals, event.book, Math.max(1, event.weight), true);
    }
  }

  const categoryIds = [...signals.categoryIds.keys()];
  const tagIds = [...signals.tagIds.keys()];
  const authors = [...signals.authors.keys()];
  const languages = [...signals.languages.keys()];

  if (!categoryIds.length && !tagIds.length && !authors.length && !languages.length) {
    return fallbackRecommendations(take);
  }

  const personalizedWhere: Prisma.BookWhereInput[] = [];
  if (categoryIds.length) personalizedWhere.push({ categoryId: { in: categoryIds } });
  if (tagIds.length) {
    personalizedWhere.push({ tags: { some: { tagId: { in: tagIds } } } });
  }
  if (authors.length) personalizedWhere.push({ author: { in: authors } });
  if (languages.length) personalizedWhere.push({ language: { in: languages } });

  const candidates = await prisma.book.findMany({
    where: {
      status: { in: recommendationStatuses },
      id: { notIn: [...signals.excludeBookIds] },
      OR: personalizedWhere
    },
    include: recommendationInclude,
    take: 48
  });

  const scored = sortRecommendations(candidates, signals, take);
  return scored.length ? scored : fallbackRecommendations(take);
}
