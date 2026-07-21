import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache-tags";
import { hasUsableDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { defaultContact } from "@/lib/constants";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  type HomepageContent,
  type HomepageFeature,
} from "@/lib/homepage-content-definitions";

// ─── Default values (match current hardcoded site content) ───────────────────

export const DEFAULT_FOOTER_CONTENT = {
  tagline: "Quality books, delivered to your doorstep.",
  description:
    "Original publications for readers, students, and lifelong learners across Bangladesh.",
  whatsappLabel: "Chat on WhatsApp",
  copyright: `© ${new Date().getFullYear()} Ayesha-Sharif Publication. All rights reserved.`,
  /** Footer "Info" column — editable policy link labels + hrefs */
  infoLinks: [
    { label: "Delivery Policy", href: "/delivery-policy" },
    { label: "Payment Policy", href: "/payment-policy" },
    { label: "Return Policy",   href: "/return-policy"   },
    { label: "Privacy Policy",  href: "/privacy-policy"  },
  ],
};

export const DEFAULT_CONTACT_CONTENT = {
  pageTitle: "Contact",
  pageSubtitle:
    "Reach out for book orders, wholesale questions, or publication updates.",
  phone: defaultContact.phone,
  whatsapp: defaultContact.whatsapp,
  email: defaultContact.email,
  facebookText: "Facebook page placeholder",
  address: defaultContact.address,
};

export const DEFAULT_ABOUT_CONTENT = {
  badge: "Small publishing house",
  title: "Ayesha-Sharif Publication",
  description:
    "Ayesha-Sharif Publication is a new Bangladeshi publishing company focused on simple, useful, and reader-friendly books. This website supports catalogue browsing, guest ordering, manual payment, and admin-managed delivery.",
};

export type FooterContent  = typeof DEFAULT_FOOTER_CONTENT;
export type ContactContent = typeof DEFAULT_CONTACT_CONTENT;
export type AboutContent   = typeof DEFAULT_ABOUT_CONTENT;
export type { HomepageContent, HomepageFeature } from "@/lib/homepage-content-definitions";

function normalizeHomepageFeature(feature: Partial<HomepageFeature>): HomepageFeature {
  return {
    id: String(feature.id ?? "").trim() || crypto.randomUUID(),
    label: String(feature.label ?? "").trim(),
    iconKey: feature.iconKey ?? DEFAULT_HOMEPAGE_CONTENT.features[0].iconKey,
    enabled: Boolean(feature.enabled ?? true),
    sortOrder: Number.isFinite(feature.sortOrder) ? Number(feature.sortOrder) : 0,
  };
}

function normalizeHomepageContent(value: unknown): HomepageContent {
  const source = (value && typeof value === "object" ? value : {}) as Partial<HomepageContent> & {
    features?: Array<Partial<HomepageFeature>>;
  };

  const features = Array.isArray(source.features)
    ? source.features.map((feature, index) =>
        normalizeHomepageFeature({
          ...feature,
          id: feature.id ?? DEFAULT_HOMEPAGE_CONTENT.features[index]?.id ?? crypto.randomUUID(),
          iconKey:
            feature.iconKey &&
            DEFAULT_HOMEPAGE_CONTENT.features.some((item) => item.iconKey === feature.iconKey)
              ? feature.iconKey
              : DEFAULT_HOMEPAGE_CONTENT.features[index % DEFAULT_HOMEPAGE_CONTENT.features.length].iconKey,
          enabled: feature.enabled ?? true,
          sortOrder: Number.isFinite(feature.sortOrder) ? Number(feature.sortOrder) : index + 1,
        }),
      )
    : DEFAULT_HOMEPAGE_CONTENT.features;

  return {
    heroEyebrow: String(source.heroEyebrow ?? DEFAULT_HOMEPAGE_CONTENT.heroEyebrow).trim(),
    heroSubtitle: String(source.heroSubtitle ?? DEFAULT_HOMEPAGE_CONTENT.heroSubtitle).trim(),
    heroMeta: String(source.heroMeta ?? DEFAULT_HOMEPAGE_CONTENT.heroMeta).trim(),
    features: features.length ? features : DEFAULT_HOMEPAGE_CONTENT.features,
  };
}

// ─── Internal DB reader ───────────────────────────────────────────────────────

async function readSetting<T extends object>(key: string, defaults: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row) return defaults;
    return { ...defaults, ...(row.value as Partial<T>) };
  } catch {
    return defaults;
  }
}

async function readHomepageSetting(): Promise<HomepageContent> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "site_content.homepage" },
    });
    if (!row) return DEFAULT_HOMEPAGE_CONTENT;
    return normalizeHomepageContent(row.value);
  } catch {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

// ─── Cached public readers ────────────────────────────────────────────────────

const cacheOpts: { revalidate: number; tags: string[] } = {
  revalidate: CACHE_REVALIDATE_SECONDS.settings,
  tags: [CACHE_TAGS.settings],
};

const cachedFooter = unstable_cache(
  () => readSetting("site_content.footer",  DEFAULT_FOOTER_CONTENT),
  ["site-content-footer"],
  cacheOpts,
);

const cachedContact = unstable_cache(
  () => readSetting("site_content.contact", DEFAULT_CONTACT_CONTENT),
  ["site-content-contact"],
  cacheOpts,
);

const cachedAbout = unstable_cache(
  () => readSetting("site_content.about",   DEFAULT_ABOUT_CONTENT),
  ["site-content-about"],
  cacheOpts,
);

const cachedHomepage = unstable_cache(
  readHomepageSetting,
  ["site-content-homepage"],
  {
    revalidate: CACHE_REVALIDATE_SECONDS.homepage,
    tags: [CACHE_TAGS.homepage],
  },
);

export async function getFooterContent(): Promise<FooterContent> {
  if (!hasUsableDatabaseUrl()) return DEFAULT_FOOTER_CONTENT;
  return cachedFooter();
}

export async function getContactContent(): Promise<ContactContent> {
  if (!hasUsableDatabaseUrl()) return DEFAULT_CONTACT_CONTENT;
  return cachedContact();
}

export async function getAboutContent(): Promise<AboutContent> {
  if (!hasUsableDatabaseUrl()) return DEFAULT_ABOUT_CONTENT;
  return cachedAbout();
}

export async function getHomepageContent(): Promise<HomepageContent> {
  if (!hasUsableDatabaseUrl()) return DEFAULT_HOMEPAGE_CONTENT;
  return cachedHomepage();
}
