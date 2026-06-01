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
        navy: "#10233F",
        cream: "#F7F1E3",
        gold: "#C9A227",
        emerald: "#0F766E",
        danger: "#B42318",
        ink: "#111827",
        muted: "#6B7280",
        line: "#E5E7EB",
        page: "#FFFCF6"
      },
      boxShadow: {
        soft: "0 14px 35px rgba(16, 35, 63, 0.08)",
        premium: "0 18px 48px rgba(16, 35, 63, 0.10)",
        "premium-hover": "0 26px 64px rgba(16, 35, 63, 0.16)",
        hero: "0 34px 90px rgba(16, 35, 63, 0.28)",
        book:
          "12px 18px 28px rgba(16, 35, 63, 0.18), 2px 4px 10px rgba(17, 24, 39, 0.14)"
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Bengali", "system-ui", "sans-serif"],
        heading: ["Inter", "Noto Sans Bengali", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
