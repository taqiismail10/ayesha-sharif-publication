"use client";

import { useEffect, useRef } from "react";

const TRACK_HEIGHT = 120; // px
const FADE_THRESHOLD = 200; // px scrolled before rail appears

/**
 * Vertical scroll progress rail — desktop only.
 * Fixed to the right edge, vertically centred.
 * A 1px track grows a gold fill as the user scrolls.
 * Fades in after FADE_THRESHOLD px of scroll.
 */
export function ScrollRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const fill = fillRef.current;
    if (!rail || !fill) return;

    const desktop = window.matchMedia("(min-width: 768px)");
    const footer = document.querySelector<HTMLElement>(".site-footer");
    const sizeTarget =
      document.querySelector<HTMLElement>(".site-canvas") ?? document.body;
    let rafId = 0;
    let framePending = false;
    let listening = false;
    let maxScroll = 0;
    let footerTop = Number.POSITIVE_INFINITY;

    const measure = () => {
      maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0,
      );
      footerTop = footer
        ? footer.getBoundingClientRect().top + window.scrollY
        : Number.POSITIVE_INFINITY;
    };

    const render = () => {
      const scrollY = window.scrollY;
      const footerInView = scrollY + window.innerHeight > footerTop;
      const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;
      rail.style.opacity = scrollY > FADE_THRESHOLD && !footerInView ? "1" : "0";
      fill.style.transform = `scaleY(${progress})`;
    };

    const scheduleRender = () => {
      if (framePending) return;
      framePending = true;
      rafId = window.requestAnimationFrame(() => {
        framePending = false;
        render();
      });
    };

    const handleResize = () => {
      measure();
      scheduleRender();
    };
    const sizeObserver = "ResizeObserver" in window
      ? new ResizeObserver(handleResize)
      : null;

    const start = () => {
      if (listening) return;
      listening = true;
      measure();
      window.addEventListener("scroll", scheduleRender, { passive: true });
      window.addEventListener("resize", handleResize, { passive: true });
      sizeObserver?.observe(sizeTarget);
      render();
    };

    const stop = () => {
      if (!listening) return;
      listening = false;
      window.removeEventListener("scroll", scheduleRender);
      window.removeEventListener("resize", handleResize);
      sizeObserver?.disconnect();
      window.cancelAnimationFrame(rafId);
      framePending = false;
      rail.style.opacity = "0";
      fill.style.transform = "scaleY(0)";
    };

    const handleBreakpoint = () => {
      if (desktop.matches) start();
      else stop();
    };

    desktop.addEventListener("change", handleBreakpoint);
    handleBreakpoint();
    return () => {
      desktop.removeEventListener("change", handleBreakpoint);
      stop();
    };
  }, []);

  return (
    <div
      ref={railRef}
      id="scroll-rail"
      aria-hidden="true"
      className="fixed hidden md:block"
      style={{
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 30,
        opacity: 0,
        transition: "opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: "none",
      }}
    >
      {/* Track */}
      <div
        style={{
          position: "relative",
          width: "1px",
          height: `${TRACK_HEIGHT}px`,
          backgroundColor: "rgba(176, 168, 156, 0.3)",
        }}
      >
        {/* Fill — grows downward */}
        <div
          ref={fillRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1px",
            height: `${TRACK_HEIGHT}px`,
            backgroundColor: "#D4A574",
            transform: "scaleY(0)",
            transformOrigin: "top",
            transition: "transform 80ms ease-out",
          }}
        />
      </div>
    </div>
  );
}
