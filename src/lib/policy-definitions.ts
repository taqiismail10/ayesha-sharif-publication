import { z } from "zod";

export const POLICY_SLUGS = [
  "delivery-policy",
  "payment-policy",
  "return-policy",
  "privacy-policy",
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const DEFAULT_POLICIES: ReadonlyArray<{
  slug: PolicySlug;
  title: string;
  content: string;
}> = [
  {
    slug: "delivery-policy",
    title: "Delivery Policy",
    content:
      "This delivery policy is placeholder content and should be reviewed before launch.\n\nInside Dhaka delivery charge is ৳70. Outside Dhaka delivery charge is ৳120.\n\nInside Chattogram delivery charge is ৳60. Outside Chattogram delivery charge is ৳120.\n\nCourier and tracking details are provided after dispatch when available.",
  },
  {
    slug: "payment-policy",
    title: "Payment Policy",
    content:
      "This payment policy is placeholder content and should be reviewed before launch.\n\nCustomers may choose Cash on Delivery, manual bKash, manual Nagad, or manual Rocket where available.\n\nManual mobile payments require a transaction ID and remain pending until verified by an administrator.",
  },
  {
    slug: "return-policy",
    title: "Return Policy",
    content:
      "This return policy is placeholder content and should be reviewed before launch.\n\nReturns may be accepted for damaged, incorrect, or missing books when reported promptly after delivery.\n\nPlease keep the invoice or order number when contacting support. Refunds, replacements, and return delivery arrangements are handled by the publication team.",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content:
      "This privacy policy is placeholder content and should be legally reviewed before launch.\n\nWe use account, order, delivery, and payment-reference information to provide the services requested by customers. Passwords are stored as secure hashes.\n\nOptional personalization may use book interactions such as views, cart activity, sample opens, and purchases. Customers can change their preferences or contact the publication team to request correction or deletion of account data.\n\nWe do not expose draft policy content to public visitors.",
  },
];

const defaultsBySlug = new Map(DEFAULT_POLICIES.map((policy) => [policy.slug, policy]));

export const policySlugSchema = z.enum(POLICY_SLUGS);

export const policyDraftSchema = z.object({
  slug: policySlugSchema,
  title: z.string().trim().min(1, "Title is required.").max(160, "Title is too long."),
  content: z.string().max(100_000, "Policy content is too long."),
});

export const policyPublishSchema = policyDraftSchema.extend({
  content: z.string().trim().min(1, "Content is required before publishing.").max(100_000),
});

export function isPolicySlug(value: string): value is PolicySlug {
  return policySlugSchema.safeParse(value).success;
}

export function getDefaultPolicy(slug: PolicySlug) {
  return defaultsBySlug.get(slug)!;
}
