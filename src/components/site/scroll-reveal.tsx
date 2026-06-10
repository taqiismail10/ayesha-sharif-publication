"use client";

import { useEffect, useRef, useState } from "react";

export type RevealVariant = "rise" | "slide-left" | "slide-right" | "scale";

type ScrollRevealProps = {
  children: React.ReactNode;
  /**
   * Animation variant:
   * - "rise"        (default) — fade + translateY(28px → 0)
   * - "slide-left"  — fade + translateX(-24px → 0)   (left-edge elements)
   * - "slide-right" — fade + translateX(24px → 0)    (right-edge elements)
   * - "scale"       — fade + scale(0.97 → 1)         (cards, images)
   */
  variant?: RevealVariant;
  /** Entrance delay in ms — use for staggered siblings */
  delay?: number;
  /** IntersectionObserver threshold (default 0.1) */
  threshold?: number;
  /** Extra classes on the wrapper div, e.g. "h-full" */
  className?: string;
};

/* Hidden (pre-reveal) transform + opacity for each variant.
   Shorter travel distances (18 px / 16 px) mean the snap-in feels instant. */
const HIDDEN: Record<RevealVariant, React.CSSProperties> = {
  rise:          { opacity: 0, transform: "translateY(18px)" },
  "slide-left":  { opacity: 0, transform: "translateX(-16px)" },
  "slide-right": { opacity: 0, transform: "translateX(16px)" },
  scale:         { opacity: 0, transform: "scale(0.96)" },
};

/* Revealed (final) state for each variant */
const REVEALED: Record<RevealVariant, React.CSSProperties> = {
  rise:          { opacity: 1, transform: "translateY(0)" },
  "slide-left":  { opacity: 1, transform: "translateX(0)" },
  "slide-right": { opacity: 1, transform: "translateX(0)" },
  scale:         { opacity: 1, transform: "scale(1)" },
};

/* 300 ms with ease-out-expo cubic — fast departure, graceful landing.
   Much snappier than the previous 450 ms ease-in-out. */
const TRANSITION =
  "opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), transform 300ms cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Wraps children in a div that animates into view when the element enters the
 * viewport via IntersectionObserver.
 *
 * SSR-safe: starts as `revealed: true` so server HTML is always visible and
 * no-JS users see content immediately. The animation activates post-hydration.
 *
 * Respects prefers-reduced-motion — skips to final state with no animation.
 * Guards against SSR/environments without window or IntersectionObserver.
 */
export function ScrollReveal({
  children,
  variant = "rise",
  delay = 0,
  threshold = 0.1,
  className = "",
}: ScrollRevealProps) {
  // Start revealed — SSR renders final state, no blank flash
  const [revealed, setRevealed] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guard: environments without window/IntersectionObserver
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }
    // Honour prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Start hidden and observe
    setRevealed(false);

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const style: React.CSSProperties = {
    ...(revealed ? REVEALED[variant] : HIDDEN[variant]),
    transition: TRANSITION,
    ...(delay > 0 ? { transitionDelay: `${delay}ms` } : {}),
  };

  return (
    <div ref={ref} className={className || undefined} style={style}>
      {children}
    </div>
  );
}
