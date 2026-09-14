import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const policies = [
  { slug: "delivery-policy", title: "Delivery Policy", content: "This delivery policy is placeholder content and should be reviewed before launch.\n\nInside Dhaka delivery charge is ৳70. Outside Dhaka delivery charge is ৳120.\n\nInside Chattogram delivery charge is ৳60. Outside Chattogram delivery charge is ৳120.\n\nCourier and tracking details are provided after dispatch when available." },
  { slug: "payment-policy", title: "Payment Policy", content: "This payment policy is placeholder content and should be reviewed before launch.\n\nCustomers may choose Cash on Delivery, manual bKash, manual Nagad, or manual Rocket where available.\n\nManual mobile payments require a transaction ID and remain pending until verified by an administrator." },
  { slug: "return-policy", title: "Return Policy", content: "This return policy is placeholder content and should be reviewed before launch.\n\nReturns may be accepted for damaged, incorrect, or missing books when reported promptly after delivery.\n\nPlease keep the invoice or order number when contacting support. Refunds, replacements, and return delivery arrangements are handled by the publication team." },
  { slug: "privacy-policy", title: "Privacy Policy", content: "This privacy policy is placeholder content and should be legally reviewed before launch.\n\nWe use account, order, delivery, and payment-reference information to provide the services requested by customers. Passwords are stored as secure hashes.\n\nOptional personalization may use book interactions such as views, cart activity, sample opens, and purchases. Customers can change their preferences or contact the publication team to request correction or deletion of account data.\n\nWe do not expose draft policy content to public visitors." },
] as const;

@Injectable()
export class PublicPoliciesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list() {
    const results = await Promise.all(
      policies.map(async (policy) => {
        try {
          return await this.bySlug(policy.slug);
        } catch (error) {
          if (error instanceof NotFoundException) return null;
          throw error;
        }
      }),
    );
    return results.filter((policy): policy is NonNullable<typeof policy> => policy !== null);
  }

  async bySlug(slug: string) {
    const fallback = policies.find((policy) => policy.slug === slug);
    if (!fallback) throw new NotFoundException("Policy not found.");
    const policy = await this.prisma.client.policy.findUnique({
      where: { slug }, select: { slug: true, title: true, publishedTitle: true, publishedContent: true, publishedAt: true, updatedAt: true },
    });
    if (!policy) return { ...fallback, publishedAt: new Date(0).toISOString() };
    if (!policy.publishedContent || !policy.publishedAt) throw new NotFoundException("Policy not found.");
    return {
      slug: policy.slug, title: policy.publishedTitle ?? policy.title, content: policy.publishedContent,
      publishedAt: (policy.publishedAt ?? policy.updatedAt).toISOString(),
    };
  }
}
