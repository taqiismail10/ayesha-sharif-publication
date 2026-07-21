import Link from "next/link";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { HeroAtmosphere } from "@/components/site/hero-atmosphere";
import { HeroParallaxLayer } from "@/components/site/hero-parallax-layer";

type HeroSectionProps = {
  eyebrow: string;
  subtitle: string;
  meta: string;
};

export function HeroSection({
  eyebrow,
  subtitle,
  meta,
}: HeroSectionProps) {
  return (
    <section
      aria-label="Ayesha-Sharif Publication"
      className="relative isolate flex items-center justify-center overflow-hidden py-16"
      style={{
        minHeight: "clamp(520px, 72vh, 800px)",
        background:
          "linear-gradient(160deg, rgba(45, 74, 43, 0.025) 0%, rgba(176, 168, 156, 0.10) 54%, rgba(212, 165, 116, 0.055) 100%), #F5F1E8",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24"
        style={{
          background: "linear-gradient(to bottom, rgba(245,241,232,0.72), transparent)",
        }}
      />

      {/* ── Layer 0: Literary atmosphere (hairlines + letterforms + gold dust) ──
          Rendered first, z-index 0. All hero content is z-index ≥ 2. */}
      <HeroAtmosphere />

      <div
        aria-hidden="true"
        className="hero-editorial-plate pointer-events-none absolute left-1/2 top-1/2 z-[1]"
      />

      {/* ── Decorative vertical line — left (z-index 2, above atmosphere) ──
          Enters from left (-8px → 0) after 600ms delay, 600ms duration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: "30%",
          left: "max(28px, calc(50% - 500px))",
          width: "1px",
          height: "80px",
          backgroundColor: "rgba(212, 165, 116, 0.55)",
          zIndex: 2,
          animation: "heroLineLeft 600ms 600ms cubic-bezier(0.4,0,0.2,1) both",
        }}
      />

      {/* ── Decorative vertical line — right (z-index 2, above atmosphere) ──
          Enters from right (+8px → 0) after 600ms delay, 600ms duration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: "35%",
          right: "max(28px, calc(50% - 500px))",
          width: "1px",
          height: "80px",
          backgroundColor: "rgba(212, 165, 116, 0.55)",
          zIndex: 2,
          animation: "heroLineRight 600ms 600ms cubic-bezier(0.4,0,0.2,1) both",
        }}
      />

      {/* ── Content column (z-index 10, wrapped in parallax layer) ── */}
      <HeroParallaxLayer className="container-px relative z-10 mx-auto flex w-full max-w-[820px] flex-col items-center gap-5 text-center sm:gap-6">

        {/* Reading-mode overline tagline */}
        <ScrollReveal variant="slide-left" delay={0}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#B0A89C",
              marginBottom: "2px",
            }}
          >
            {eyebrow || "EST. — BANGLADESHI LITERARY PRESS"}
          </p>
        </ScrollReveal>

        {/* Gold accent rule */}
        <ScrollReveal variant="scale" delay={60}>
          <div
            aria-hidden="true"
            style={{
              width: "60px",
              height: "1px",
              backgroundColor: "#D4A574",
            }}
          />
        </ScrollReveal>

        {/* Bengali headline */}
        <ScrollReveal variant="rise" delay={120}>
          <h1 className="hero-title-bangla" lang="bn">
            আয়েশা-শরীফ পাবলিকেশন্স
          </h1>
        </ScrollReveal>

        {/* English sub-headline — Crimson Text italic (approved use) */}
        <ScrollReveal variant="rise" delay={200}>
          <p
            className="text-[18px] sm:text-[20px] md:text-[24px]"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.3,
              letterSpacing: "0.005em",
              color: "#B0A89C",
              marginTop: "4px",
            }}
          >
            {subtitle || "Quality books, delivered to your doorstep."}
          </p>
        </ScrollReveal>

        {/* Primary CTA */}
        <ScrollReveal variant="rise" delay={280}>
          <Link
            href="/books"
            className="btn-lift inline-flex items-center rounded-[4px] bg-[#6B8E6F] px-9 py-[14px] text-[13px] font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#2D4A2B] motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F5F1E8]"
          >
            Browse Books
          </Link>
        </ScrollReveal>

        {/* Secondary caption */}
        <ScrollReveal variant="rise" delay={340}>
          <p
            className="text-[13px]"
            style={{
              color: "#B0A89C",
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            {meta || "400+ books · Free delivery above ৳500"}
          </p>
        </ScrollReveal>

      </HeroParallaxLayer>

      {/* ── Hero bottom fade — blends into cream page background (z-index 2) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: "128px",
          zIndex: 2,
          background: "linear-gradient(to bottom, transparent 42%, rgba(245,241,232,0.78) 78%, #F5F1E8 100%)",
        }}
      />
    </section>
  );
}
