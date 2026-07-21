import { LayoutGrid } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getHomepageContent } from "@/lib/site-content";
import { HomepageContentEditor } from "@/components/admin/homepage-content-editor";

export const dynamic = "force-dynamic";

export default async function AdminHomepageContentPage() {
  await requireAdmin(["super_admin", "admin"]);
  const homepage = await getHomepageContent();

  return (
    <div>
      <div className="mb-7">
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cream text-gold">
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="font-serif text-2xl font-normal text-forest">
            Homepage Content
          </h1>
        </div>
        <p className="text-[13px] text-gray-soft">
          Edit the landing page eyebrow, hero copy, and feature strip without changing the layout.
        </p>
      </div>

      <HomepageContentEditor content={homepage} />
    </div>
  );
}

