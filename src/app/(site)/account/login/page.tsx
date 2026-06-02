import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
import { getCurrentCustomer, isSafeAccountRedirect } from "@/lib/customer-auth";
import { CustomerAuthForm } from "@/components/account/customer-auth-form";

export const metadata: Metadata = {
  title: "Customer Login",
  description: "Sign in to track orders and manage your reader profile."
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomerLoginPage({ searchParams }: PageProps) {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account/profile");

  const next = pick((await searchParams).next);
  const redirectTo = isSafeAccountRedirect(next) ? next : undefined;

  return (
    <div className="container-px mx-auto grid max-w-5xl gap-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="premium-panel p-6 sm:p-8">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-navy text-gold">
          <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-3xl font-extrabold text-navy">
          Welcome back
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Sign in to track your orders, keep delivery details ready, and receive
          consent-aware book recommendations.
        </p>
        <Link href="/books" className="premium-button-secondary mt-6 w-fit">
          Browse as guest
        </Link>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
        <CustomerAuthForm mode="login" redirectTo={redirectTo} />
      </div>
    </div>
  );
}
