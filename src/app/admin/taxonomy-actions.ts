"use server";

import { revalidatePath } from "next/cache";
import { adminApi } from "@/lib/auth";
import { revalidatePublicCatalogue } from "@/lib/cache-invalidation";

// Transport/cache adapters only. NestJS owns roles, validation, slugs and writes.
async function submit(kind: "categories" | "tags", method: string, suffix: string, body?: object) {
  const response = await adminApi(`/admin/${kind}${suffix}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message || `Could not save ${kind}.`);
  }
  revalidatePath(`/admin/${kind}`);
  revalidatePublicCatalogue();
}

function fields(form: FormData, category: boolean, update: boolean) {
  return {
    name: form.get("name"),
    slug: form.get("slug"),
    ...(category ? { description: form.get("description") } : {}),
    ...(update ? { isActive: form.get("isActive") === "on" } : {}),
  };
}

export async function createCategoryAction(form: FormData) {
  await submit("categories", "POST", "", fields(form, true, false));
}
export async function updateCategoryAction(id: string, form: FormData) {
  await submit("categories", "PUT", `/${encodeURIComponent(id)}`, fields(form, true, true));
}
export async function archiveCategoryAction(form: FormData) {
  await submit("categories", "PATCH", `/${encodeURIComponent(String(form.get("id")))}/archive`);
}
export async function createTagAction(form: FormData) {
  await submit("tags", "POST", "", fields(form, false, false));
}
export async function updateTagAction(id: string, form: FormData) {
  await submit("tags", "PUT", `/${encodeURIComponent(id)}`, fields(form, false, true));
}
export async function archiveTagAction(form: FormData) {
  await submit("tags", "PATCH", `/${encodeURIComponent(String(form.get("id")))}/archive`);
}
