import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { CustomerAuthForm } from "@/components/account/customer-auth-form";

export const metadata: Metadata = {
  title: "Create Customer Account",
  description: "Create an optional reader account for order tracking."
};

export default async function CustomerRegisterPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account/profile");

  return (
    <div className="container-px mx-auto grid max-w-5xl gap-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="premium-panel p-6 sm:p-8">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-navy text-gold">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-3xl font-extrabold text-navy">
          Create your reader account
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Accounts are optional. You can still order as a guest, but an account
          helps you track orders and keep delivery preferences ready.
        </p>
        <Link href="/checkout" className="premium-button-secondary mt-6 w-fit">
          Continue as guest
        </Link>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
        <CustomerAuthForm mode="register" />
      </div>
    </div>
  );
}
