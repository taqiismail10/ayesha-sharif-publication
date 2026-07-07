import { notFound } from "next/navigation";
import { PolicyPage } from "@/components/site/policy-page";
import { getPublishedPolicy } from "@/lib/policies";
import type { PolicySlug } from "@/lib/policy-definitions";

export async function PublishedPolicyPage({ slug }: { slug: PolicySlug }) {
  const policy = await getPublishedPolicy(slug);
  if (!policy) notFound();

  return (
    <PolicyPage
      title={policy.title}
      content={policy.content}
      updatedAt={policy.publishedAt}
    />
  );
}
