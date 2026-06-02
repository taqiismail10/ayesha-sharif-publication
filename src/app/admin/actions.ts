"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BookStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  revalidatePublicCatalogue,
  revalidatePublicSettings
} from "@/lib/cache-invalidation";
import { deliveryAreas } from "@/lib/constants";
import {
  assertAdminRole,
  clearAdminSession,
  createAdminSession,
  verifyPassword
} from "@/lib/auth";
import {
  bookFormSchema,
  categoryFormSchema,
  loginSchema,
  tagFormSchema
} from "@/lib/validators";
import { slugify } from "@/lib/format";

export type ActionState = {
  error?: string;
};

export async function loginAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid login details." };
  }

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email }
  });

  if (!admin?.isActive) {
    return { error: "Invalid admin email or password." };
  }

  const validPassword = await verifyPassword(
    parsed.data.password,
    admin.passwordHash
  );

  if (!validPassword) {
    return { error: "Invalid admin email or password." };
  }

  await createAdminSession(admin);
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function dateOrNull(value?: string) {
  return value ? new Date(value) : null;
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
  const { tagIds = [], galleryImages, ...book } = input;

  const created = await prisma.book.create({
    data: {
      title: book.title,
      slug: book.slug,
      subtitle: nullableString(book.subtitle),
      author: book.author,
      publisher: book.publisher,
      isbn13: nullableString(book.isbn13),
      edition: nullableString(book.edition),
      language: book.language,
      pages: book.pages || null,
      binding: nullableString(book.binding),
      publicationDate: dateOrNull(book.publicationDate),
      shortDescription: nullableString(book.shortDescription),
      description: nullableString(book.description),
      regularPrice: book.regularPrice,
      salePrice: book.salePrice,
      discountPercent: book.discountPercent,
      discountStart: dateOrNull(book.discountStart),
      discountEnd: dateOrNull(book.discountEnd),
      stockQuantity: book.stockQuantity,
      status: book.status as BookStatus,
      coverImage: nullableString(book.coverImage),
      galleryImages: galleryFrom(galleryImages),
      samplePdf: nullableString(book.samplePdf),
      weight: book.weight || null,
      categoryId: nullableString(book.categoryId),
      isFeatured: !!book.isFeatured,
      isBestSeller: !!book.isBestSeller,
      isNewArrival: !!book.isNewArrival,
      isRecommended: !!book.isRecommended,
      tags: {
        create: tagIds.map((tagId) => ({ tagId }))
      }
    }
  });

  revalidatePath("/admin/books");
  revalidatePublicCatalogue([created.slug]);
  redirect(`/admin/books/${created.id}/edit`);
}

export async function updateBookAction(bookId: string, formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const input = parseBookForm(formData);
  const { tagIds = [], galleryImages, ...book } = input;
  const existing = await prisma.book.findUnique({
    where: { id: bookId },
    select: { slug: true }
  });

  const updated = await prisma.book.update({
    where: { id: bookId },
    data: {
      title: book.title,
      slug: book.slug,
      subtitle: nullableString(book.subtitle),
      author: book.author,
      publisher: book.publisher,
      isbn13: nullableString(book.isbn13),
      edition: nullableString(book.edition),
      language: book.language,
      pages: book.pages || null,
      binding: nullableString(book.binding),
      publicationDate: dateOrNull(book.publicationDate),
      shortDescription: nullableString(book.shortDescription),
      description: nullableString(book.description),
      regularPrice: book.regularPrice,
      salePrice: book.salePrice,
      discountPercent: book.discountPercent,
      discountStart: dateOrNull(book.discountStart),
      discountEnd: dateOrNull(book.discountEnd),
      stockQuantity: book.stockQuantity,
      status: book.status as BookStatus,
      coverImage: nullableString(book.coverImage),
      galleryImages: galleryFrom(galleryImages),
      samplePdf: nullableString(book.samplePdf),
      weight: book.weight || null,
      categoryId: nullableString(book.categoryId),
      isFeatured: !!book.isFeatured,
      isBestSeller: !!book.isBestSeller,
      isNewArrival: !!book.isNewArrival,
      isRecommended: !!book.isRecommended,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId }))
      }
    }
  });

  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}/edit`);
  revalidatePublicCatalogue([existing?.slug, updated.slug]);
  redirect("/admin/books");
}

export async function archiveBookAction(formData: FormData) {
  await assertAdminRole(["super_admin", "admin", "editor"]);
  const id = String(formData.get("id"));
  const archived = await prisma.book.update({
    where: { id },
    data: { status: "archived" },
    select: { slug: true }
  });
  revalidatePath("/admin/books");
  revalidatePublicCatalogue([archived.slug]);
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
  const orderStatus = String(formData.get("orderStatus")) as OrderStatus;
  const paymentStatus = String(formData.get("paymentStatus")) as PaymentStatus;
  const courierName = nullableString(String(formData.get("courierName") || ""));
  const trackingNumber = nullableString(String(formData.get("trackingNumber") || ""));
  const adminNote = nullableString(String(formData.get("adminNote") || ""));
  const affectedBookIds = new Set<string>();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    if (!order) throw new Error("Order not found.");

    let stockReduced = order.stockReduced;
    if (orderStatus === "confirmed" && !order.stockReduced) {
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        affectedBookIds.add(item.bookId);
      }
      stockReduced = true;
    }

    if (
      orderStatus === "cancelled" &&
      order.stockReduced &&
      order.orderStatus !== "delivered"
    ) {
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: { stockQuantity: { increment: item.quantity } }
        });
        affectedBookIds.add(item.bookId);
      }
      stockReduced = false;
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus,
        paymentStatus,
        courierName,
        trackingNumber,
        adminNote,
        stockReduced
      }
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  if (affectedBookIds.size) {
    const affectedBooks = await prisma.book.findMany({
      where: { id: { in: [...affectedBookIds] } },
      select: { slug: true }
    });
    revalidatePublicCatalogue(affectedBooks.map((book) => book.slug));
  }
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
