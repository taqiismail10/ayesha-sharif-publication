export const CACHE_REVALIDATE_SECONDS = {
  home: 300,
  homepage: 300,
  catalogue: 60,
  book: 300,
  settings: 300,
  policies: 300,
  sitemap: 3600
} as const;

export const CACHE_TAGS = {
  publicCatalogue: "public:catalogue",
  home: "public:home",
  homepage: "public:homepage",
  books: "public:books",
  categories: "public:categories",
  tags: "public:tags",
  settings: "public:settings",
  policies: "public:policies",
  sitemap: "public:sitemap"
} as const;

export function bookCacheTag(slug: string) {
  return `public:book:${slug}`;
}

export function policyCacheTag(slug: string) {
  return `public:policy:${slug}`;
}
