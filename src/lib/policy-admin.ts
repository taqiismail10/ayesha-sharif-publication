import "server-only";

import type { Admin } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  policyDraftSchema,
  policyPublishSchema,
  type PolicySlug,
} from "@/lib/policy-definitions";

export const POLICY_ADMIN_ROLES = ["super_admin", "admin"] as const;

export function canManagePolicies(admin: Pick<Admin, "role">) {
  return POLICY_ADMIN_ROLES.some((role) => role === admin.role);
}

export async function savePolicyDraft(
  input: { slug: PolicySlug; title: string; content: string },
  adminId: string,
) {
  const values = policyDraftSchema.parse(input);
  return prisma.policy.upsert({
    where: { slug: values.slug },
    update: {
      title: values.title,
      content: values.content,
      status: "draft",
      updatedById: adminId,
    },
    create: {
      ...values,
      status: "draft",
      updatedById: adminId,
    },
  });
}

export async function publishPolicy(
  input: { slug: PolicySlug; title: string; content: string },
  adminId: string,
) {
  const values = policyPublishSchema.parse(input);
  const publishedAt = new Date();
  return prisma.policy.upsert({
    where: { slug: values.slug },
    update: {
      title: values.title,
      publishedTitle: values.title,
      content: values.content,
      publishedContent: values.content,
      status: "published",
      publishedAt,
      updatedById: adminId,
    },
    create: {
      ...values,
      publishedTitle: values.title,
      publishedContent: values.content,
      status: "published",
      publishedAt,
      updatedById: adminId,
    },
  });
}
