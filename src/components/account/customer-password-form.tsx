"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import {
  changeCustomerPasswordAction,
  type CustomerActionState
} from "@/app/(site)/account/actions";

const initialState: CustomerActionState = {};

export function CustomerPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changeCustomerPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <div className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-md bg-emerald/10 p-3 text-sm font-semibold text-emerald">
          {state.success}
        </div>
      ) : null}

      <label>
        <span className="form-label">Current password</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="form-input mt-1"
        />
      </label>
      <label>
        <span className="form-label">New password</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className="form-input mt-1"
        />
      </label>
      <label>
        <span className="form-label">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="form-input mt-1"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-extrabold text-white disabled:bg-muted/40"
      >
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Changing..." : "Change password"}
      </button>
    </form>
  );
}
