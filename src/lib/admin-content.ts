import "server-only";

import { adminApi } from "@/lib/auth";
import { deliveryAreas, type DeliveryAreaOption } from "@/lib/constants";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  type HomepageContent,
} from "@/lib/homepage-content-definitions";
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_FOOTER_CONTENT,
  type AboutContent,
  type ContactContent,
  type FooterContent,
} from "@/lib/site-content";
import type { PolicySlug } from "@/lib/policy-definitions";

type SettingResponse = { value?: unknown } | null;

export type AdminPolicy = {
  id: string;
  slug: PolicySlug;
  title: string;
  content: string;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
  updatedBy: { name: string; email: string } | null;
};

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const response = await adminApi(`/admin/settings/${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Unable to load ${key}.`);
  const row = (await response.json()) as SettingResponse;
  return row?.value ? { ...fallback, ...(row.value as Partial<T>) } : fallback;
}

export function getAdminDeliveryOptions() {
  return readSetting("delivery_charges", Object.fromEntries(deliveryAreas.map((area) => [area.value, area.charge]))).then(
    (charges) => deliveryAreas.map((area) => ({ ...area, charge: Number(charges[area.value] ?? area.charge) })) as DeliveryAreaOption[],
  );
}

export function getAdminFooterContent() {
  return readSetting<FooterContent>("site_content.footer", DEFAULT_FOOTER_CONTENT);
}

export function getAdminContactContent() {
  return readSetting<ContactContent>("site_content.contact", DEFAULT_CONTACT_CONTENT);
}

export function getAdminAboutContent() {
  return readSetting<AboutContent>("site_content.about", DEFAULT_ABOUT_CONTENT);
}

export function getAdminHomepageContent() {
  return readSetting<HomepageContent>("site_content.homepage", DEFAULT_HOMEPAGE_CONTENT);
}

function toAdminPolicy(value: Omit<AdminPolicy, "publishedAt" | "updatedAt"> & { publishedAt: string | Date | null; updatedAt: string | Date }): AdminPolicy {
  return {
    ...value,
    publishedAt: value.publishedAt ? new Date(value.publishedAt).toISOString() : null,
    updatedAt: new Date(value.updatedAt).toISOString(),
  };
}

export async function getAdminPolicies(): Promise<AdminPolicy[]> {
  const response = await adminApi("/admin/policies");
  if (!response.ok) throw new Error("Unable to load policies.");
  return ((await response.json()) as Array<Omit<AdminPolicy, "publishedAt" | "updatedAt"> & { publishedAt: string | Date | null; updatedAt: string | Date }>).map(toAdminPolicy);
}

export async function getAdminPolicy(slug: PolicySlug): Promise<AdminPolicy | null> {
  const response = await adminApi(`/admin/policies/${slug}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load policy.");
  return toAdminPolicy((await response.json()) as Omit<AdminPolicy, "publishedAt" | "updatedAt"> & { publishedAt: string | Date | null; updatedAt: string | Date });
}
