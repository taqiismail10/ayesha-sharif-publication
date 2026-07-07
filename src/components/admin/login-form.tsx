"use client";

import { useActionState, useState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type ActionState } from "@/app/admin/actions";
import { PasswordToggleButton } from "@/components/ui/password-toggle-button";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <div className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      <label>
        <span className="form-label">Admin email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="form-input mt-1"
        />
      </label>
      <label>
        <span className="form-label">Password</span>
        <div className="relative mt-1">
          <input
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            className="form-input pr-12"
          />
          <PasswordToggleButton
            isVisible={isPasswordVisible}
            label="Password"
            onToggle={() => setIsPasswordVisible((current) => !current)}
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-extrabold text-white disabled:bg-muted/40"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
