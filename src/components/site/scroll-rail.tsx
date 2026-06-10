"use client";

import { useEffect, useState } from "react";

const TRACK_HEIGHT = 120; // px
const FADE_THRESHOLD = 200; // px scrolled before rail appears

/**
 * Vertical scroll progress rail — desktop only.
 * Fixed to the right edge, vertically centred.
 * A 1px track grows a gold fill as the user scrolls.
 * Fades in after FADE_THRESHOLD px of scroll.
 */
export function ScrollRail() {
  const [progress, setProgress] = useState(0);  // 0–1
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const footer = document.querySelector(".site-footer");
      const footerRect = footer?.getBoundingClientRect();
      const footerInView = footerRect
        ? footerRect.top < window.innerHeight && footerRect.bottom > 0
        : false;

      setVisible(scrollY > FADE_THRESHOLD && !footerInView);
      setProgress(maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // compute initial state
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fillHeight = Math.round(progress * TRACK_HEIGHT);

  return (
    <div
      id="scroll-rail"
      aria-hidden="true"
      className="fixed hidden md:block"
      style={{
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 30,
        opacity: visible ? 1 : 0,
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
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1px",
            height: `${fillHeight}px`,
            backgroundColor: "#D4A574",
            transition: "height 80ms ease-out",
          }}
        />
      </div>
    </div>
  );
}
