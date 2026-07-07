import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/account/forgot-password-form";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your AS Publications customer account password.",
};

export default async function ForgotPasswordPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account/profile");

  return (
    <div className="container-px mx-auto grid max-w-5xl gap-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div className="premium-panel p-6 sm:p-8">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-forest text-gold">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-normal text-forest">Reset your password</h1>
        <p className="mt-3 leading-7 text-muted">We will email a short-lived verification code before allowing a password change.</p>
      </div>
      <div className="glass-card rounded-[10px] p-6 sm:p-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
