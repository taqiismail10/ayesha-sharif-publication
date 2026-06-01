import type { Metadata } from "next";
import { BookOpen, Building2, PackageCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "About Ayesha-Sharif Publication."
};

export default function AboutPage() {
  return (
    <div className="container-px mx-auto max-w-5xl py-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-3 inline-flex rounded-sm bg-gold px-3 py-1 text-sm font-extrabold text-navy">
            Small publishing house
          </p>
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-navy">
            Ayesha-Sharif Publication
          </h1>
          <p className="mt-4 leading-8 text-muted">
            Ayesha-Sharif Publication is a new Bangladeshi publishing company
            focused on simple, useful, and reader-friendly books. This MVP
            website supports catalogue browsing, guest ordering, manual payment,
            and admin-managed delivery.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            {[
              { icon: BookOpen, title: "Book-focused catalogue" },
              { icon: PackageCheck, title: "Printed-copy launch ready" },
              { icon: Building2, title: "Affordable publishing workflow" }
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cream text-gold">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-extrabold text-navy">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
