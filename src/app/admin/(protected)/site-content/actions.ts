"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { assertAdminRole } from "@/lib/auth";
import { revalidatePublicHomepage, revalidatePublicSettings } from "@/lib/cache-invalidation";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  homepageContentSchema,
  homepageFeatureSchema,
  type HomepageContent,
  type HomepageFeature,
} from "@/lib/homepage-content-definitions";
import type {
  FooterContent,
  ContactContent,
  AboutContent,
} from "@/lib/site-content";

export type ContentActionState = {
  success?: boolean;
  error?: string;
  message?: string;
  requestId?: string;
};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertSetting(key: string, value: object) {
  await prisma.siteSetting.upsert({
    where:  { key },
    update: { value },
    create: { key, value },
  });
}

function failure(error: unknown, fallback: string): ContentActionState {
  if (error instanceof ZodError) {
    return {
      error: error.issues[0]?.message ?? fallback,
      requestId: crypto.randomUUID(),
    };
  }
  return { error: fallback, requestId: crypto.randomUUID() };
}

async function readHomepageContent(): Promise<HomepageContent> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "site_content.homepage" },
    });
    const value = row?.value as Partial<HomepageContent> | null;
    return {
      heroEyebrow: String(value?.heroEyebrow ?? DEFAULT_HOMEPAGE_CONTENT.heroEyebrow).trim(),
      heroSubtitle: String(value?.heroSubtitle ?? DEFAULT_HOMEPAGE_CONTENT.heroSubtitle).trim(),
      heroMeta: String(value?.heroMeta ?? DEFAULT_HOMEPAGE_CONTENT.heroMeta).trim(),
      features: Array.isArray(value?.features) && value.features.length
        ? (value.features as HomepageFeature[])
        : DEFAULT_HOMEPAGE_CONTENT.features,
    };
  } catch {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
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

// ─── Homepage content ───────────────────────────────────────────────────────

function homepageContentFrom(formData: FormData) {
  return {
    heroEyebrow: String(formData.get("heroEyebrow") ?? ""),
    heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
    heroMeta: String(formData.get("heroMeta") ?? ""),
  };
}

function homepageFeaturesFrom(formData: FormData) {
  const count = Number(formData.get("featureCount") ?? 0);
  return Array.from({ length: count }, (_, index) => ({
    id: String(formData.get(`featureId_${index}`) ?? "").trim(),
    label: String(formData.get(`featureLabel_${index}`) ?? "").trim(),
    iconKey: String(formData.get(`featureIcon_${index}`) ?? "").trim(),
    enabled: formData.get(`featureEnabled_${index}`) === "on",
    sortOrder: Number(formData.get(`featureSortOrder_${index}`) ?? index + 1),
  }));
}

export async function updateHomepageContentAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  try {
    await assertAdminRole(["super_admin", "admin"]);

    const values = homepageContentSchema.parse(homepageContentFrom(formData));
    const current = await readHomepageContent();

    await upsertSetting("site_content.homepage", {
      ...current,
      ...values,
    });

    revalidatePublicHomepage();
    revalidatePath("/admin/homepage");

    return {
      success: true,
      message: "Homepage hero content saved.",
      requestId: crypto.randomUUID(),
    };
  } catch (error) {
    return failure(error, "Unable to save homepage hero content.");
  }
}

export async function updateHomepageFeaturesAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  try {
    await assertAdminRole(["super_admin", "admin"]);

    const current = await readHomepageContent();
    const rawFeatures = homepageFeaturesFrom(formData);
    const features = rawFeatures.map((feature) => {
      const parsed = homepageFeatureSchema.parse({
        ...feature,
        iconKey: feature.iconKey as HomepageFeature["iconKey"],
      });
      if (parsed.enabled && !parsed.label) {
        throw new ZodError([
          {
            code: "custom",
            path: ["label"],
            message: "Feature label is required when the feature is enabled.",
          },
        ]);
      }
      return parsed;
    });

    await upsertSetting("site_content.homepage", {
      ...current,
      features,
    });

    revalidatePublicHomepage();
    revalidatePath("/admin/homepage");

    return {
      success: true,
      message: "Homepage feature strip saved.",
      requestId: crypto.randomUUID(),
    };
  } catch (error) {
    return failure(error, "Unable to save homepage features.");
  }
}
