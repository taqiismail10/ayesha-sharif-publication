import "server-only";

import type { BookCardData } from "@/types";
import { fetchPublicApi } from "@/lib/public-api";

type SimilarBooksResponse = {
  ok?: boolean;
  books?: BookCardData[];
};

/**
 * Presentation-layer transport for the NestJS similarity engine. The scoring,
 * customer history, and database access remain exclusively in the API.
 */
export async function getSimilarBooks(bookId: string, take = 4) {
  try {
    const response = await fetchPublicApi<SimilarBooksResponse>(
      `/books/${encodeURIComponent(bookId)}/recommendations?take=${take}`,
    );
    return response.books || [];
  } catch {
    return [];
  }
}
