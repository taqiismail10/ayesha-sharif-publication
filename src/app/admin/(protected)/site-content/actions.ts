"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePublicSettings } from "@/lib/cache-invalidation";
import type {
  FooterContent,
  ContactContent,
  AboutContent,
} from "@/lib/site-content";

export type ContentActionState = {
  success?: boolean;
  error?: string;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertSetting(key: string, value: object) {
  await prisma.siteSetting.upsert({
    where:  { key },
    update: { value },
    create: { key, value },
  });
}

// ─── Footer content ───────────────────────────────────────────────────────────

export async function updateFooterContentAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  try {
    await assertAdminRole(["super_admin", "admin"]);

    // Parse the four editable info/policy link rows
    const infoLinks = [0, 1, 2, 3].map((i) => ({
      label: String(formData.get(`infoLabel_${i}`) ?? "").trim(),
      href:  String(formData.get(`infoHref_${i}`)  ?? "").trim(),
    })).filter((l) => l.label && l.href);

    const value: FooterContent = {
      tagline:      String(formData.get("tagline")      ?? "").trim(),
      description:  String(formData.get("description")  ?? "").trim(),
      whatsappLabel:String(formData.get("whatsappLabel") ?? "").trim(),
      copyright:    String(formData.get("copyright")    ?? "").trim(),
      infoLinks,
    };

    if (!value.tagline) return { error: "Tagline is required." };

    await upsertSetting("site_content.footer", value);
    revalidatePublicSettings();
    revalidatePath("/admin/site-content");

    return { success: true };
  } catch {
    return { error: "Failed to save footer content." };
  }
}

// ─── Contact content ──────────────────────────────────────────────────────────

export async function updateContactContentAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  try {
    await assertAdminRole(["super_admin", "admin"]);

    const value: ContactContent = {
      pageTitle:    String(formData.get("pageTitle")    ?? "").trim(),
      pageSubtitle: String(formData.get("pageSubtitle") ?? "").trim(),
      phone:        String(formData.get("phone")        ?? "").trim(),
      whatsapp:     String(formData.get("whatsapp")     ?? "").trim(),
      email:        String(formData.get("email")        ?? "").trim(),
      facebookText: String(formData.get("facebookText") ?? "").trim(),
      address:      String(formData.get("address")      ?? "").trim(),
    };

    if (!value.pageTitle) return { error: "Page title is required." };

    await upsertSetting("site_content.contact", value);
    revalidatePublicSettings();
    revalidatePath("/admin/site-content");

    return { success: true };
  } catch {
    return { error: "Failed to save contact content." };
  }
}

// ─── About content ────────────────────────────────────────────────────────────

export async function updateAboutContentAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  try {
    await assertAdminRole(["super_admin", "admin"]);

    const value: AboutContent = {
      badge:       String(formData.get("badge")       ?? "").trim(),
      title:       String(formData.get("title")       ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
    };

    if (!value.title) return { error: "Title is required." };

    await upsertSetting("site_content.about", value);
    revalidatePublicSettings();
    revalidatePath("/admin/site-content");

    return { success: true };
  } catch {
    return { error: "Failed to save about content." };
  }
}
