"use client";

import { useMemo, useState, useEffect } from "react";

// ─── Content pools ─────────────────────────────────────────────────────────

const LETTER_POOL = [
  "অ", "আ", "ক", "খ", "গ", "ম", "র", "স", "হ", "ষ", "ন", "প", "দ", "ক্ষ",
];

const WORD_POOL = [
  "কবিতা", "গল্প", "উপন্যাস", "প্রবন্ধ", "পৃষ্ঠা",
  "পাঠক",  "লেখক", "বই",       "মুদ্রণ",  "প্রচ্ছদ",
];

const FRAGMENT_POOL: { text: string; mono: boolean }[] = [
  { text: "VOL_01",          mono: true  },
  { text: "ISBN",            mono: true  },
  { text: "পৃষ্ঠা ১২",       mono: true  },
  { text: "প্রথম সংস্করণ",   mono: false },
  { text: "নতুন প্রকাশ",     mono: false },
  { text: "manuscript",      mono: false },
  { text: "first edition",   mono: false },
  { text: "archive",         mono: false },
  { text: "reader",          mono: false },
  { text: "literature",      mono: false },
];

// ─── Static hairlines ─────────────────────────────────────────────────────

const HAIRLINES = [
  { top: "11%", left: "5%",  width: 52, rotate: -1.5, opacity: 0.08  },
  { top: "24%", left: "3%",  width: 38, rotate:  1.0, opacity: 0.065 },
  { top: "58%", left: "6%",  width: 66, rotate: -1.0, opacity: 0.075 },
  { top: "76%", left: "4%",  width: 44, rotate:  1.8, opacity: 0.06  },
  { top: "38%", left: "5%",  width: 30, rotate: -0.8, opacity: 0.05  },
  { top: "15%", right: "4%", width: 58, rotate:  1.2, opacity: 0.07  },
  { top: "47%", right: "5%", width: 36, rotate: -1.5, opacity: 0.065 },
  { top: "68%", right: "3%", width: 72, rotate:  0.8, opacity: 0.08  },
  { top: "85%", right: "4%", width: 48, rotate: -1.0, opacity: 0.06  },
  { top: "32%", left: "44%", width: 28, rotate:  0.4, opacity: 0.045 },
];

// ─── Seeded LCG ────────────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Zone-based position generator (4 × 3 grid) ─────────────────────────

type ZonePos = { left: string; top: string; rot: number; delay: number };

function generateZonedPositions(rand: () => number, count: number): ZonePos[] {
  const COLS = 4, ROWS = 3, ZONES = COLS * ROWS, MARGIN = 0.1;
  return Array.from({ length: count }, (_, i) => {
    const zone = i % ZONES, col = zone % COLS, row = Math.floor(zone / COLS);
    const zW = 100 / COLS, zH = 100 / ROWS;
    return {
      left:  `${(col * zW + zW * MARGIN + rand() * zW * (1 - 2 * MARGIN)).toFixed(1)}%`,
      top:   `${(row * zH + zH * MARGIN + rand() * zH * (1 - 2 * MARGIN)).toFixed(1)}%`,
      rot:   (rand() - 0.5) * 6,    // –3° … +3°
      delay: rand() * 10,            // 0 … 10 s stagger
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────

export function HeroAtmosphere() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const isLowEnd =
    typeof navigator !== "undefined"
      ? (navigator.hardwareConcurrency ?? 4) <= 2
      : false;

  const seed = useMemo(() => Date.now(), []);
  const letterPos  = useMemo(() => generateZonedPositions(seededRandom(seed),     LETTER_POOL.length),   [seed]);
  const wordPos    = useMemo(() => generateZonedPositions(seededRandom(seed + 1),  WORD_POOL.length),     [seed]);
  const fragPos    = useMemo(() => generateZonedPositions(seededRandom(seed + 2),  FRAGMENT_POOL.length), [seed]);

  const showAnimated = isDesktop && !prefersReduced;
  const showGold     = showAnimated && !isLowEnd;

  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}
    >
      {/* ── Layer 1: Hairlines (static) ── */}
      <div style={{ position: "absolute", inset: 0 }}>
        {HAIRLINES.map((h, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: h.top,
              ...(h.left  ? { left:  h.left  } : {}),
              ...(h.right ? { right: h.right } : {}),
              width: `${h.width}px`, height: "0.5px",
              background: "#2D4A2B", opacity: h.opacity,
              transform: `rotate(${h.rotate}deg)`, transformOrigin: "left center",
            }}
          />
        ))}
      </div>

      {/* ── Layer 2: Animated text — desktop only ── */}
      {showAnimated && (
        <div className="atm-layer2" style={{ position: "absolute", inset: 0 }}>

          {/* Group A — large Bengali letterforms (28–32 px, oscillating float).
              ARCHITECTURE: rotation lives on the WRAPPER div so the keyframe's
              `transform: translateY(...)` can animate the INNER span without
              overriding the static tilt. Both compose correctly.            */}
          {LETTER_POOL.map((char, i) => {
            if (isLowEnd && i >= 4) return null;
            const pos = letterPos[i];
            return (
              <div
                key={`l-${i}`}
                style={{
                  position: "absolute",
                  top:  pos.top,
                  left: pos.left,
                  // Static rotation on wrapper — NOT in keyframe
                  transform: `rotate(${pos.rot}deg)`,
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: `${28 + (i % 3) * 2}px`,
                    color: "#2D4A2B",
                    lineHeight: 1,
                    userSelect: "none",
                    // Starts at opacity 0; keyframe raises to 0.16 at peak
                    opacity: 0,
                    animation: `atmLetterFloat ${22 + (i % 8) * 1.8}s ease-in-out ${pos.delay}s infinite`,
                  }}
                >
                  {char}
                </span>
              </div>
            );
          })}

          {/* Group B — Bengali literary words (11–12 px italic, peaks at 0.14) */}
          {WORD_POOL.map((word, i) => {
            const pos = wordPos[i];
            return (
              <div
                key={`w-${i}`}
                style={{
                  position: "absolute",
                  top:  pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rot}deg)`,
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: `${11 + (i % 2)}px`,
                    color: "#2D4A2B",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    opacity: 0,
                    animation: `atmPhraseFloat ${18 + (i % 6) * 2.2}s ease-in-out ${pos.delay + 1}s infinite`,
                  }}
                >
                  {word}
                </span>
              </div>
            );
          })}

          {/* Group C — Publishing fragments (10 px, peaks at 0.14) */}
          {FRAGMENT_POOL.map((frag, i) => {
            const pos = fragPos[i];
            return (
              <div
                key={`f-${i}`}
                style={{
                  position: "absolute",
                  top:  pos.top,
                  left: pos.left,
                  transform: `rotate(${pos.rot}deg)`,
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: frag.mono ? "'Courier New', monospace" : "'Crimson Text', Georgia, serif",
                    fontStyle: frag.mono ? "normal" : "italic",
                    fontSize: "10px",
                    color: "#2D4A2B",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    opacity: 0,
                    animation: `atmPhraseFloat ${20 + (i % 5) * 2}s ease-in-out ${pos.delay + 0.5}s infinite`,
                  }}
                >
                  {frag.text}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Layer 3: Gold foil dust (peaks at 0.38) ── */}
      {showGold && (
        <div className="atm-layer3" style={{ position: "absolute", inset: 0 }}>
          {([5, 6, 5, 6, 4, 5] as const).map((size, i) => {
            const rand = seededRandom(seed + 3 + i);
            return (
              <div
                key={`g-${i}`}
                style={{
                  position: "absolute",
                  top:    `${(15 + rand() * 70).toFixed(1)}%`,
                  left:   `${(15 + rand() * 70).toFixed(1)}%`,
                  width:  `${size}px`,
                  height: `${size}px`,
                  borderRadius: "50%",
                  background: "#D4A574",
                  animation: `atmGoldPulse ${9 + i * 1.5}s ease-in-out ${i * 1.8}s infinite`,
                  pointerEvents: "none",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
