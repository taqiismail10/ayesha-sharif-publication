"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback } from "react";

/**
 * QuantityStepper — shared increment/decrement stepper.
 * Reusable for product cards, cart rows, and the book detail purchase panel.
 *
 * Design intent: keep the +/- control subtle so it does not compete with the
 * primary CTA beside it. Two visual variants are supported:
 *   - "outline" (default): bordered, white background — used on the cart row
 *     and the book detail panel where the stepper sits on a plain surface.
 *   - "plain": transparent background, used inside product cards.
 *
 * Accessibility:
 *   - aria-label on both +/- buttons (required because they contain only icons).
 *   - aria-live="polite" on the value so screen readers announce the new total
 *     after each change.
 *   - Buttons are disabled (not hidden) when at min/max so the affordance
 *     remains visible and screen readers explain the bound via aria-disabled.
 *   - motion-safe: prefix on active scale — reduced-motion users get no
 *     tactile press feedback, just a clean colour change.
 */
export type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  variant?: "outline" | "plain";
  disabled?: boolean;
  /** Optional aria-label for the live value (e.g. "Quantity for Al-Furqan"). */
  valueLabel?: string;
  /** Aria label overrides for the +/- buttons. */
  decreaseLabel?: string;
  increaseLabel?: string;
  /** Optional size token: "sm" (32px) or "md" (40px). Defaults to "md". */
  size?: "sm" | "md";
  className?: string;
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  variant = "outline",
  disabled = false,
  valueLabel,
  decreaseLabel = "Decrease quantity",
  increaseLabel = "Increase quantity",
  size = "md",
  className = ""
}: QuantityStepperProps) {
  const clamp = useCallback(
    (next: number) => Math.max(min, Math.min(max, next)),
    [min, max]
  );

  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));

  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const text = size === "sm" ? "w-8 text-[13px]" : "w-10 text-sm";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  /* Variant surface */
  const surface =
    variant === "plain"
      ? ""
      : "border border-[rgba(176,168,156,0.4)] bg-white rounded-[4px]";

  /* Disabled styling — opacity only, preserves layout */
  const disabledCls = disabled ? "opacity-60 pointer-events-none" : "";

  /* Shared button styles. The motion-safe: prefix means reduced-motion users
     get a flat press (no scale), which feels right — scale animations can
     be disorienting when the rest of the page is also frozen. */
  const btnBase =
    "inline-flex items-center justify-center text-[#2D4A2B] " +
    "transition-[color,transform,background-color] duration-150 " +
    "ease-[cubic-bezier(0.4,0,0.2,1)] " +
    "hover:text-[#6B8E6F] active:text-[#2D4A2B] " +
    "motion-safe:active:scale-[0.92] " +
    "disabled:cursor-not-allowed disabled:opacity-40 " +
    "disabled:hover:text-[#2D4A2B] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-1 " +
    dim;

  return (
    <div
      className={`inline-flex items-center overflow-hidden ${surface} ${disabledCls} ${className}`.trim()}
      role="group"
      aria-label={valueLabel ?? "Quantity"}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label={decreaseLabel}
        className={btnBase}
      >
        <Minus className={icon} aria-hidden="true" />
      </button>

      <span
        aria-live="polite"
        aria-atomic="true"
        className={`select-none text-center font-semibold text-[#2D4A2B] ${text}`}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label={increaseLabel}
        className={btnBase}
      >
        <Plus className={icon} aria-hidden="true" />
      </button>
    </div>
  );
}
