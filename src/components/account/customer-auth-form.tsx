"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import {
  loginCustomerAction,
  registerCustomerAction,
  type CustomerActionState
} from "@/app/(site)/account/actions";

const initialState: CustomerActionState = {};

function PasswordInput({
  autoComplete,
  label,
  name
}: {
  autoComplete: string;
  label: string;
  name: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const id = `customer-${name}`;
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className="form-input pr-12"
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
    </div>
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

  return (
    <form action={formAction} className="grid gap-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      {state.error ? (
        <div className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}

      {!isLogin ? (
        <label>
          <span className="form-label">Name</span>
          <input
            name="name"
            autoComplete="name"
            required
            className="form-input mt-1"
          />
        </label>
      ) : null}

      {isLogin ? (
        <label>
          <span className="form-label">Email or phone</span>
          <input
            name="identifier"
            autoComplete="username"
            required
            className="form-input mt-1"
            placeholder="Email or 01XXXXXXXXX"
          />
        </label>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="form-label">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="form-input mt-1"
            />
          </label>
          <label>
            <span className="form-label">Phone</span>
            <input
              name="phone"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              className="form-input mt-1"
            />
          </label>
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
        className="btn-lift focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-sage px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-soft"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {isPending
          ? isLogin
            ? "Signing in..."
            : "Creating account..."
          : isLogin
            ? "Sign in"
            : "Create account"}
      </button>

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
