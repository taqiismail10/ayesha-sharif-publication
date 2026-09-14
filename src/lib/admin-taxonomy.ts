import "server-only";
import { adminApi } from "@/lib/auth";

export type AdminTaxonomyEntry = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  _count: { books: number };
};

export async function getAdminTaxonomy(kind: "categories" | "tags"): Promise<AdminTaxonomyEntry[]> {
  const response = await adminApi(`/admin/${kind}`);
  if (!response.ok) throw new Error(`Could not load ${kind}.`);
  return response.json();
}
