import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { requireCustomer } from "@/lib/customer-auth";
import { CustomerPasswordForm } from "@/components/account/customer-password-form";

export const metadata: Metadata = {
  title: "Account Security",
  description: "Change the password for your customer account.",
};

export default async function CustomerSecurityPage() {
  await requireCustomer();

  return (
    <div className="container-px mx-auto max-w-5xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="story-kicker">Reader account</p>
          <h1 className="font-serif text-3xl font-medium text-forest">
            Security
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Update your password here without crowding the main account
            dashboard.
          </p>
        </div>
        <Link href="/account/settings" className="premium-button-secondary w-fit">
          Back to settings
        </Link>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-gold" aria-hidden="true" />
          <h2 className="text-lg font-medium text-forest">Change password</h2>
        </div>
        <p className="mb-4 text-sm leading-6 text-muted">
          Use your current password and choose a new one for your reader account.
        </p>
        <CustomerPasswordForm />
      </section>
    </div>
  );
}
