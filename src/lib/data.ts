import { Prisma, type BookStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

export async function getHomeData() {
  if (!hasUsableDatabaseUrl()) return getSampleHomeData();

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

export async function getBooks(params: {
  q?: string;
  category?: string;
  tag?: string;
  status?: string;
  min?: string;
  max?: string;
  sort?: string;
}) {
  if (!hasUsableDatabaseUrl()) return getSampleBooks(params);

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

export async function getBookBySlug(slug: string) {
  if (!hasUsableDatabaseUrl()) return getSampleBookBySlug(slug);

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

export async function getContactSettings() {
  if (!hasUsableDatabaseUrl()) return null;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "contact" }
    });
    return setting?.value;
  } catch {
    return null;
  }
}
