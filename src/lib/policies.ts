import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, policyCacheTag } from "@/lib/cache-tags";
import { hasUsableDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_POLICIES,
  POLICY_SLUGS,
  getDefaultPolicy,
  type PolicySlug,
} from "@/lib/policy-definitions";

export {
  DEFAULT_POLICIES,
  POLICY_SLUGS,
  getDefaultPolicy,
  isPolicySlug,
  policyDraftSchema,
  policyPublishSchema,
  policySlugSchema,
  type PolicySlug,
} from "@/lib/policy-definitions";

export async function ensureDefaultPolicies() {
  const publishedAt = new Date();
  await prisma.$transaction(
    DEFAULT_POLICIES.map((policy) =>
      prisma.policy.upsert({
        where: { slug: policy.slug },
        update: {},
        create: {
          ...policy,
          publishedTitle: policy.title,
          publishedContent: policy.content,
          status: "published",
          publishedAt,
        },
      }),
    ),
  );
}

export async function getAdminPolicies() {
  await ensureDefaultPolicies();
  const policies = await prisma.policy.findMany({
    where: { slug: { in: [...POLICY_SLUGS] } },
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  const bySlug = new Map(policies.map((policy) => [policy.slug, policy]));
  return POLICY_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (policy): policy is NonNullable<typeof policy> => Boolean(policy),
  );
}

export async function getAdminPolicy(slug: PolicySlug) {
  await ensureDefaultPolicies();
  return prisma.policy.findUnique({
    where: { slug },
    include: { updatedBy: { select: { name: true, email: true } } },
  });
}

export type PublicPolicy = {
  slug: PolicySlug;
  title: string;
  content: string;
  publishedAt: Date;
};

async function readPublishedPolicy(slug: PolicySlug): Promise<PublicPolicy | null> {
  const row = await prisma.policy.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      publishedTitle: true,
      publishedContent: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  if (!row) {
    const fallback = getDefaultPolicy(slug);
    return { ...fallback, publishedAt: new Date(0) };
  }
  if (!row.publishedContent || !row.publishedAt) return null;

  return {
    slug,
    title: row.publishedTitle ?? row.title,
    content: row.publishedContent,
    publishedAt: row.publishedAt ?? row.updatedAt,
  };
}

export async function getPublishedPolicy(slug: PolicySlug): Promise<PublicPolicy | null> {
  if (!hasUsableDatabaseUrl()) {
    return { ...getDefaultPolicy(slug), publishedAt: new Date(0) };
  }

  try {
    return await unstable_cache(
      () => readPublishedPolicy(slug),
      ["published-policy", slug],
      {
        revalidate: CACHE_REVALIDATE_SECONDS.policies,
        tags: [CACHE_TAGS.policies, policyCacheTag(slug)],
      },
    )();
  } catch {
    // Keeps static builds and rolling deploys healthy until the migration runs.
    return { ...getDefaultPolicy(slug), publishedAt: new Date(0) };
  }
}
