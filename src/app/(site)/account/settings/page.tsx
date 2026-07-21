import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { deliveryAreas } from "@/lib/constants";
import { CustomerProfileForm } from "@/components/account/customer-profile-form";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Edit your profile, delivery details, and preferences.",
};

export default async function CustomerSettingsPage() {
  const customer = await requireCustomer();
  const [categories, tags, languageRows] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.book.findMany({
      where: { status: { in: ["published", "pre_order", "upcoming"] } },
      select: { language: true },
      distinct: ["language"],
      orderBy: { language: "asc" },
    }),
  ]);

  const languages = languageRows.map((row) => row.language).filter(Boolean);

  const profileData = {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    profile: customer.profile
      ? {
          displayName: customer.profile.displayName,
          email: customer.profile.email,
          phone: customer.profile.phone,
          defaultDistrict: customer.profile.defaultDistrict,
          defaultDeliveryArea: customer.profile.defaultDeliveryArea,
          defaultAddress: customer.profile.defaultAddress,
          marketingConsent: customer.profile.marketingConsent,
          personalizationConsent: customer.profile.personalizationConsent,
        }
      : null,
    preferences: customer.preferences
      ? {
          preferredCategories: customer.preferences.preferredCategories,
          preferredTags: customer.preferences.preferredTags,
          preferredLanguages: customer.preferences.preferredLanguages,
        }
      : null,
  };

  return (
    <div className="container-px mx-auto max-w-7xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="story-kicker">Reader account</p>
          <h1 className="font-serif text-3xl font-medium text-forest">
            Account Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Update your profile, delivery defaults, password, and reading
            preferences without crowding the main account dashboard.
          </p>
        </div>
        <Link href="/account" className="premium-button-secondary w-fit">
          Back to account
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section
          id="profile"
          className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4">
            <h2 className="text-xl font-medium text-forest">
              Profile and delivery information
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Keep your contact details, delivery defaults, and preference
              choices up to date for smoother checkout and better recommendations.
            </p>
          </div>
          <CustomerProfileForm
            customer={profileData}
            categories={categories}
            tags={tags}
            languages={languages.length ? languages : ["Bangla", "English"]}
            deliveryOptions={deliveryAreas}
          />
        </section>

        <aside className="grid h-fit gap-5">
          <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <h2 className="text-lg font-medium text-forest">Shortcuts</h2>
            <div className="mt-4 grid gap-3">
              <Link
                href="/account/security"
                className="focus-ring inline-flex w-fit text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
              >
                Open security page
              </Link>
              <Link
                href="/account/settings#privacy"
                className="focus-ring inline-flex w-fit text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
              >
                Jump to privacy and preferences
              </Link>
              <Link
                href="/account"
                className="focus-ring inline-flex w-fit text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
              >
                Back to account dashboard
              </Link>
            </div>
          </section>

          <section id="privacy" className="rounded-lg border border-line bg-cream p-5">
            <h2 className="text-lg font-medium text-forest">Privacy note</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Reading preferences, recommendation choices, marketing consent,
              and delivery defaults stay here so the main account dashboard can
              stay focused on shopping activity.
            </p>
            <Link
              href="/privacy-policy"
              className="focus-ring mt-4 inline-flex text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
            >
              Read privacy policy
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
