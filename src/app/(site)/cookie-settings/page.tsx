import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsClient } from "@/components/site/cookie-settings-client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Cookie Settings",
  description: "Manage cookie and personalization preferences."
};

export default function CookieSettingsPage() {
  return (
    <div className="container-px mx-auto max-w-3xl py-10">
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="story-kicker">Privacy controls</p>
        <h1 className="font-heading text-3xl font-extrabold text-navy">
          Cookie Settings
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Choose optional cookies for this browser. Necessary cookies keep the
          cart, checkout, and secure sessions working.
        </p>
        <div className="mt-6">
          <CookieSettingsClient />
        </div>
        <Link
          href="/privacy-policy"
          className="mt-6 inline-flex text-sm font-bold text-navy underline decoration-gold decoration-2 underline-offset-4"
        >
          Read privacy policy
        </Link>
      </div>
    </div>
  );
}
