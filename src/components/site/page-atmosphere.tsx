"use client";

import { LiteraryFragments } from "@/components/site/literary-fragments";

type PageGuide = {
  top: string;
  left?: string;
  right?: string;
  width: number;
  rotate: number;
  opacity: number;
};

const pageGuides: PageGuide[] = [
  { top: "16%", left: "5%", width: 80, rotate: -1.4, opacity: 0.035 },
  { top: "31%", right: "4%", width: 64, rotate: 1.2, opacity: 0.03 },
  { top: "52%", left: "6%", width: 58, rotate: 0.8, opacity: 0.028 },
  { top: "71%", right: "7%", width: 92, rotate: -1, opacity: 0.034 },
  { top: "88%", left: "4%", width: 68, rotate: 1.3, opacity: 0.03 },
];

export function PageAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="page-atmosphere pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {pageGuides.map((guide, index) => (
        <span
          key={index}
          className="absolute"
          style={{
            top: guide.top,
            ...(guide.left !== undefined ? { left: guide.left } : {}),
            ...(guide.right !== undefined ? { right: guide.right } : {}),
            width: `${guide.width}px`,
            height: "1px",
            background: "#2D4A2B",
            opacity: guide.opacity,
            transform: `rotate(${guide.rotate}deg)`,
            transformOrigin: "left center",
          }}
        />
      ))}

      <LiteraryFragments mode="page" />
    </div>
  );
}
