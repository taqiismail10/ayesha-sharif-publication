import { Loader2 } from "lucide-react";
import type { HTMLAttributes } from "react";

type SpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

/**
 * Phase A, Item 3 — Spinner.
 * Inherits `currentColor` so it can sit inside any button color scheme.
 * Pair with `aria-live="polite"` on the surrounding region or an
 * `aria-label` on the icon if it carries meaning (see checkout / auth buttons).
 */
export function Spinner({
  size = "md",
  className = "",
  label = "Loading",
  ...rest
}: { size?: SpinnerSize; label?: string } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="status"
      aria-label={label}
      className={"inline-flex items-center justify-center " + className}
      {...rest}
    >
      <Loader2
        aria-hidden="true"
        className={"animate-spin " + SIZE_CLASS[size]}
      />
    </span>
  );
}
