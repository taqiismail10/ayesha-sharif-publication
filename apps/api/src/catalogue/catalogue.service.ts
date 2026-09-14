import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import type { BookStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";

const PUBLIC_STATUSES: BookStatus[] = ["published", "pre_order", "upcoming", "out_of_stock"];

const cardInclude = {
  category: { select: { name: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
} satisfies Prisma.BookInclude;

type CardBook = Prisma.BookGetPayload<{ include: typeof cardInclude }>;

function card(book: CardBook) {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    author: book.author,
    regularPrice: Number(book.regularPrice),
    salePrice: Number(book.salePrice),
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

function numberQuery(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

@Injectable()
export class CatalogueService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async home() {
    const [featured, newArrivals, discountBooks, upcoming, bestSellers, categories] = await Promise.all([
      this.prisma.client.book.findMany({ where: { status: { in: PUBLIC_STATUSES }, isFeatured: true }, include: cardInclude, orderBy: { createdAt: "desc" }, take: 8 }),
      this.prisma.client.book.findMany({ where: { status: { in: PUBLIC_STATUSES }, isNewArrival: true }, include: cardInclude, orderBy: { createdAt: "desc" }, take: 8 }),
      this.prisma.client.book.findMany({ where: { status: { in: PUBLIC_STATUSES }, discountPercent: { gt: 0 } }, include: cardInclude, orderBy: { discountPercent: "desc" }, take: 8 }),
      this.prisma.client.book.findMany({ where: { status: { in: ["upcoming", "pre_order"] } }, include: cardInclude, orderBy: { createdAt: "desc" }, take: 8 }),
      this.prisma.client.book.findMany({ where: { status: { in: PUBLIC_STATUSES }, isBestSeller: true }, include: cardInclude, orderBy: { createdAt: "desc" }, take: 8 }),
      this.prisma.client.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { _count: { select: { books: { where: { status: { in: PUBLIC_STATUSES } } } } } } }),
    ]);
    return {
      featured: featured.map(card), newArrivals: newArrivals.map(card), discountBooks: discountBooks.map(card),
      upcoming: upcoming.map(card), bestSellers: bestSellers.map(card), categories,
    };
  }

  async list(query: Record<string, string | undefined>) {
    const status = PUBLIC_STATUSES.find((candidate) => candidate === query.status);
    const q = query.q?.trim();
    const where: Prisma.BookWhereInput = { status: status ?? { in: PUBLIC_STATUSES } };
    if (q) where.OR = [{ title: { contains: q } }, { author: { contains: q } }, { isbn13: { contains: q } }];
    if (query.category?.trim()) where.category = { slug: query.category.trim() };
    if (query.tag?.trim()) where.tags = { some: { tag: { slug: query.tag.trim() } } };
    const min = numberQuery(query.min);
    const max = numberQuery(query.max);
    if (min !== undefined || max !== undefined) where.salePrice = { gte: min, lte: max };
    const orderBy: Prisma.BookOrderByWithRelationInput[] = query.sort === "price-low"
      ? [{ salePrice: "asc" }]
      : query.sort === "price-high"
        ? [{ salePrice: "desc" }]
        : query.sort === "best-selling"
          ? [{ isBestSeller: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];
    const [books, categories, tags] = await Promise.all([
      this.prisma.client.book.findMany({ where, include: cardInclude, orderBy }),
      this.categories(), this.tags(),
    ]);
    return { books: books.map(card), categories, tags };
  }

  async detail(slug: string) {
    const book = await this.prisma.client.book.findFirst({ where: { slug, status: { in: PUBLIC_STATUSES } }, include: cardInclude });
    if (!book) throw new NotFoundException("Book not found.");
    const relatedOr: Prisma.BookWhereInput[] = [];
    if (book.categoryId) relatedOr.push({ categoryId: book.categoryId });
    const tagIds = book.tags.map((item) => item.tagId);
    if (tagIds.length) relatedOr.push({ tags: { some: { tagId: { in: tagIds } } } });
    const related = await this.prisma.client.book.findMany({
      where: { id: { not: book.id }, status: { in: PUBLIC_STATUSES }, OR: relatedOr.length ? relatedOr : undefined },
      include: cardInclude, take: 4,
    });
    return {
      book: {
        ...card(book), subtitle: book.subtitle, publisher: book.publisher, isbn13: book.isbn13, edition: book.edition,
        language: book.language, pages: book.pages, binding: book.binding, publicationDate: book.publicationDate?.toISOString() ?? null,
        shortDescription: book.shortDescription, description: book.description,
        galleryImages: Array.isArray(book.galleryImages) ? book.galleryImages.filter((image): image is string => typeof image === "string") : [],
        samplePdf: book.samplePdf, weight: book.weight,
      },
      related: related.map(card),
    };
  }

  categories() {
    return this.prisma.client.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  tags() {
    return this.prisma.client.tag.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  async languages() {
    const rows = await this.prisma.client.book.findMany({
      where: { status: { in: ["published", "pre_order", "upcoming"] } }, select: { language: true }, distinct: ["language"], orderBy: { language: "asc" },
    });
    return rows.map((row) => row.language).filter(Boolean);
  }
}
