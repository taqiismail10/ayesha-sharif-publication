"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, MailCheck, UserPlus } from "lucide-react";
import { GoogleAuthButton } from "@/components/account/google-auth-button";
import { PasswordToggleButton } from "@/components/ui/password-toggle-button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { postAuth } from "@/lib/auth-api-client";

type Step = "details" | "otp" | "success";
type OtpResponse = {
  message: string;
  resendAfterSeconds?: number;
};

export function SignupOtpForm() {
  const router = useRouter();
  const toast = useToast();
  const otpRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
    if (step !== "success") return;
    const timer = window.setTimeout(() => router.replace("/account/login?verified=1"), 1200);
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

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);
    const form = new FormData(event.currentTarget);
    const nextEmail = String(form.get("email") || "").trim().toLowerCase();
    try {
      const result = await postAuth<OtpResponse>("/auth/signup/request-otp", {
        name: form.get("name"),
        email: nextEmail,
        password: form.get("password"),
        confirmPassword: form.get("confirmPassword"),
      });
      setEmail(nextEmail);
      setCooldown(result.resendAfterSeconds ?? 60);
      setStep("otp");
      toast.success(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the code.");
    } finally {
      setIsPending(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await postAuth<{ message: string }>(
        "/auth/signup/verify-otp",
        { email, otp: form.get("otp") },
      );
      setStep("success");
      toast.success(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify the code.");
      otpRef.current?.focus();
    } finally {
      setIsPending(false);
    }
  }

  async function resendOtp() {
    setError("");
    setIsPending(true);
    try {
      const result = await postAuth<OtpResponse>("/auth/signup/resend-otp", {
        email,
      });
      setCooldown(result.resendAfterSeconds ?? 60);
      toast.success(result.message);
      otpRef.current?.focus();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resend the code.");
    } finally {
      setIsPending(false);
    }
  }

  if (step === "success") {
    return (
      <div role="status" className="grid justify-items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-sage" aria-hidden="true" />
        <h2 className="font-serif text-2xl text-forest">Email verified</h2>
        <p className="text-sm text-muted">Taking you to sign in…</p>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="grid gap-4">
        <div className="rounded-md bg-cream p-3 text-sm leading-6 text-muted">
          Enter the six-digit code sent to <strong className="text-forest">{email}</strong>.
        </div>
        {error ? <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p> : null}
        <label className="grid gap-1" htmlFor="signup-otp">
          <span className="form-label">Verification code</span>
          <input
            ref={otpRef}
            id="signup-otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="form-input text-center text-xl tracking-[0.35em]"
          />
        </label>
        <button type="submit" disabled={isPending} className="btn-lift focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
          {isPending ? <Spinner size="sm" label="Verifying code" /> : <MailCheck className="h-4 w-4" aria-hidden="true" />}
          Verify email
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button type="button" onClick={() => setStep("details")} className="focus-ring min-h-11 rounded-md px-2 font-medium text-muted">Change email</button>
          <button type="button" onClick={resendOtp} disabled={isPending || cooldown > 0} className="focus-ring min-h-11 rounded-md px-2 font-medium text-forest disabled:text-gray-soft">
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="grid gap-4">
      {error ? <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p> : null}
      <label className="grid gap-1" htmlFor="signup-name"><span className="form-label">Name</span><input id="signup-name" name="name" autoComplete="name" required className="form-input" /></label>
      <label className="grid gap-1" htmlFor="signup-email"><span className="form-label">Email</span><input id="signup-email" name="email" type="email" autoComplete="email" required className="form-input" /></label>
      <label className="grid gap-1" htmlFor="signup-password">
        <span className="form-label">Password</span>
        <div className="relative">
          <input id="signup-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required className="form-input pr-12" />
          <PasswordToggleButton isVisible={showPassword} label="Password" onToggle={() => setShowPassword((current) => !current)} />
        </div>
      </label>
      <label className="grid gap-1" htmlFor="signup-confirm-password">
        <span className="form-label">Confirm password</span>
        <div className="relative">
          <input id="signup-confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required className="form-input pr-12" />
          <PasswordToggleButton isVisible={showConfirmPassword} label="Confirm password" onToggle={() => setShowConfirmPassword((current) => !current)} />
        </div>
      </label>
      <button type="submit" disabled={isPending} className="btn-lift focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
        {isPending ? <Spinner size="sm" label="Sending verification code" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
        {isPending ? "Sending code…" : "Create account"}
      </button>
      <div className="flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-line" /><span className="text-xs font-medium uppercase tracking-[0.08em] text-gray-soft">or</span><span className="h-px flex-1 bg-line" /></div>
      <GoogleAuthButton />
      <p className="text-center text-sm font-semibold text-muted">Already have an account? <Link href="/account/login" className="text-forest underline decoration-gold decoration-2 underline-offset-4">Sign in</Link></p>
    </form>
  );
}
