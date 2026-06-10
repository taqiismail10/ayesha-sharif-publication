"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type FragmentMode = "hero" | "page";

type Letterform = {
  char: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  op: number;
  rot: number;
  dur: number;
  delay: number;
};

type Fragment = {
  text: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  op: number;
  rot: number;
  dur: number;
  delay: number;
  mono?: boolean;
};

export const letterforms: Letterform[] = [
  { char: "অ", top: "9%", left: "5%", size: 28, op: 0.030, rot: -6, dur: 26, delay: 0 },
  { char: "ক", top: "62%", left: "4%", size: 24, op: 0.027, rot: 4, dur: 30, delay: 3.8 },
  { char: "ষ", top: "80%", left: "7%", size: 20, op: 0.030, rot: -3, dur: 24, delay: 7.2 },
  { char: "ম", top: "23%", left: "6%", size: 22, op: 0.024, rot: 2, dur: 28, delay: 1.6 },
  { char: "হ", top: "44%", left: "3%", size: 26, op: 0.028, rot: -4, dur: 22, delay: 5.4 },
  { char: "আ", top: "11%", right: "4%", size: 26, op: 0.024, rot: 5, dur: 32, delay: 2.2 },
  { char: "র", top: "69%", right: "5%", size: 24, op: 0.030, rot: -3, dur: 26, delay: 8.1 },
  { char: "স", top: "35%", right: "3%", size: 20, op: 0.026, rot: 3, dur: 28, delay: 4.4 },
  { char: "খ", top: "87%", right: "6%", size: 22, op: 0.028, rot: -5, dur: 24, delay: 1.0 },
  { char: "ক্ষ", top: "51%", right: "4%", size: 18, op: 0.024, rot: 4, dur: 30, delay: 6.5 },
];

export const fragments: Fragment[] = [
  { text: "কবিতা", top: "17%", left: "7%", size: 11, op: 0.038, rot: -1.5, dur: 20, delay: 0.8 },
  { text: "গল্প", top: "38%", left: "5%", size: 10, op: 0.032, rot: 1.0, dur: 24, delay: 4.2 },
  { text: "উপন্যাস", top: "55%", left: "8%", size: 11, op: 0.035, rot: -0.8, dur: 22, delay: 8.5 },
  { text: "পৃষ্ঠা", top: "73%", left: "6%", size: 10, op: 0.030, rot: 1.2, dur: 26, delay: 2.4 },
  { text: "পাঠক", top: "90%", left: "9%", size: 11, op: 0.033, rot: -1.0, dur: 20, delay: 6.8 },
  { text: "প্রথম সংস্করণ", top: "13%", right: "6%", size: 10, op: 0.030, rot: 1.5, dur: 28, delay: 1.5 },
  { text: "নতুন প্রকাশ", top: "46%", right: "5%", size: 11, op: 0.035, rot: -1.0, dur: 22, delay: 5.8 },
  { text: "মুদ্রণ", top: "64%", right: "6%", size: 10, op: 0.028, rot: 0.8, dur: 24, delay: 3.0 },
  { text: "লেখক", top: "82%", right: "5%", size: 11, op: 0.032, rot: -1.5, dur: 26, delay: 9.2 },
  { text: "VOL_01", top: "29%", left: "6%", size: 10, op: 0.028, rot: -0.5, dur: 30, delay: 7.0, mono: true },
  { text: "পৃষ্ঠা ১২", top: "48%", left: "5%", size: 10, op: 0.025, rot: 0.8, dur: 22, delay: 0.3, mono: true },
  { text: "ISBN", top: "78%", right: "7%", size: 10, op: 0.022, rot: -0.6, dur: 26, delay: 4.8, mono: true },
  { text: "প্রচ্ছদ", top: "21%", right: "6%", size: 10, op: 0.030, rot: 1.0, dur: 20, delay: 2.0 },
  { text: "manuscript", top: "34%", left: "7%", size: 10, op: 0.028, rot: -1.2, dur: 24, delay: 5.0 },
  { text: "first edition", top: "59%", right: "6%", size: 10, op: 0.025, rot: 0.6, dur: 28, delay: 1.2 },
  { text: "reader", top: "86%", left: "6%", size: 10, op: 0.026, rot: -0.8, dur: 22, delay: 7.6 },
  { text: "archive", top: "42%", right: "7%", size: 10, op: 0.024, rot: 1.4, dur: 26, delay: 3.6 },
  { text: "literature", top: "70%", left: "5%", size: 10, op: 0.022, rot: -0.4, dur: 30, delay: 0.6 },
];

const pageLetterIndexes = [0, 3, 5, 6, 8, 9];
const pageFragmentIndexes = [0, 5, 9, 11, 13, 14, 16, 17];

function useAtmosphereEnvironment() {
  const [environment, setEnvironment] = useState({
    checked: false,
    isDesktop: false,
    isLowEnd: false,
    reduced: false,
  });

  useEffect(() => {
    const update = () => {
      setEnvironment({
        checked: true,
        isDesktop: window.innerWidth >= 768,
        isLowEnd: (navigator.hardwareConcurrency ?? 4) <= 2,
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return environment;
}

function selectByIndex<T>(items: T[], indexes: number[]) {
  return indexes.map((index) => items[index]).filter(Boolean);
}

function modeScale(mode: FragmentMode) {
  if (mode === "page") return { size: 1.05, opacity: 0.38, drift: 0.6 };
  return { size: 1, opacity: 1, drift: 1 };
}

export function LiteraryFragments({
  mode = "hero",
  className = "",
}: {
  mode?: FragmentMode;
  className?: string;
}) {
  const environment = useAtmosphereEnvironment();
  const scale = modeScale(mode);

  const { visibleLetters, visibleFragments } = useMemo(() => {
    if (!environment.checked || environment.reduced) {
      return { visibleLetters: [] as Letterform[], visibleFragments: [] as Fragment[] };
    }

    if (mode === "hero" && !environment.isDesktop) {
      return { visibleLetters: [] as Letterform[], visibleFragments: [] as Fragment[] };
    }

    if (mode === "page") {
      return {
        visibleLetters: selectByIndex(letterforms, environment.isLowEnd ? pageLetterIndexes.slice(0, 3) : pageLetterIndexes),
        visibleFragments: selectByIndex(fragments, environment.isLowEnd ? pageFragmentIndexes.slice(0, 4) : pageFragmentIndexes),
      };
    }

    return {
      visibleLetters: environment.isLowEnd ? letterforms.slice(0, 4) : letterforms,
      visibleFragments: environment.isLowEnd ? fragments.slice(0, 8) : fragments,
    };
  }, [environment, mode]);

  const color = "#2D4A2B";

  return (
    <div
      aria-hidden="true"
      className={`literary-fragments literary-fragments-${mode} ${className}`}
    >
      <div className="atm-layer2 absolute inset-0">
        {visibleLetters.map((letter, index) => (
          <span
            key={`${letter.char}-${index}`}
            className="literary-fragment literary-letterform"
            style={{
              top: letter.top,
              ...(letter.left !== undefined ? { left: letter.left } : {}),
              ...(letter.right !== undefined ? { right: letter.right } : {}),
              opacity: letter.op * scale.opacity,
              color,
              fontSize: `${letter.size * scale.size}px`,
              "--fragment-rotation": `rotate(${letter.rot}deg)`,
              transform: `rotate(${letter.rot}deg)`,
              animation: `atmLetterFloat ${letter.dur / scale.drift}s ease-in-out ${letter.delay}s infinite`,
            } as CSSProperties}
          >
            {letter.char}
          </span>
        ))}

        {visibleFragments.map((fragment, index) => (
          <span
            key={`${fragment.text}-${index}`}
            className="literary-fragment literary-phrase"
            style={{
              top: fragment.top,
              ...(fragment.left !== undefined ? { left: fragment.left } : {}),
              ...(fragment.right !== undefined ? { right: fragment.right } : {}),
              opacity: fragment.op * scale.opacity,
              color,
              fontFamily: fragment.mono ? "\"Courier New\", monospace" : "\"Crimson Text\", Georgia, serif",
              fontStyle: fragment.mono ? "normal" : "italic",
              fontSize: `${fragment.size * scale.size}px`,
              "--fragment-rotation": `rotate(${fragment.rot}deg)`,
              transform: `rotate(${fragment.rot}deg)`,
              animation: `atmPhraseFloat ${fragment.dur / scale.drift}s ease-in-out ${fragment.delay}s infinite`,
            } as CSSProperties}
          >
            {fragment.text}
          </span>
        ))}
      </div>
    </div>
  );
}
