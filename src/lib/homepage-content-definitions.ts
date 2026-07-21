import {
  BookCheck,
  BookOpen,
  HandCoins,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { z } from "zod";

export const HOMEPAGE_ICON_KEYS = [
  "book-open",
  "hand-coins",
  "rotate-ccw",
  "truck",
  "shield-check",
  "package-check",
  "book-check",
] as const;

export const HOMEPAGE_ICON_OPTIONS = [
  { key: "book-open", label: "Book Open", icon: BookOpen },
  { key: "hand-coins", label: "Hand Coins", icon: HandCoins },
  { key: "rotate-ccw", label: "Easy Returns", icon: RotateCcw },
  { key: "truck", label: "Truck", icon: Truck },
  { key: "shield-check", label: "Shield Check", icon: ShieldCheck },
  { key: "package-check", label: "Package Check", icon: PackageCheck },
  { key: "book-check", label: "Book Check", icon: BookCheck },
] as const;

export type HomepageIconKey = (typeof HOMEPAGE_ICON_OPTIONS)[number]["key"];

export type HomepageFeature = {
  id: string;
  label: string;
  iconKey: HomepageIconKey;
  enabled: boolean;
  sortOrder: number;
};

export type HomepageContent = {
  heroEyebrow: string;
  heroSubtitle: string;
  heroMeta: string;
  features: HomepageFeature[];
};

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroEyebrow: "EST. — BANGLADESHI LITERARY PRESS",
  heroSubtitle: "Quality books, delivered to your doorstep.",
  heroMeta: "400+ books · Free delivery above ৳500",
  features: [
    {
      id: "homepage-feature-1",
      label: "400+ Books",
      iconKey: "book-open",
      enabled: true,
      sortOrder: 1,
    },
    {
      id: "homepage-feature-2",
      label: "Cash on Delivery",
      iconKey: "hand-coins",
      enabled: true,
      sortOrder: 2,
    },
    {
      id: "homepage-feature-3",
      label: "Easy Returns",
      iconKey: "rotate-ccw",
      enabled: true,
      sortOrder: 3,
    },
    {
      id: "homepage-feature-4",
      label: "Nationwide Shipping",
      iconKey: "truck",
      enabled: true,
      sortOrder: 4,
    },
  ],
};

export const homepageIconKeySchema = z.enum(HOMEPAGE_ICON_KEYS);

export const homepageContentSchema = z.object({
  heroEyebrow: z.string().trim().max(80).optional().default(""),
  heroSubtitle: z.string().trim().min(1).max(120),
  heroMeta: z.string().trim().max(100).optional().default(""),
});

export const homepageFeatureSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().max(80).optional().default(""),
  iconKey: homepageIconKeySchema,
  enabled: z.boolean(),
  sortOrder: z.number().int(),
});
