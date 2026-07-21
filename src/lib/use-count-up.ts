"use client";

/**
 * useCountUp
 * ----------
 * Animates a numeric value from its current rendered value to the next
 * `target` whenever it changes. Uses requestAnimationFrame so it stays
 * smooth on slow CPUs, and respects prefers-reduced-motion by snapping
 * immediately.
 *
 * Returns the in-progress numeric value as React state, ready to feed
 * into any formatter (e.g. `formatCurrency(value)`).
 */

import { useEffect, useRef, useState } from "react";

type UseCountUpOptions = {
  /** Duration of the tween in ms. Defaults to 450 — fast enough to
   *  feel responsive, slow enough to be perceived. */
  duration?: number;
  /** Lower bound. Defaults to 0 so totals stay non-negative. */
  min?: number;
  /** Optional starting value — defaults to the first `target` seen. */
  startValue?: number;
};

const DEFAULT_DURATION = 450;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function easeOutCubic(t: number): number {
  const x = 1 - t;
  return 1 - x * x * x;
}

export function useCountUp(
  target: number,
  { duration = DEFAULT_DURATION, min = 0, startValue }: UseCountUpOptions = {}
): number {
  const initial = startValue ?? target;
  const [value, setValue] = useState<number>(() =>
    Math.max(min, Number.isFinite(initial) ? initial : 0)
  );

  const fromRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? target : 0;
    const clampedTarget = Math.max(min, safeTarget);
    if (clampedTarget === fromRef.current) return;

    if (prefersReducedMotion()) {
      fromRef.current = clampedTarget;
      setValue(clampedTarget);
      return;
    }

    const start = fromRef.current;
    const delta = clampedTarget - start;
    const startedAt = performance.now();
    let cancelled = false;

    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const next = start + delta * eased;
      setValue(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = clampedTarget;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, duration, min]);

  return value;
}