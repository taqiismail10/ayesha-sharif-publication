"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, KeyRound, MailCheck } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { postAuth } from "@/lib/auth-api-client";

type Step = "email" | "otp" | "password" | "success";

export function ForgotPasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const otpRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
    if (step === "password") passwordRef.current?.focus();
    if (step !== "success") return;
    const timer = window.setTimeout(() => router.replace("/account/login?reset=1"), 1200);
    return () => window.clearTimeout(timer);
  }, [step, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function requestOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const formEmail = event
      ? String(new FormData(event.currentTarget).get("email") || "")
          .trim()
          .toLowerCase()
      : email;
    setError("");
    setIsPending(true);
    try {
      const result = await postAuth<{
        message: string;
        resendAfterSeconds?: number;
      }>("/auth/forgot-password/request-otp", { email: formEmail });
      setEmail(formEmail);
      setCooldown(result.resendAfterSeconds ?? 60);
      setStep("otp");
      toast.success(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the reset code.");
    } finally {
      setIsPending(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);
    try {
      const result = await postAuth<{ resetToken: string }>(
        "/auth/forgot-password/verify-otp",
        { email, otp: new FormData(event.currentTarget).get("otp") },
      );
      setResetToken(result.resetToken);
      setStep("password");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify the code.");
      otpRef.current?.focus();
    } finally {
      setIsPending(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await postAuth<{ message: string }>(
        "/auth/forgot-password/reset",
        {
          email,
          resetToken,
          newPassword: form.get("newPassword"),
          confirmPassword: form.get("confirmPassword"),
        },
      );
      setResetToken("");
      setStep("success");
      toast.success(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reset the password.");
    } finally {
      setIsPending(false);
    }
  }

  if (step === "success") {
    return (
      <div role="status" className="grid justify-items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-sage" aria-hidden="true" />
        <h2 className="font-serif text-2xl text-forest">Password updated</h2>
        <p className="text-sm text-muted">Taking you back to sign in…</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p> : null}

      {step === "email" ? (
        <form onSubmit={requestOtp} className="grid gap-4">
          <label className="grid gap-1" htmlFor="forgot-email"><span className="form-label">Email</span><input id="forgot-email" name="email" type="email" autoComplete="email" required className="form-input" /></label>
          <button type="submit" disabled={isPending} className="btn-lift focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
            {isPending ? <Spinner size="sm" label="Sending reset code" /> : <MailCheck className="h-4 w-4" aria-hidden="true" />}
            {isPending ? "Sending code…" : "Send reset code"}
          </button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={verifyOtp} className="grid gap-4">
          <p className="rounded-md bg-cream p-3 text-sm leading-6 text-muted">Enter the six-digit code sent to <strong className="text-forest">{email}</strong>.</p>
          <label className="grid gap-1" htmlFor="reset-otp"><span className="form-label">Reset code</span><input ref={otpRef} id="reset-otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className="form-input text-center text-xl tracking-[0.35em]" /></label>
          <button type="submit" disabled={isPending} className="btn-lift focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{isPending ? <Spinner size="sm" label="Verifying reset code" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}Verify code</button>
          <button type="button" onClick={() => void requestOtp()} disabled={isPending || cooldown > 0} className="focus-ring min-h-11 rounded-md px-2 text-sm font-medium text-forest disabled:text-gray-soft">{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button>
        </form>
      ) : null}

      {step === "password" ? (
        <form onSubmit={resetPassword} className="grid gap-4">
          <label className="grid gap-1" htmlFor="new-password"><span className="form-label">New password</span><input ref={passwordRef} id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} required className="form-input" /></label>
          <label className="grid gap-1" htmlFor="confirm-new-password"><span className="form-label">Confirm new password</span><input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className="form-input" /></label>
          <button type="submit" disabled={isPending} className="btn-lift focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{isPending ? <Spinner size="sm" label="Updating password" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}{isPending ? "Updating…" : "Update password"}</button>
        </form>
      ) : null}

      <p className="text-center text-sm font-semibold text-muted"><Link href="/account/login" className="text-forest underline decoration-gold decoration-2 underline-offset-4">Back to sign in</Link></p>
    </div>
  );
}
