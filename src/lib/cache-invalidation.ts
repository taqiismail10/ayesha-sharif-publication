import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, bookCacheTag, policyCacheTag } from "@/lib/cache-tags";

function revalidatePublicRoutes(slugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/books");
  revalidatePath("/search");
  revalidatePath("/sitemap.xml");

  for (const slug of slugs) {
    revalidatePath(`/books/${slug}`);
  }
}

export function revalidatePublicCatalogue(slugs: Array<string | null | undefined> = []) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean) as string[])];

  revalidateTag(CACHE_TAGS.publicCatalogue);
  revalidateTag(CACHE_TAGS.home);
  revalidateTag(CACHE_TAGS.books);
  revalidateTag(CACHE_TAGS.categories);
  revalidateTag(CACHE_TAGS.tags);
  revalidateTag(CACHE_TAGS.sitemap);

  for (const slug of uniqueSlugs) {
    revalidateTag(bookCacheTag(slug));
  }

  revalidatePublicRoutes(uniqueSlugs);
}

export function revalidatePublicSettings() {
  revalidateTag(CACHE_TAGS.settings);
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export function revalidatePublicPolicy(slug: string) {
  revalidateTag(CACHE_TAGS.policies);
  revalidateTag(policyCacheTag(slug));
  revalidatePath(`/${slug}`);
}
