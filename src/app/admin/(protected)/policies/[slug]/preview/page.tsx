import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PolicyPage } from "@/components/site/policy-page";
import { requireAdmin } from "@/lib/auth";
import { isPolicySlug } from "@/lib/policy-definitions";
import { getAdminPolicy } from "@/lib/policies";

type PageProps = { params: Promise<{ slug: string }> };

export default async function PolicyPreviewPage({ params }: PageProps) {
  await requireAdmin(["super_admin", "admin"]);
  const { slug } = await params;
  if (!isPolicySlug(slug)) notFound();
  const policy = await getAdminPolicy(slug);
  if (!policy) notFound();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/policies?policy=${slug}`}
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-forest"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to editor
        </Link>
        <p className="text-xs uppercase tracking-[0.08em] text-gray-soft">
          Draft preview — not public
        </p>
      </div>
      <PolicyPage title={policy.title} content={policy.content} updatedAt={policy.updatedAt} />
    </div>
  );
}
