import { Prisma, type BookStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CACHE_REVALIDATE_SECONDS,
  CACHE_TAGS,
  bookCacheTag
} from "@/lib/cache-tags";
import { toNumber } from "@/lib/format";
import { hasUsableDatabaseUrl } from "@/lib/env";
import {
  getSampleBookBySlug,
  getSampleBooks,
  getSampleHomeData
} from "@/lib/sample-data";
import type { BookCardData, BookDetailData } from "@/types";

const publicStatuses: BookStatus[] = [
  "published",
  "pre_order",
  "upcoming",
  "out_of_stock"
];

const cardInclude = {
  category: { select: { name: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } }
} satisfies Prisma.BookInclude;

type BookQueryParams = {
  q?: string;
  category?: string;
  tag?: string;
  status?: string;
  min?: string;
  max?: string;
  sort?: string;
};

function normalizeBookParams(params: BookQueryParams): BookQueryParams {
  return {
    q: params.q?.trim() || undefined,
    category: params.category?.trim() || undefined,
    tag: params.tag?.trim() || undefined,
    status: params.status?.trim() || undefined,
    min: params.min?.trim() || undefined,
    max: params.max?.trim() || undefined,
    sort: params.sort?.trim() || "newest"
  };
}

export function serializeBookCard(book: Prisma.BookGetPayload<{ include: typeof cardInclude }>): BookCardData {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    author: book.author,
    regularPrice: toNumber(book.regularPrice),
    salePrice: toNumber(book.salePrice),
    discountPercent: book.discountPercent,
    stockQuantity: book.stockQuantity,
    status: book.status,
    coverImage: book.coverImage,
    category: book.category,
    tags: book.tags.map((item) => item.tag.name),
    isFeatured: book.isFeatured,
    isBestSeller: book.isBestSeller,
    isNewArrival: book.isNewArrival,
    isRecommended: book.isRecommended
  };
}

export function serializeBookDetail(
  book: Prisma.BookGetPayload<{ include: typeof cardInclude }>
): BookDetailData {
  return {
    ...serializeBookCard(book),
    subtitle: book.subtitle,
    publisher: book.publisher,
    isbn13: book.isbn13,
    edition: book.edition,
    language: book.language,
    pages: book.pages,
    binding: book.binding,
    publicationDate: book.publicationDate?.toISOString() ?? null,
    shortDescription: book.shortDescription,
    description: book.description,
    galleryImages: book.galleryImages,
    samplePdf: book.samplePdf,
    weight: book.weight
  };
}

async function queryHomeData() {
  try {
    const [featured, newArrivals, discountBooks, upcoming, bestSellers, categories] =
      await Promise.all([
        prisma.book.findMany({
          where: { status: { in: publicStatuses }, isFeatured: true },
          include: cardInclude,
          orderBy: { createdAt: "desc" },
          take: 8
        }),
        prisma.book.findMany({
          where: { status: { in: publicStatuses }, isNewArrival: true },
          include: cardInclude,
          orderBy: { createdAt: "desc" },
          take: 8
        }),
        prisma.book.findMany({
          where: {
            status: { in: publicStatuses },
            discountPercent: { gt: 0 }
          },
          include: cardInclude,
          orderBy: { discountPercent: "desc" },
          take: 8
        }),
        prisma.book.findMany({
          where: { status: { in: ["upcoming", "pre_order"] } },
          include: cardInclude,
          orderBy: { createdAt: "desc" },
          take: 8
        }),
        prisma.book.findMany({
          where: { status: { in: publicStatuses }, isBestSeller: true },
          include: cardInclude,
          orderBy: { createdAt: "desc" },
          take: 8
        }),
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: {
                books: { where: { status: { in: publicStatuses } } }
              }
            }
          }
        })
      ]);

    return {
      featured: featured.map(serializeBookCard),
      newArrivals: newArrivals.map(serializeBookCard),
      discountBooks: discountBooks.map(serializeBookCard),
      upcoming: upcoming.map(serializeBookCard),
      bestSellers: bestSellers.map(serializeBookCard),
      categories
    };
  } catch {
    return getSampleHomeData();
  }
}

const getCachedHomeData = unstable_cache(queryHomeData, ["public-home-data"], {
  revalidate: CACHE_REVALIDATE_SECONDS.home,
  tags: [
    CACHE_TAGS.publicCatalogue,
    CACHE_TAGS.home,
    CACHE_TAGS.books,
    CACHE_TAGS.categories
  ]
});

export async function getHomeData() {
  if (!hasUsableDatabaseUrl()) return getSampleHomeData();
  return getCachedHomeData();
}

async function queryBooks(params: BookQueryParams) {
  const selectedStatus = publicStatuses.find((status) => status === params.status);
  const where: Prisma.BookWhereInput = {
    status: selectedStatus ?? { in: publicStatuses }
  };

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { author: { contains: params.q, mode: "insensitive" } },
      { isbn13: { contains: params.q, mode: "insensitive" } }
    ];
  }

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.tag) {
    where.tags = { some: { tag: { slug: params.tag } } };
  }

  if (params.min || params.max) {
    where.salePrice = {
      gte: params.min ? Number(params.min) : undefined,
      lte: params.max ? Number(params.max) : undefined
    };
  }

  const orderBy: Prisma.BookOrderByWithRelationInput[] =
    params.sort === "price-low"
      ? [{ salePrice: "asc" }]
      : params.sort === "price-high"
        ? [{ salePrice: "desc" }]
        : params.sort === "best-selling"
          ? [{ isBestSeller: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];

  try {
    const [books, categories, tags] = await Promise.all([
      prisma.book.findMany({
        where,
        include: cardInclude,
        orderBy
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" }
      }),
      prisma.tag.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" }
      })
    ]);

    return {
      books: books.map(serializeBookCard),
      categories,
      tags
    };
  } catch {
    return getSampleBooks(params);
  }
}

const getCachedBooks = unstable_cache(queryBooks, ["public-book-list"], {
  revalidate: CACHE_REVALIDATE_SECONDS.catalogue,
  tags: [
    CACHE_TAGS.publicCatalogue,
    CACHE_TAGS.books,
    CACHE_TAGS.categories,
    CACHE_TAGS.tags
  ]
});

export async function getBooks(params: BookQueryParams) {
  const normalizedParams = normalizeBookParams(params);
  if (!hasUsableDatabaseUrl()) return getSampleBooks(normalizedParams);
  return getCachedBooks(normalizedParams);
}

async function queryBookBySlug(slug: string) {
  try {
    const book = await prisma.book.findFirst({
      where: { slug, status: { in: publicStatuses } },
      include: cardInclude
    });

    if (!book) return getSampleBookBySlug(slug);

    const relatedOr: Prisma.BookWhereInput[] = [];
    if (book.categoryId) relatedOr.push({ categoryId: book.categoryId });
    const relatedTagIds = book.tags.map((item) => item.tagId);
    if (relatedTagIds.length) {
      relatedOr.push({
        tags: { some: { tagId: { in: relatedTagIds } } }
      });
    }

    const related = await prisma.book.findMany({
      where: {
        id: { not: book.id },
        status: { in: publicStatuses },
        OR: relatedOr.length ? relatedOr : undefined
      },
      include: cardInclude,
      take: 4
    });

    return {
      book: serializeBookDetail(book),
      related: related.map(serializeBookCard)
    };
  } catch {
    return getSampleBookBySlug(slug);
  }
}

export async function getBookBySlug(slug: string) {
  if (!hasUsableDatabaseUrl()) return getSampleBookBySlug(slug);

  return unstable_cache(() => queryBookBySlug(slug), ["public-book-detail", slug], {
    revalidate: CACHE_REVALIDATE_SECONDS.book,
    tags: [CACHE_TAGS.publicCatalogue, CACHE_TAGS.books, bookCacheTag(slug)]
  })();
}

async function queryContactSettings() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "contact" }
    });
    return setting?.value;
  } catch {
    return null;
  }
}

const getCachedContactSettings = unstable_cache(
  queryContactSettings,
  ["public-contact-settings"],
  {
    revalidate: CACHE_REVALIDATE_SECONDS.settings,
    tags: [CACHE_TAGS.settings]
  }
);

export async function getContactSettings() {
  if (!hasUsableDatabaseUrl()) return null;
  return getCachedContactSettings();
}
