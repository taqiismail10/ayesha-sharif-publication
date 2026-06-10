import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // ── New editorial design tokens ─────────────────────────
        sage:       "#6B8E6F",   // nav, primary buttons, category pills
        forest:     "#2D4A2B",   // headings, footer background, emphasis
        "gray-soft": "#B0A89C",  // secondary text, borders, placeholders

        // ── Updated legacy tokens (new design values) ───────────
        cream:   "#F5F1E8",   // page background (was #F7F1E3)
        gold:    "#D4A574",   // hover states, price highlights (was #C9A227)
        page:    "#F5F1E8",   // same as cream (was #FFFCF6)

        // ── Unchanged legacy tokens (admin compatibility) ────────
        navy:    "#10233F",
        emerald: "#0F766E",
        danger:  "#B42318",
        ink:     "#111827",
        muted:   "#6B7280",
        line:    "#E5E7EB"
      },
      fontFamily: {
        // New serif token for Crimson Text editorial headings
        serif:   ["Crimson Text", "Georgia", "serif"],
        // Existing tokens unchanged
        sans:    ["Inter", "Noto Sans Bengali", "system-ui", "sans-serif"],
        heading: ["Inter", "Noto Sans Bengali", "system-ui", "sans-serif"]
      },
      boxShadow: {
        // ── New semantic tokens ──────────────────────────────────
        card:        "0 1px 3px rgba(0,0,0,0.06)",
        "card-hover": "0 12px 32px rgba(0,0,0,0.10)",
        nav:         "0 2px 12px rgba(0,0,0,0.15)",
        // ── Existing tokens (unchanged) ──────────────────────────
        soft:           "0 14px 35px rgba(16, 35, 63, 0.08)",
        premium:        "0 18px 48px rgba(16, 35, 63, 0.10)",
        "premium-hover": "0 26px 64px rgba(16, 35, 63, 0.16)",
        hero:           "0 34px 90px rgba(16, 35, 63, 0.28)",
        book:           "12px 18px 28px rgba(16, 35, 63, 0.18), 2px 4px 10px rgba(17, 24, 39, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
