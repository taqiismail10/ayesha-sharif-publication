import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { hasUsableDatabaseUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const staticRoutes = [
    "",
    "/books",
    "/about",
    "/contact",
    "/delivery-policy",
    "/payment-policy",
    "/return-policy",
    "/privacy-policy",
    "/terms-and-conditions"
  ];

  let books: { slug: string; updatedAt: Date }[] = [];
  if (hasUsableDatabaseUrl()) {
    try {
      books = await prisma.book.findMany({
        where: {
          status: { in: ["published", "pre_order", "upcoming", "out_of_stock"] }
        },
        select: { slug: true, updatedAt: true }
      });
    } catch {
      books = [];
    }
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date()
    })),
    ...books.map((book) => ({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: book.updatedAt
    }))
  ];
}
