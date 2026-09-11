"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Field, FieldControl, FieldError } from "@/components/ui/field";
import { FormSuccess } from "@/components/forms/form-success";
import type { CustomerActionState } from "@/app/(site)/account/actions";
import { AuthApiError, putAuth } from "@/lib/auth-api-client";

const initialState: CustomerActionState = {};

export function CustomerPasswordForm() {
  const [state, setState] = useState<CustomerActionState>(initialState);
  const [isPending, setIsPending] = useState(false);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsPending(true);
    setState(initialState);

    try {
      const result = await putAuth<{ message: string }>(
        "/customers/me/password",
        {
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
          confirmPassword: formData.get("confirmPassword")
        }
      );
      setState({ success: result.message });
      form.reset();
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        setState({ error: caught.message, fieldErrors: caught.fieldErrors });
      } else {
        setState({ error: "The request could not be completed. Please try again." });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {state.error ? (
        <div role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      <FormSuccess message={state.success} />

      <details
        className="group rounded-lg border border-line bg-page/45"
        open={Boolean(state.error || state.success)}
      >
        <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg px-4 py-4 marker:hidden">
          <div>
            <h3 className="text-base font-medium text-forest">Change password</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              Open this section when you want to update your sign-in password.
            </p>
          </div>
          <p className="shrink-0 text-xs uppercase tracking-[0.14em] text-gold">
            Expand
          </p>
        </summary>

        <div className="grid gap-4 border-t border-line/70 px-4 py-4">
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
              minLength={8}
              maxLength={128}
              required
              className="mt-1"
            />
            <FieldError />
          </Field>
          <p className="text-sm leading-6 text-muted">
            Use 8–128 characters with at least one uppercase letter, one lowercase
            letter, one number, and one special character. Do not start or end
            with whitespace.
          </p>
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
        </div>
      </details>
    </form>
  );
}
