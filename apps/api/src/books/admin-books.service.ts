import { Inject, Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";
import { D1AtomicService } from "../prisma/d1-atomic.service";

const bookFields = {
  title: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  subtitle: z.string().trim().optional().nullable(), author: z.string().trim().min(2),
  publisher: z.string().trim().min(2), isbn13: z.string().trim().optional().nullable(),
  edition: z.string().trim().optional().nullable(), language: z.string().trim().min(2),
  pages: z.coerce.number().int().min(0).optional().nullable(), binding: z.string().trim().optional().nullable(),
  publicationDate: z.string().optional().nullable(), shortDescription: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(), regularPrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0), discountPercent: z.coerce.number().int().min(0).max(100),
  discountStart: z.string().optional().nullable(), discountEnd: z.string().optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0), status: z.enum(["draft", "upcoming", "pre_order", "published", "out_of_stock", "archived"]),
  coverImage: z.string().trim().optional().nullable(), galleryImages: z.array(z.string()).default([]),
  samplePdf: z.string().trim().optional().nullable(), weight: z.coerce.number().int().min(0).optional().nullable(),
  categoryId: z.string().optional().nullable(), tagIds: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false), isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false), isRecommended: z.boolean().default(false),
};

export const adminBookSchema = z.object(bookFields);
export type AdminBookInput = z.infer<typeof adminBookSchema>;

const bookInclude = {
  category: true,
  tags: { include: { tag: true } },
  _count: { select: { orderItems: true } },
} as const;

@Injectable()
export class AdminBooksService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(D1AtomicService) private readonly atomic: D1AtomicService,
  ) {}

  async list(q?: string) {
    const query = q?.trim();
    return this.prisma.client.book.findMany({
      where: query ? { OR: [{ title: { contains: query } }, { author: { contains: query } }, { isbn13: { contains: query } }] } : undefined,
      include: { category: true, _count: { select: { orderItems: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async detail(id: string) {
    const book = await this.prisma.client.book.findUnique({ where: { id }, include: bookInclude });
    if (!book) throw new NotFoundException("Book not found.");
    return book;
  }

  private data(input: AdminBookInput) {
    return {
      title: input.title, slug: input.slug, subtitle: input.subtitle || null, author: input.author,
      publisher: input.publisher, isbn13: input.isbn13 || null, edition: input.edition || null,
      language: input.language, pages: input.pages ?? null, binding: input.binding || null,
      publicationDate: input.publicationDate ? new Date(input.publicationDate) : null,
      shortDescription: input.shortDescription || null, description: input.description || null,
      regularPrice: input.regularPrice, salePrice: input.salePrice, discountPercent: input.discountPercent,
      discountStart: input.discountStart ? new Date(input.discountStart) : null,
      discountEnd: input.discountEnd ? new Date(input.discountEnd) : null, stockQuantity: input.stockQuantity,
      status: input.status, coverImage: input.coverImage || null, galleryImages: input.galleryImages,
      samplePdf: input.samplePdf || null, weight: input.weight ?? null, categoryId: input.categoryId || null,
      isFeatured: input.isFeatured, isBestSeller: input.isBestSeller, isNewArrival: input.isNewArrival, isRecommended: input.isRecommended,
    };
  }

  async create(input: AdminBookInput) {
    try {
      return await this.prisma.client.book.create({ data: { ...this.data(input), tags: { create: input.tagIds.map((tagId) => ({ tagId })) } } });
    } catch (error) {
      if (error instanceof Error && /UNIQUE/i.test(error.message)) throw new ConflictException("A book with this slug or ISBN already exists.");
      throw error;
    }
  }

  async update(id: string, input: AdminBookInput) {
    const current = await this.detail(id);
    const { stockQuantity, ...metadata } = this.data(input);
    await this.prisma.client.book.update({ where: { id }, data: { ...metadata, stockQuantity: current.stockQuantity, tags: { deleteMany: {}, create: input.tagIds.map((tagId) => ({ tagId })) } } });
    if (stockQuantity !== current.stockQuantity) {
      const changed = await this.atomic.setBookStock(id, current.stockQuantity, stockQuantity);
      if (!changed) throw new ConflictException("Stock changed concurrently. Reload and try again.");
    }
    return this.detail(id);
  }

  async setArchive(id: string, archived: boolean) {
    await this.detail(id);
    return this.prisma.client.book.update({ where: { id }, data: { status: archived ? "archived" : "draft" } });
  }

  async setStock(id: string, stockQuantity: number) {
    const current = await this.detail(id);
    const changed = await this.atomic.setBookStock(id, current.stockQuantity, stockQuantity);
    if (!changed) throw new ConflictException("Stock changed concurrently. Reload and try again.");
    return this.detail(id);
  }

  async delete(id: string) {
    const book = await this.prisma.client.book.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!book) throw new NotFoundException("Book not found.");

    const deleted = await this.atomic.deleteBookIfNoOrderItems(id);
    if (!deleted) {
      const stillExists = await this.prisma.client.book.findUnique({ where: { id }, select: { id: true } });
      if (!stillExists) throw new NotFoundException("Book not found.");
      throw new ConflictException("This book has orders and cannot be deleted.");
    }
    return { slug: book.slug };
  }
}
