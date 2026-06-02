export const CACHE_REVALIDATE_SECONDS = {
  home: 300,
  catalogue: 60,
  book: 300,
  settings: 300,
  sitemap: 3600
} as const;

export const CACHE_TAGS = {
  publicCatalogue: "public:catalogue",
  home: "public:home",
  books: "public:books",
  categories: "public:categories",
  tags: "public:tags",
  settings: "public:settings",
  sitemap: "public:sitemap"
} as const;

export function bookCacheTag(slug: string) {
  return `public:book:${slug}`;
}
