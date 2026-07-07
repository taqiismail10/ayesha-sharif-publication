"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { GoogleAuthButton } from "@/components/account/google-auth-button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { PasswordToggleButton } from "@/components/ui/password-toggle-button";
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
        <PasswordToggleButton
          isVisible={isVisible}
          label={label}
          onToggle={() => setIsVisible((current) => !current)}
        />
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

      {isLogin ? (
        <div className="-mt-2 text-right">
          <Link
            href="/account/forgot-password"
            className="focus-ring inline-flex min-h-11 items-center rounded-md px-1 text-sm font-medium text-forest underline decoration-gold underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>
      ) : null}

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

      <GoogleAuthButton redirectTo={redirectTo} />

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
