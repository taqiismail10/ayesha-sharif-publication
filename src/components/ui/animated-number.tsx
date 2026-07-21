"use client";

/**
 * AnimatedNumber
 * --------------
 * Renders a value that smoothly tweens to its new number whenever the
 * input changes. Caller controls the formatter (currency, percent,
 * plain integer, …) so this stays trivially composable.
 *
 * Example:
 *   <AnimatedNumber value={totals.subtotal} format={formatCurrency} />
 *
 * The output uses an inline-block span with tabular-nums so width
 * stays stable across updates.
 */

import { useCountUp } from "@/lib/use-count-up";

type AnimatedNumberProps = {
  value: number;
  /** Any pure (value: number) => string. Defaults to identity-ish. */
  format?: (value: number) => string;
  duration?: number;
  className?: string;
};

const defaultFormat = (value: number) =>
  Number.isFinite(value) ? Math.round(value).toString() : "0";

export function AnimatedNumber({
  value,
  format = defaultFormat,
  duration,
  className
}: AnimatedNumberProps) {
  const animated = useCountUp(value, { duration });
  return (
    <span
      className={
        "inline-block tabular-nums " + (className ?? "")
      }
    >
      {format(animated)}
    </span>
  );
}