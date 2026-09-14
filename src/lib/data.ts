import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, bookCacheTag } from "@/lib/cache-tags";
import { toNumber } from "@/lib/format";
import { fetchPublicApi } from "@/lib/public-api";
import { getSampleBookBySlug, getSampleBooks, getSampleHomeData } from "@/lib/sample-data";
import type { BookCardData, BookDetailData } from "@/types";

type BookQueryParams = {
  q?: string;
  category?: string;
  tag?: string;
  status?: string;
  min?: string;
  max?: string;
  sort?: string;
};

type CardSource = Omit<BookCardData, "tags" | "regularPrice" | "salePrice"> & {
  tags: Array<string | { tag: { name: string } }>;
  regularPrice: number | { toString(): string };
  salePrice: number | { toString(): string };
};

type DetailSource = CardSource & Omit<BookDetailData, keyof BookCardData | "galleryImages"> & { galleryImages: unknown };
type CatalogueHome = ReturnType<typeof getSampleHomeData>;
type CatalogueList = Awaited<ReturnType<typeof getSampleBooks>>;
type CatalogueDetail = Awaited<ReturnType<typeof getSampleBookBySlug>>;

function normalizeBookParams(params: BookQueryParams): BookQueryParams {
  return {
    q: params.q?.trim() || undefined,
    category: params.category?.trim() || undefined,
    tag: params.tag?.trim() || undefined,
    status: params.status?.trim() || undefined,
    min: params.min?.trim() || undefined,
    max: params.max?.trim() || undefined,
    sort: params.sort?.trim() || "newest",
  };
}

/** Retained for legacy recommendation helpers until Test 31 migrates them. */
export function serializeBookCard(book: CardSource): BookCardData {
  return {
    ...book,
    regularPrice: toNumber(book.regularPrice),
    salePrice: toNumber(book.salePrice),
    tags: book.tags.map((item) => typeof item === "string" ? item : item.tag.name),
  };
}

export function serializeBookDetail(book: DetailSource): BookDetailData {
  return {
    ...serializeBookCard(book),
    subtitle: book.subtitle,
    publisher: book.publisher,
    isbn13: book.isbn13,
    edition: book.edition,
    language: book.language,
    pages: book.pages,
    binding: book.binding,
    publicationDate: book.publicationDate,
    shortDescription: book.shortDescription,
    description: book.description,
    galleryImages: Array.isArray(book.galleryImages)
      ? book.galleryImages.filter((item): item is string => typeof item === "string")
      : [],
    samplePdf: book.samplePdf,
    weight: book.weight,
  };
}

async function queryHomeData(): Promise<CatalogueHome> {
  try {
    return await fetchPublicApi<CatalogueHome>("/catalogue/home");
  } catch {
    return getSampleHomeData();
  }
}

const getCachedHomeData = unstable_cache(queryHomeData, ["public-home-data"], {
  revalidate: CACHE_REVALIDATE_SECONDS.home,
  tags: [CACHE_TAGS.publicCatalogue, CACHE_TAGS.home, CACHE_TAGS.books, CACHE_TAGS.categories],
});

export async function getHomeData() {
  return getCachedHomeData();
}

async function queryBooks(params: BookQueryParams): Promise<CatalogueList> {
  try {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value) as Array<[string, string]>);
    return await fetchPublicApi<CatalogueList>(`/books?${query.toString()}`);
  } catch {
    return getSampleBooks(params);
  }
}

const getCachedBooks = unstable_cache(queryBooks, ["public-book-list"], {
  revalidate: CACHE_REVALIDATE_SECONDS.catalogue,
  tags: [CACHE_TAGS.publicCatalogue, CACHE_TAGS.books, CACHE_TAGS.categories, CACHE_TAGS.tags],
});

export async function getBooks(params: BookQueryParams) {
  return getCachedBooks(normalizeBookParams(params));
}

async function queryBookBySlug(slug: string): Promise<CatalogueDetail> {
  try {
    return await fetchPublicApi<CatalogueDetail>(`/books/${encodeURIComponent(slug)}`);
  } catch {
    return getSampleBookBySlug(slug);
  }
}

export async function getBookBySlug(slug: string) {
  return unstable_cache(() => queryBookBySlug(slug), ["public-book-detail", slug], {
    revalidate: CACHE_REVALIDATE_SECONDS.book,
    tags: [CACHE_TAGS.publicCatalogue, CACHE_TAGS.books, bookCacheTag(slug)],
  })();
}

export async function getContactSettings() {
  return null;
}
