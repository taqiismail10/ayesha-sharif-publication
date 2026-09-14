import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const SITEMAP_BOOK_LIMIT = 5_000;
const SITEMAP_STATUSES = [
  "published",
  "pre_order",
  "upcoming",
  "out_of_stock",
] as const;

@Injectable()
export class SeoService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Select only public SEO fields and cap the result to avoid unbounded Worker
   * memory use. Static routes are intentionally owned by the frontend.
   */
  async sitemap() {
    const books = await this.prisma.client.book.findMany({
      where: { status: { in: [...SITEMAP_STATUSES] } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: SITEMAP_BOOK_LIMIT,
    });

    return {
      books: books.map((book) => ({
        slug: book.slug,
        updatedAt: book.updatedAt.toISOString(),
      })),
    };
  }
}
