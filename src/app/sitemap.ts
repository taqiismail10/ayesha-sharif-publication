import type { MetadataRoute } from "next";
import { fetchPublicApi } from "@/lib/public-api";

export const revalidate = 3600;

type SeoSitemapResponse = {
  books?: Array<{ slug: string; updatedAt: string }>;
};

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

  const books = await fetchPublicApi<SeoSitemapResponse>("/seo/sitemap", {
    cache: "force-cache",
    next: { revalidate },
  })
    .then((response) => response.books || [])
    .catch(() => []);

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date()
    })),
    ...books.map((book) => ({
      url: `${baseUrl}/books/${book.slug}`,
      lastModified: new Date(book.updatedAt)
    }))
  ];
}
