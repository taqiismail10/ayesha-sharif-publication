import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, policyCacheTag } from "@/lib/cache-tags";
import { fetchPublicApi } from "@/lib/public-api";
import { getDefaultPolicy, type PolicySlug } from "@/lib/policy-definitions";

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

export type PublicPolicy = {
  slug: PolicySlug;
  title: string;
  content: string;
  publishedAt: Date;
};

async function readPublishedPolicy(slug: PolicySlug): Promise<PublicPolicy | null> {
  const policy = await fetchPublicApi<{
    slug: PolicySlug;
    title: string;
    content: string;
    publishedAt: string;
  }>(`/policies/${encodeURIComponent(slug)}`);
  return { ...policy, publishedAt: new Date(policy.publishedAt) };
}

export async function getPublishedPolicy(slug: PolicySlug): Promise<PublicPolicy | null> {
  try {
    const policy = await unstable_cache(
      () => readPublishedPolicy(slug),
      ["published-policy", slug],
      {
        revalidate: CACHE_REVALIDATE_SECONDS.policies,
        tags: [CACHE_TAGS.policies, policyCacheTag(slug)],
      },
    )();
    return policy
      ? { ...policy, publishedAt: new Date(policy.publishedAt) }
      : null;
  } catch {
    // Keeps static builds and rolling deploys healthy when the API is unavailable.
    return { ...getDefaultPolicy(slug), publishedAt: new Date(0) };
  }
}
