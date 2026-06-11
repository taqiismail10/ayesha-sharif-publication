import type { Prisma } from "../../../generated/prisma";

/**
 * BookCardData serialization — ported 1:1 from src/lib/data.ts
 * serializeBookCard(). The frontend's ProductCard consumes exactly this
 * shape; Decimal prices become plain numbers via Number().
 */

export const recommendationStatuses = [
  "published",
  "pre_order",
  "upcoming",
  "out_of_stock",
] as const;

export const cardInclude = {
  category: { select: { name: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
} satisfies Prisma.BookInclude;

export type BookWithCardInclude = Prisma.BookGetPayload<{
  include: typeof cardInclude;
}>;

export type BookCardData = {
  id: string;
  title: string;
  slug: string;
  author: string;
  regularPrice: number;
  salePrice: number;
  discountPercent: number;
  stockQuantity: number;
  status: string;
  coverImage: string | null;
  category: { name: string; slug: string } | null;
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isRecommended: boolean;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function serializeBookCard(book: BookWithCardInclude): BookCardData {
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
    isRecommended: book.isRecommended,
  };
}
