import type { Metadata } from "next";
import { BookOpen, Building2, PackageCheck } from "lucide-react";
import { getAboutContent } from "@/lib/site-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description: "About Ayesha-Sharif Publication."
};

export default async function AboutPage() {
  const a = await getAboutContent();

  return (
    <div className="container-px mx-auto max-w-5xl py-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-3 inline-flex rounded-[4px] bg-gold/15 px-3 py-1 text-sm font-medium text-gold">
            {a.badge}
          </p>
          <h1 className="font-serif text-4xl font-normal leading-tight text-forest">
            {a.title}
          </h1>
          <p className="mt-4 leading-8 text-gray-soft">{a.description}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-6 shadow-card">
          <div className="grid gap-4">
            {[
              { icon: BookOpen,     title: "Book-focused catalogue" },
              { icon: PackageCheck, title: "Printed-copy launch ready" },
              { icon: Building2,    title: "Affordable publishing workflow" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-sage/10 text-sage">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-medium text-forest">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
