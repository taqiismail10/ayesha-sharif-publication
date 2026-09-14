import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const deliveryAreas = [
  { value: "inside_dhaka", label: "Inside Dhaka", charge: 70 },
  { value: "outside_dhaka", label: "Outside Dhaka", charge: 120 },
  { value: "inside_chattogram", label: "Inside Chattogram", charge: 60 },
  { value: "outside_chattogram", label: "Outside Chattogram", charge: 120 },
  { value: "other", label: "Other districts", charge: 120 },
];

const defaults = {
  footer: {
    tagline: "Quality books, delivered to your doorstep.",
    description: "Original publications for readers, students, and lifelong learners across Bangladesh.",
    whatsappLabel: "Chat on WhatsApp",
    copyright: `© ${new Date().getFullYear()} Ayesha-Sharif Publication. All rights reserved.`,
    infoLinks: [
      { label: "Delivery Policy", href: "/delivery-policy" }, { label: "Payment Policy", href: "/payment-policy" },
      { label: "Return Policy", href: "/return-policy" }, { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
  contact: {
    pageTitle: "Contact", pageSubtitle: "Reach out for book orders, wholesale questions, or publication updates.",
    phone: "+8801XXXXXXXXX", whatsapp: "+8801XXXXXXXXX", email: "hello@ayeshasharif.com",
    facebookText: "Facebook page placeholder", address: "Office address, Dhaka, Bangladesh",
  },
  about: {
    badge: "Small publishing house", title: "Ayesha-Sharif Publication",
    description: "Ayesha-Sharif Publication is a new Bangladeshi publishing company focused on simple, useful, and reader-friendly books. This website supports catalogue browsing, guest ordering, manual payment, and admin-managed delivery.",
  },
  homepage: {
    heroEyebrow: "EST. — BANGLADESHI LITERARY PRESS", heroSubtitle: "Quality books, delivered to your doorstep.", heroMeta: "400+ books · Free delivery above ৳500",
    features: [
      { id: "homepage-feature-1", label: "400+ Books", iconKey: "book-open", enabled: true, sortOrder: 1 },
      { id: "homepage-feature-2", label: "Cash on Delivery", iconKey: "hand-coins", enabled: true, sortOrder: 2 },
      { id: "homepage-feature-3", label: "Easy Returns", iconKey: "rotate-ccw", enabled: true, sortOrder: 3 },
      { id: "homepage-feature-4", label: "Nationwide Shipping", iconKey: "truck", enabled: true, sortOrder: 4 },
    ],
  },
} as const;

type ContentKey = keyof typeof defaults;

@Injectable()
export class PublicContentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async setting<K extends ContentKey>(key: K) {
    const row = await this.prisma.client.siteSetting.findUnique({ where: { key: `site_content.${key}` } });
    return { ...defaults[key], ...((row?.value && typeof row.value === "object" ? row.value : {}) as Partial<(typeof defaults)[K]>) };
  }

  async site() {
    const [footer, contact, about, homepage] = await Promise.all([
      this.setting("footer"), this.setting("contact"), this.setting("about"), this.setting("homepage"),
    ]);
    return { footer, contact, about, homepage };
  }

  async delivery() {
    const row = await this.prisma.client.siteSetting.findUnique({ where: { key: "delivery_charges" } });
    const values = row?.value && typeof row.value === "object" ? row.value as Record<string, unknown> : {};
    return deliveryAreas.map((area) => ({ ...area, charge: Number(values[area.value] ?? area.charge) }));
  }
}
