"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback } from "react";

/**
 * QuantityStepper — shared increment/decrement stepper.
 * Reusable for product cards, cart rows, and the book detail purchase panel.
 *
 * Design intent: one segmented control across product cards, cart rows, and
 * purchase panels. The active flag adds a restrained cart-state accent without
 * changing the control's dimensions.
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
  onChange?: (next: number) => void;
  /** Atomic actions avoid stale-value updates during rapid clicks. */
  onIncrement?: () => void;
  onDecrement?: () => void;
  variant?: "outline" | "plain";
  active?: boolean;
  disabled?: boolean;
  /** Optional aria-label for the live value (e.g. "Quantity for Al-Furqan"). */
  valueLabel?: string;
  /** Aria label overrides for the +/- buttons. */
  decreaseLabel?: string;
  increaseLabel?: string;
  /** Optional size token: "sm" (32px) or touch-friendly "md" (44px). */
  size?: "sm" | "md";
  className?: string;
};

export function QuantityStepper({
  value,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  onChange,
  onIncrement,
  onDecrement,
  variant = "outline",
  active = false,
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

  const dec = useCallback(() => {
    if (onDecrement) {
      onDecrement();
      return;
    }
    onChange?.(clamp(value - 1));
  }, [clamp, onChange, onDecrement, value]);
  const inc = useCallback(() => {
    if (onIncrement) {
      onIncrement();
      return;
    }
    onChange?.(clamp(value + 1));
  }, [clamp, onChange, onIncrement, value]);

  const containerHeight = size === "sm" ? "h-8" : "h-11";
  const buttonSize = size === "sm"
    ? "h-8 w-8 shrink-0"
    : "h-11 w-11 shrink-0";
  const text = size === "sm"
    ? "h-8 min-w-10 flex-1 text-[13px]"
    : "h-11 min-w-14 flex-1 text-sm";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  /* Disabled styling — opacity only, preserves layout */
  const disabledCls = disabled ? "quantity-stepper--disabled" : "";
  const activeCls = active ? "quantity-stepper--active" : "";
  const variantCls = variant === "plain" ? "quantity-stepper--plain" : "";

  /* Shared button styles. The motion-safe: prefix means reduced-motion users
     get a flat press (no scale), which feels right — scale animations can
     be disorienting when the rest of the page is also frozen. */
  const btnBase =
    "quantity-stepper__button inline-flex items-center justify-center " +
    buttonSize;

  return (
    <div
      className={`quantity-stepper ${containerHeight} ${activeCls} ${variantCls} ${disabledCls} ${className}`.trim()}
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
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${valueLabel ?? "Quantity"}: ${value}`}
        className={`quantity-stepper__value select-none text-center font-semibold ${text}`}
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
