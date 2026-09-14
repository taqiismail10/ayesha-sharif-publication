import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";

const SETTING_KEYS = ["delivery_charges", "site_content.footer", "site_content.contact", "site_content.about", "site_content.homepage"] as const;
const POLICY_SLUGS = ["delivery-policy", "payment-policy", "return-policy", "privacy-policy"] as const;
const HOMEPAGE_ICON_KEYS = ["book-open", "hand-coins", "rotate-ccw", "truck", "shield-check", "package-check", "book-check"] as const;

const DEFAULT_POLICIES = [
  { slug: "delivery-policy", title: "Delivery Policy", content: "This delivery policy is placeholder content and should be reviewed before launch.\n\nInside Dhaka delivery charge is ৳70. Outside Dhaka delivery charge is ৳120.\n\nInside Chattogram delivery charge is ৳60. Outside Chattogram delivery charge is ৳120.\n\nCourier and tracking details are provided after dispatch when available." },
  { slug: "payment-policy", title: "Payment Policy", content: "This payment policy is placeholder content and should be reviewed before launch.\n\nCustomers may choose Cash on Delivery, manual bKash, manual Nagad, or manual Rocket where available.\n\nManual mobile payments require a transaction ID and remain pending until verified by an administrator." },
  { slug: "return-policy", title: "Return Policy", content: "This return policy is placeholder content and should be reviewed before launch.\n\nReturns may be accepted for damaged, incorrect, or missing books when reported promptly after delivery.\n\nPlease keep the invoice or order number when contacting support. Refunds, replacements, and return delivery arrangements are handled by the publication team." },
  { slug: "privacy-policy", title: "Privacy Policy", content: "This privacy policy is placeholder content and should be legally reviewed before launch.\n\nWe use account, order, delivery, and payment-reference information to provide the services requested by customers. Passwords are stored as secure hashes.\n\nOptional personalization may use book interactions such as views, cart activity, sample opens, and purchases. Customers can change their preferences or contact the publication team to request correction or deletion of account data.\n\nWe do not expose draft policy content to public visitors." },
] as const;

export const settingKeySchema = z.enum(SETTING_KEYS);
export const policySlugSchema = z.enum(POLICY_SLUGS);

const deliverySchema = z
  .object({
    inside_dhaka: z.coerce.number().min(0),
    outside_dhaka: z.coerce.number().min(0),
    inside_chattogram: z.coerce.number().min(0),
    outside_chattogram: z.coerce.number().min(0),
    other: z.coerce.number().min(0),
  })
  .strict();
const footerSchema = z.object({ tagline: z.string().trim().min(1), description: z.string(), whatsappLabel: z.string(), copyright: z.string(), infoLinks: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) }).strict()).max(4) }).strict();
const contactSchema = z.object({ pageTitle: z.string().trim().min(1), pageSubtitle: z.string(), phone: z.string(), whatsapp: z.string(), email: z.string(), facebookText: z.string(), address: z.string() }).strict();
const aboutSchema = z.object({ badge: z.string(), title: z.string().trim().min(1), description: z.string() }).strict();
const homepageSchema = z.object({ heroEyebrow: z.string().trim().max(80), heroSubtitle: z.string().trim().min(1).max(120), heroMeta: z.string().trim().max(100), features: z.array(z.object({ id: z.string().trim().min(1), label: z.string().trim().max(80), iconKey: z.enum(HOMEPAGE_ICON_KEYS), enabled: z.boolean(), sortOrder: z.number().int() }).strict()) }).strict();
const policyDraftSchema = z.object({ title: z.string().trim().min(1, "Title is required.").max(160, "Title is too long."), content: z.string().max(100_000, "Policy content is too long.") }).strict();
const policyPublishSchema = policyDraftSchema.extend({ content: z.string().trim().min(1, "Content is required before publishing.").max(100_000) });

@Injectable()
export class AdminContentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSetting(key: string) {
    const parsed = settingKeySchema.safeParse(key);
    if (!parsed.success) throw new NotFoundException("Setting not found.");
    return this.prisma.client.siteSetting.findUnique({ where: { key: parsed.data } });
  }

  async putSetting(key: string, value: unknown) {
    const parsedKey = settingKeySchema.safeParse(key);
    if (!parsedKey.success) throw new NotFoundException("Setting not found.");
    const schemas: Record<(typeof SETTING_KEYS)[number], z.ZodType> = { delivery_charges: deliverySchema, "site_content.footer": footerSchema, "site_content.contact": contactSchema, "site_content.about": aboutSchema, "site_content.homepage": homepageSchema };
    const parsed = schemas[parsedKey.data].safeParse(value);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message ?? "Invalid setting value.");
    return this.prisma.client.siteSetting.upsert({ where: { key: parsedKey.data }, update: { value: parsed.data }, create: { key: parsedKey.data, value: parsed.data } });
  }

  private async ensureDefaultPolicies() {
    const publishedAt = new Date();
    await Promise.all(DEFAULT_POLICIES.map((policy) => this.prisma.client.policy.upsert({ where: { slug: policy.slug }, update: {}, create: { ...policy, publishedTitle: policy.title, publishedContent: policy.content, status: "published", publishedAt } })));
  }

  async listPolicies() {
    await this.ensureDefaultPolicies();
    const policies = await this.prisma.client.policy.findMany({ where: { slug: { in: [...POLICY_SLUGS] } }, include: { updatedBy: { select: { name: true, email: true } } } });
    const bySlug = new Map(policies.map((policy) => [policy.slug, policy]));
    return POLICY_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean);
  }

  async getPolicy(slug: string) {
    const parsed = policySlugSchema.safeParse(slug);
    if (!parsed.success) throw new NotFoundException("Policy not found.");
    await this.ensureDefaultPolicies();
    return this.prisma.client.policy.findUnique({ where: { slug: parsed.data }, include: { updatedBy: { select: { name: true, email: true } } } });
  }

  async saveDraft(slug: string, value: unknown, adminId: string) {
    const parsedSlug = policySlugSchema.safeParse(slug);
    if (!parsedSlug.success) throw new NotFoundException("Policy not found.");
    const parsedValue = policyDraftSchema.safeParse(value);
    if (!parsedValue.success) throw new BadRequestException(parsedValue.error.issues[0]?.message ?? "Invalid policy.");
    return this.prisma.client.policy.upsert({ where: { slug: parsedSlug.data }, update: { ...parsedValue.data, status: "draft", updatedById: adminId }, create: { slug: parsedSlug.data, ...parsedValue.data, status: "draft", updatedById: adminId } });
  }

  async publish(slug: string, value: unknown, adminId: string) {
    const parsedSlug = policySlugSchema.safeParse(slug);
    if (!parsedSlug.success) throw new NotFoundException("Policy not found.");
    const parsedValue = policyPublishSchema.safeParse(value);
    if (!parsedValue.success) throw new BadRequestException(parsedValue.error.issues[0]?.message ?? "Invalid policy.");
    const publishedAt = new Date();
    return this.prisma.client.policy.upsert({ where: { slug: parsedSlug.data }, update: { ...parsedValue.data, publishedTitle: parsedValue.data.title, publishedContent: parsedValue.data.content, status: "published", publishedAt, updatedById: adminId }, create: { slug: parsedSlug.data, ...parsedValue.data, publishedTitle: parsedValue.data.title, publishedContent: parsedValue.data.content, status: "published", publishedAt, updatedById: adminId } });
  }
}
