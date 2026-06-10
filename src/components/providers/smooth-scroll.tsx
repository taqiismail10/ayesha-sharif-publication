"use client";

import { ReactLenis } from "@studio-freight/react-lenis";
import type { ReactNode } from "react";

/**
 * SmoothScrollProvider
 *
 * Wraps the application with Lenis momentum-based smooth scrolling.
 * Physics settings deliberately tuned for a heavy, unhurried, premium feel:
 *
 *   lerp: 0.07   — linear-interpolation factor per frame.
 *                  Lower = heavier/slower scroll momentum.
 *                  0.05 is very heavy; 0.1 is pleasantly viscous.
 *                  0.07 sits between both — unhurried but responsive.
 *
 *   duration: 1.4 — Affects easing curve length (used when Lenis
 *                    calculates its easing-based scroll target). Longer
 *                    = more languid deceleration.
 *
 *   easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
 *                  — Expo-out easing: fast start, long graceful tail.
 *                    This is what gives the scroll its "expensive" feel.
 *
 *   smoothTouch: false — Disable on touch; native mobile momentum is
 *                         better UX than simulated smooth scroll on mobile.
 *
 * The `root` prop tells Lenis to manage the <html> scroll target rather
 * than a specific scrollable container. This is the setup needed for a
 * full-page smooth scroll.
 *
 * See: https://github.com/studio-freight/lenis
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.07,
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 2,
        wheelMultiplier: 1.2,
      }}
    >
      {children}
    </ReactLenis>
  );
}
