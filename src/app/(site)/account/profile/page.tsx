import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { BookMarked, LockKeyhole, PackageCheck, Settings, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { deliveryAreas } from "@/lib/constants";
import { CustomerPasswordForm } from "@/components/account/customer-password-form";
import { CustomerProfileForm } from "@/components/account/customer-profile-form";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your Ayesha-Sharif Publication reader profile."
};

export default async function CustomerProfilePage() {
  const customer = await requireCustomer();
  const [categories, tags, languageRows, orderCount, savedCount] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.tag.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.book.findMany({
      where: { status: { in: ["published", "pre_order", "upcoming"] } },
      select: { language: true },
      distinct: ["language"],
      orderBy: { language: "asc" }
    }),
    prisma.order.count({ where: { customerId: customer.id } }),
    prisma.savedBook.count({ where: { customerId: customer.id } })
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
          personalizationConsent: customer.profile.personalizationConsent
        }
      : null,
    preferences: customer.preferences
      ? {
          preferredCategories: customer.preferences.preferredCategories,
          preferredTags: customer.preferences.preferredTags,
          preferredLanguages: customer.preferences.preferredLanguages
        }
      : null
  };

  return (
    <div className="container-px mx-auto max-w-7xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="story-kicker">Reader account</p>
          <h1 className="font-heading text-3xl font-extrabold text-navy">
            My Profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage your contact details, delivery defaults, preferences, and
            privacy choices.
          </p>
        </div>
        <Link href="/account/logout" className="premium-button-secondary w-fit">
          Logout
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          icon={PackageCheck}
          title="Orders"
          value={orderCount.toString()}
          href="/account/orders"
        />
        <DashboardCard
          icon={BookMarked}
          title="Saved books"
          value={savedCount.toString()}
          href="/books"
        />
        <DashboardCard
          icon={ShieldCheck}
          title="Personalization"
          value={customer.profile?.personalizationConsent ? "On" : "Off"}
          href="/cookie-settings"
        />
        <DashboardCard
          icon={Settings}
          title="Cookie settings"
          value="Manage"
          href="/cookie-settings"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-xl font-extrabold text-navy">
            Profile and preferences
          </h2>
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
            <div className="mb-4 flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-gold" aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-navy">Security</h2>
            </div>
            <CustomerPasswordForm />
          </section>

          <section className="rounded-lg border border-line bg-cream p-5">
            <h2 className="text-lg font-extrabold text-navy">Privacy note</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              You can turn off personalization at any time. Anonymous
              recommendation tracking is controlled separately from account
              profile preferences.
            </p>
            <Link href="/privacy-policy" className="mt-4 inline-flex text-sm font-bold text-navy">
              Read privacy policy
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  value,
  href
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-soft"
    >
      <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
      <p className="mt-3 text-sm font-bold text-muted">{title}</p>
      <p className="mt-1 text-2xl font-extrabold text-navy">{value}</p>
    </Link>
  );
}
