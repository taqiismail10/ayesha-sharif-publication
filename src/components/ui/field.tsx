"use client";

/**
 * Inline form-validation primitives.
 * --------------------------------
 * Provides Field, FieldLabel, FieldHint, FieldError, FieldControl,
 * FieldTextarea and FieldSelect.
 *
 * Usage:
 *
 *   <Field name="email" error={errors.email}>
 *     <FieldLabel htmlFor="email">Email</FieldLabel>
 *     <FieldControl
 *       id="email"
 *       type="email"
 *       value={email}
 *       onChange={(e) => setEmail(e.target.value)}
 *     />
 *     <FieldHint message="We will only use this for order updates." />
 *     <FieldError message={errors.email} />
 *   </Field>
 *
 * The components are headless — they only manage aria wiring and
 * styling. The host component owns the value, onChange, validation
 * and the form submit logic.
 */

import clsx from "clsx";
import { AlertCircle } from "lucide-react";
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";

/* ─────────────────────────────────────────────────────────── Field ── */

type FieldContextValue = {
  errorId: string;
  hintId: string;
  error?: string;
  invalid: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

type FieldProps = {
  /** Used to build deterministic ids for aria wiring. */
  name: string;
  /** Top-level error message. Individual controls pick this up too. */
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ name, error, children, className }: FieldProps) {
  const id = useId();
  const errorId = `${id}-${name}-error`;
  const hintId = `${id}-${name}-hint`;

  return (
    <FieldContext.Provider
      value={{ errorId, hintId, error, invalid: Boolean(error) }}
    >
      <div className={clsx("space-y-1", className)}>{children}</div>
    </FieldContext.Provider>
  );
}

function useFieldContext(component: string): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) {
    throw new Error(
      `<${component}> must be rendered inside a <Field name="..."> wrapper.`
    );
  }
  return ctx;
}

/* ──────────────────────────────────────────────────── FieldLabel ── */

type FieldLabelProps = {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  optional?: boolean;
};

export function FieldLabel({
  children,
  htmlFor,
  className,
  optional
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx("form-label inline-flex items-center gap-2", className)}
    >
      <span>{children}</span>
      {optional ? (
        <span className="text-xs font-normal text-gray-soft">(optional)</span>
      ) : null}
    </label>
  );
}

/* ─────────────────────────────────────────────────────── FieldHint ── */

type FieldHintProps = {
  message?: string;
  className?: string;
};

export function FieldHint({ message, className }: FieldHintProps) {
  const ctx = useFieldContext("FieldHint");
  if (!message) return null;
  return (
    <p id={ctx.hintId} className={clsx("text-xs text-muted", className)}>
      {message}
    </p>
  );
}

/* ─────────────────────────────────────────────────── FieldError ── */

type FieldErrorProps = {
  message?: string;
  className?: string;
};

export function FieldError({ message, className }: FieldErrorProps) {
  const ctx = useFieldContext("FieldError");
  const value = message ?? ctx.error;
  if (!value) return null;
  return (
    <p
      id={ctx.errorId}
      role="alert"
      className={clsx(
        "flex items-start gap-1.5 text-xs font-medium text-danger",
        className
      )}
    >
      <AlertCircle
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      />
      <span>{value}</span>
    </p>
  );
}

/* ───────────────────────────────────── helpers (control contract) ── */

type ControlCommon = {
  /** Override aria-invalid. Defaults to FieldContext.invalid. */
  invalid?: boolean;
  /** Extra token to append to the auto-generated aria-describedby. */
  describedBy?: string;
};

function useControlAria(overrideInvalid?: boolean, extra?: string) {
  const ctx = useFieldContext("FieldControl");
  const invalid = overrideInvalid ?? ctx.invalid;
  const describedBy =
    [ctx.hintId, ctx.errorId, extra].filter(Boolean).join(" ") || undefined;
  return {
    "aria-invalid": invalid ? true : undefined,
    "aria-describedby": describedBy,
    "aria-errormessage": ctx.error ? ctx.errorId : undefined
  } as const;
}

/* ────────────────────────────────────────── FieldControl — input ── */

export const FieldControl = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & ControlCommon
>(function FieldControl({ className, invalid, describedBy, ...rest }, ref) {
  const aria = useControlAria(invalid, describedBy);
  return (
    <input
      ref={ref}
      className={clsx("form-input mt-1", className)}
      {...aria}
      {...rest}
    />
  );
});

/* ─────────────────────────────────────── FieldControl — textarea ── */

export const FieldTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & ControlCommon
>(function FieldTextarea({ className, invalid, describedBy, ...rest }, ref) {
  const aria = useControlAria(invalid, describedBy);
  return (
    <textarea
      ref={ref}
      className={clsx("form-input mt-1 min-h-24 resize-y", className)}
      {...aria}
      {...rest}
    />
  );
});

/* ────────────────────────────────────────── FieldControl — select ── */

export const FieldSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & ControlCommon
>(function FieldSelect({ className, invalid, describedBy, ...rest }, ref) {
  const aria = useControlAria(invalid, describedBy);
  return (
    <select
      ref={ref}
      className={clsx("form-input mt-1", className)}
      {...aria}
      {...rest}
    />
  );
});

/* ──────────────────────────────────────── FieldErrorMessage type ── */

export type FieldErrors = Record<string, string | undefined>;