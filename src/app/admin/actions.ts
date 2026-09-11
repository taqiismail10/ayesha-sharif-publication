"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  revalidatePublicCatalogue,
  revalidatePublicSettings
} from "@/lib/cache-invalidation";
import { deliveryAreas } from "@/lib/constants";
import { adminApi, assertAdminRole } from "@/lib/auth";
import {
  bookFormSchema,
  categoryFormSchema,
  tagFormSchema
} from "@/lib/validators";
import { slugify } from "@/lib/format";

export type ActionState = {
  error?: string;
};

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function nullableString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function galleryFrom(value?: string) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function bookApiInput(input: ReturnType<typeof parseBookForm>) {
  const { tagIds = [], galleryImages, ...book } = input;
  return { ...book, tagIds, galleryImages: galleryFrom(galleryImages) };
}

function parseBookForm(formData: FormData) {
  return bookFormSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug") || slugify(String(formData.get("title") || "")),
    subtitle: formData.get("subtitle"),
    author: formData.get("author"),
    publisher: formData.get("publisher") || "Ayesha-Sharif Publication",
    isbn13: formData.get("isbn13"),
    edition: formData.get("edition"),
    language: formData.get("language") || "Bangla",
    pages: formData.get("pages") || undefined,
    binding: formData.get("binding"),
    publicationDate: formData.get("publicationDate"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    regularPrice: formData.get("regularPrice"),
    salePrice: formData.get("salePrice"),
    discountPercent: formData.get("discountPercent") || 0,
    discountStart: formData.get("discountStart"),
    discountEnd: formData.get("discountEnd"),
    stockQuantity: formData.get("stockQuantity"),
    status: formData.get("status"),
    coverImage: formData.get("coverImage"),
    galleryImages: formData.get("galleryImages"),
    samplePdf: formData.get("samplePdf"),
    weight: formData.get("weight") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    tagIds: formData.getAll("tagIds").map(String),
    isFeatured: formBoolean(formData, "isFeatured"),
    isBestSeller: formBoolean(formData, "isBestSeller"),
    isNewArrival: formBoolean(formData, "isNewArrival"),
    isRecommended: formBoolean(formData, "isRecommended")
  });
}

export async function createBookAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const input = parseBookForm(formData);
  const response = await adminApi("/admin/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookApiInput(input)),
  });
  if (!response.ok) throw new Error("Could not create the book.");
  const created = (await response.json()) as { id: string; slug: string };

  revalidatePath("/admin/books");
  revalidatePublicCatalogue([created.slug]);
  redirect(`/admin/books/${created.id}/edit`);
}

export async function updateBookAction(bookId: string, formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const input = parseBookForm(formData);
  const response = await adminApi(`/admin/books/${encodeURIComponent(bookId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookApiInput(input)),
  });
  if (!response.ok) throw new Error("Could not update the book.");
  const updated = (await response.json()) as { slug: string };

  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}/edit`);
  revalidatePublicCatalogue([updated.slug]);
  redirect("/admin/books");
}

export async function archiveBookAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const id = String(formData.get("id"));
  const response = await adminApi(`/admin/books/${encodeURIComponent(id)}/archive`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archived: true }),
  });
  if (!response.ok) throw new Error("Could not archive the book.");
  revalidatePath("/admin/books");
  revalidatePublicCatalogue();
}

export async function deleteBookAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin"]);
  const id = String(formData.get("id"));
  const book = await prisma.book.findUnique({
    where: { id },
    select: { slug: true }
  });
  const orderItemCount = await prisma.orderItem.count({ where: { bookId: id } });
  if (orderItemCount > 0) {
    throw new Error("This book has orders and cannot be deleted.");
  }
  await prisma.book.delete({ where: { id } });
  revalidatePath("/admin/books");
  revalidatePublicCatalogue([book?.slug]);
}

export async function createCategoryAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const input = categoryFormSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") || "")),
    description: formData.get("description"),
    isActive: true
  });

  await prisma.category.create({ data: input });
  revalidatePath("/admin/categories");
  revalidatePublicCatalogue();
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const input = categoryFormSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    isActive: formBoolean(formData, "isActive")
  });
  await prisma.category.update({ where: { id }, data: input });
  revalidatePath("/admin/categories");
  revalidatePublicCatalogue();
}

export async function archiveCategoryAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  await prisma.category.update({
    where: { id: String(formData.get("id")) },
    data: { isActive: false }
  });
  revalidatePath("/admin/categories");
  revalidatePublicCatalogue();
}

export async function createTagAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const input = tagFormSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") || "")),
    isActive: true
  });
  await prisma.tag.create({ data: input });
  revalidatePath("/admin/tags");
  revalidatePublicCatalogue();
}

export async function updateTagAction(id: string, formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const input = tagFormSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    isActive: formBoolean(formData, "isActive")
  });
  await prisma.tag.update({ where: { id }, data: input });
  revalidatePath("/admin/tags");
  revalidatePublicCatalogue();
}

export async function archiveTagAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  await prisma.tag.update({
    where: { id: String(formData.get("id")) },
    data: { isActive: false }
  });
  revalidatePath("/admin/tags");
  revalidatePublicCatalogue();
}

export async function updateOrderAction(orderId: string, formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "order_manager"]);
  const orderStatus = String(formData.get("orderStatus"));
  const paymentStatus = String(formData.get("paymentStatus"));
  const courierName = nullableString(String(formData.get("courierName") || ""));
  const trackingNumber = nullableString(String(formData.get("trackingNumber") || ""));
  const adminNote = nullableString(String(formData.get("adminNote") || ""));
  const response = await adminApi(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderStatus, paymentStatus, courierName, trackingNumber, adminNote }),
  });
  if (!response.ok) throw new Error("Could not update the order.");

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePublicCatalogue();
}

export async function updateDeliverySettingsAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin"]);
  const value = Object.fromEntries(
    deliveryAreas.map((area) => [
      area.value,
      Math.max(0, Number(formData.get(area.value) || area.charge))
    ])
  );

  await prisma.siteSetting.upsert({
    where: { key: "delivery_charges" },
    update: { value },
    create: { key: "delivery_charges", value }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePublicSettings();
}
