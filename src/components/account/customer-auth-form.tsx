"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import {
  loginCustomerAction,
  registerCustomerAction,
  type CustomerActionState
} from "@/app/(site)/account/actions";

const initialState: CustomerActionState = {};

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

      <label>
        <span className="form-label">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          className="form-input mt-1"
        />
      </label>

      {!isLogin ? (
        <label>
          <span className="form-label">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="form-input mt-1"
          />
        </label>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-extrabold text-white disabled:bg-muted/40"
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
          className="text-navy underline decoration-gold decoration-2 underline-offset-4"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
