import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache-tags";
import { fetchPublicApi } from "@/lib/public-api";
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

type PublicSiteContent = {
  footer?: Partial<FooterContent>;
  contact?: Partial<ContactContent>;
  about?: Partial<AboutContent>;
  homepage?: Partial<HomepageContent>;
};

async function querySiteContent() {
  try {
    const content = await fetchPublicApi<PublicSiteContent>("/content/site");
    return {
      footer: { ...DEFAULT_FOOTER_CONTENT, ...content.footer },
      contact: { ...DEFAULT_CONTACT_CONTENT, ...content.contact },
      about: { ...DEFAULT_ABOUT_CONTENT, ...content.about },
      homepage: normalizeHomepageContent(content.homepage),
    };
  } catch {
    return {
      footer: DEFAULT_FOOTER_CONTENT,
      contact: DEFAULT_CONTACT_CONTENT,
      about: DEFAULT_ABOUT_CONTENT,
      homepage: DEFAULT_HOMEPAGE_CONTENT,
    };
  }
}

const cachedSiteContent = unstable_cache(querySiteContent, ["public-site-content"], {
  revalidate: CACHE_REVALIDATE_SECONDS.settings,
  tags: [CACHE_TAGS.settings, CACHE_TAGS.homepage],
});

export async function getFooterContent(): Promise<FooterContent> {
  return (await cachedSiteContent()).footer;
}

export async function getContactContent(): Promise<ContactContent> {
  return (await cachedSiteContent()).contact;
}

export async function getAboutContent(): Promise<AboutContent> {
  return (await cachedSiteContent()).about;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return (await cachedSiteContent()).homepage;
}
