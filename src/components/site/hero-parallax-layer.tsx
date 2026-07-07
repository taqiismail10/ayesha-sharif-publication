"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps hero content and applies a scroll-linked Y drift so the content
 * rises at 30 % of the user's scroll speed — a gentle parallax that keeps
 * the hero feeling "alive" as the page scrolls into the sections below.
 *
 * Uses requestAnimationFrame for 60 fps smoothness with no layout thrash.
 * Gracefully removed if prefers-reduced-motion is active.
 */
export function HeroParallaxLayer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    let pending = false;
    let active = true;

    const onScroll = () => {
      if (!active || pending) return;
      pending = true;
      rafId = requestAnimationFrame(() => {
        if (el) {
          // 0.30 multiplier: content drifts up at 30 % of scroll velocity
          el.style.transform = `translateY(${window.scrollY * 0.3}px)`;
        }
        pending = false;
      });
    };

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          active = entry.isIntersecting;
          el.style.willChange = active ? "transform" : "auto";
          if (active) onScroll();
        })
      : null;

    el.style.willChange = "transform";
    observer?.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      el.style.willChange = "auto";
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
