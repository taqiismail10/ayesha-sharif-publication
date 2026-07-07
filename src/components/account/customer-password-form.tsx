"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Field, FieldControl, FieldError } from "@/components/ui/field";
import { FormSuccess } from "@/components/forms/form-success";
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
  const toast = useToast();
  const prevStateRef = useRef<CustomerActionState>(initialState);

  useEffect(() => {
    const prev = prevStateRef.current;
    if (state.error && state.error !== prev.error) {
      toast.error({
        title: "Could not change password",
        description: state.error
      });
    }
    if (state.success && state.success !== prev.success) {
      toast.success({
        title: "Password updated",
        description: state.success
      });
    }
    prevStateRef.current = state;
  }, [state, toast]);

  return (
    <form action={formAction} className="grid gap-4">
      {state.error ? (
        <div role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      <FormSuccess message={state.success} />

      <Field name="currentPassword" error={state.fieldErrors?.currentPassword}>
        <label className="form-label" htmlFor="customer-currentPassword">Current password</label>
        <FieldControl
          id="customer-currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1"
        />
        <FieldError />
      </Field>
      <Field name="newPassword" error={state.fieldErrors?.newPassword}>
        <label className="form-label" htmlFor="customer-newPassword">New password</label>
        <FieldControl
          id="customer-newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1"
        />
        <FieldError />
      </Field>
      <Field name="confirmPassword" error={state.fieldErrors?.confirmPassword}>
        <label className="form-label" htmlFor="customer-confirmPassword">Confirm new password</label>
        <FieldControl
          id="customer-confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1"
        />
        <FieldError />
      </Field>
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
