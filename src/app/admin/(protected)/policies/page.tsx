import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { PolicyEditorForm } from "@/components/admin/policy-editor-form";
import { requireAdmin } from "@/lib/auth";
import { isPolicySlug, POLICY_SLUGS } from "@/lib/policy-definitions";
import { getAdminPolicies } from "@/lib/policies";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: Date | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(value);
}

export default async function PoliciesPage({ searchParams }: PageProps) {
  await requireAdmin(["super_admin", "admin"]);
  const query = await searchParams;
  const requested = typeof query.policy === "string" ? query.policy : "";
  const selectedSlug = isPolicySlug(requested) ? requested : POLICY_SLUGS[0];
  const policies = await getAdminPolicies();
  const selected = policies.find((policy) => policy.slug === selectedSlug);

  return (
    <div>
      <div className="mb-7">
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cream text-gold">
            <FilePenLine className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="font-serif text-2xl font-normal text-forest">Site Policies</h1>
        </div>
        <p className="text-[13px] text-gray-soft">
          Edit drafts, preview them, and publish customer-facing policy content.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Policy selector" className="h-fit rounded-lg border border-line bg-white p-2 shadow-sm">
          {policies.map((policy) => {
            const active = policy.slug === selectedSlug;
            return (
              <Link
                key={policy.slug}
                href={`/admin/policies?policy=${policy.slug}`}
                aria-current={active ? "page" : undefined}
                className={`focus-ring flex min-h-11 items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
                  active ? "bg-forest text-white" : "text-forest hover:bg-cream"
                }`}
              >
                <span>{policy.title}</span>
                <span className={`text-[10px] uppercase tracking-wide ${active ? "text-white/75" : "text-gray-soft"}`}>
                  {policy.status}
                </span>
              </Link>
            );
          })}
        </nav>

        {selected ? (
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line/70 pb-4">
              <div>
                <h2 className="font-serif text-xl text-forest">{selected.title}</h2>
                <p className="mt-1 text-xs text-gray-soft">/{selected.slug}</p>
              </div>
              <div className="text-right text-xs leading-5 text-gray-soft">
                <span className={`admin-status-badge ${selected.status === "published" ? "text-sage" : "text-gold"}`}>
                  {selected.status === "published" ? "Published" : "Draft"}
                </span>
                <p className="mt-1">Updated {formatDate(selected.updatedAt)}</p>
                <p>Published {formatDate(selected.publishedAt)}</p>
                {selected.updatedBy ? <p>By {selected.updatedBy.name}</p> : null}
              </div>
            </div>
            <PolicyEditorForm
              key={`${selected.id}-${selected.updatedAt.toISOString()}`}
              policy={{ slug: selected.slug, title: selected.title, content: selected.content }}
            />
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-sm text-gray-soft">
            No policy content is available yet.
          </section>
        )}
      </div>
    </div>
  );
}
