"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { apiUrl } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  Field,
  FieldControl,
  FieldError
} from "@/components/ui/field";
import {
  loginCustomerAction,
  registerCustomerAction,
  type CustomerActionState
} from "@/app/(site)/account/actions";

const initialState: CustomerActionState = {};

function PasswordInput({
  autoComplete,
  label,
  name,
  fieldError
}: {
  autoComplete: string;
  label: string;
  name: string;
  fieldError?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const id = `customer-${name}`;
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <Field name={name} error={fieldError}>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-1">
        <FieldControl
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className="pr-12"
        />
        <button
          type="button"
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          className="focus-ring absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-soft transition hover:bg-cream hover:text-forest"
          onClick={() => setIsVisible((current) => !current)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <FieldError />
    </Field>
  );
}

export function CustomerAuthForm({
  mode,
  redirectTo
}: {
  mode: "login" | "register";
  redirectTo?: string;
}) {
  const isLogin = mode === "login";
  const [state, formAction, isPending] = useActionState(
    isLogin ? loginCustomerAction : registerCustomerAction,
    initialState
  );
  const Icon = isLogin ? LogIn : UserPlus;
  const toast = useToast();
  const prevStateRef = useRef<CustomerActionState>(initialState);

  useEffect(() => {
    const prev = prevStateRef.current;
    if (state.error && state.error !== prev.error) {
      toast.error({ title: isLogin ? "Sign-in failed" : "Could not create account", description: state.error });
    }
    if (state.success && state.success !== prev.success) {
      toast.success({
        title: isLogin ? "Signed in" : "Account created",
        description: state.success
      });
    }
    prevStateRef.current = state;
  }, [state, toast, isLogin]);

  return (
    <form action={formAction} className="grid gap-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      {state.error ? (
        <div role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}

      {!isLogin ? (
        <Field name="name">
          <label className="form-label" htmlFor="customer-name">Name</label>
          <FieldControl id="customer-name" name="name" autoComplete="name" required className="mt-1" />
          <FieldError />
        </Field>
      ) : null}

      {isLogin ? (
        <Field name="identifier">
          <label className="form-label" htmlFor="customer-identifier">Email or phone</label>
          <FieldControl
            id="customer-identifier"
            name="identifier"
            autoComplete="username"
            required
            className="mt-1"
            placeholder="Email or 01XXXXXXXXX"
          />
          <FieldError />
        </Field>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="email">
            <label className="form-label" htmlFor="customer-email">Email</label>
            <FieldControl id="customer-email" name="email" type="email" autoComplete="email" className="mt-1" />
            <FieldError />
          </Field>
          <Field name="phone">
            <label className="form-label" htmlFor="customer-phone">Phone</label>
            <FieldControl
              id="customer-phone"
              name="phone"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              className="mt-1"
            />
            <FieldError />
          </Field>
        </div>
      )}

      <PasswordInput
        name="password"
        label="Password"
        autoComplete={isLogin ? "current-password" : "new-password"}
      />

      {!isLogin ? (
        <PasswordInput
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
        />
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="btn-lift focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white disabled:cursor-progress disabled:bg-gray-soft"
      >
        {isPending ? (
          <Spinner
            size="sm"
            className="text-white"
            label={isLogin ? "Signing in" : "Creating account"}
          />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
        <span>
          {isPending
            ? isLogin
              ? "Signing in…"
              : "Creating account…"
            : isLogin
              ? "Sign in"
              : "Create account"}
        </span>
      </button>

      {/* ── Google OAuth (Phase 2C) — additional method, password login unchanged ── */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-gray-soft">
          or
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Full-page redirect to the NestJS OAuth start route. The API validates
          the redirect param server-side (open-redirect safe). */}
      <a
        href={apiUrl(
          `/auth/customer/google${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
        )}
        className="focus-ring inline-flex min-h-12 w-full select-none items-center justify-center gap-2.5 rounded-[4px] border border-line bg-white px-5 py-3 text-sm font-medium text-forest transition-colors duration-150 hover:bg-cream"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        Continue with Google
      </a>

      <p className="text-center text-sm font-semibold text-muted">
        {isLogin ? "New here?" : "Already have an account?"}{" "}
        <Link
          href={isLogin ? "/account/register" : "/account/login"}
          className="text-forest underline decoration-gold decoration-2 underline-offset-4 transition-colors duration-150 hover:text-sage"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
