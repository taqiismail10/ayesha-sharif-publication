import Link from "next/link";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { HeroAtmosphere } from "@/components/site/hero-atmosphere";
import { HeroParallaxLayer } from "@/components/site/hero-parallax-layer";

export function HeroSection() {
  return (
    <section
      aria-label="Ayesha-Sharif Publication"
      className="relative isolate flex min-h-[520px] items-center justify-center overflow-hidden py-16 sm:min-h-[560px] md:h-[72vh] md:min-h-[620px] md:max-h-[780px]"
      style={{
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
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#B0A89C",
              marginBottom: "2px",
            }}
          >
            Est. — Bangladeshi Literary Press
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
          <h1
            className="mx-auto max-w-[760px] text-[34px] sm:text-[44px] md:text-[56px]"
            style={{
              /* Noto Serif Bengali → premium Bengali editorial serif
                 Falls back through Crimson Text (Latin) → Georgia → system serif */
              fontFamily: "var(--font-bengali), var(--font-serif), Georgia, serif",
              fontWeight: 400,
              lineHeight: 1.08,
              color: "#2D4A2B",
            }}
          >

            <span className="block sm:inline">আয়েশা-শরীফ</span>{" "}
            <span className="block sm:inline">পাবলিকেশন্স</span>
          </h1>
        </ScrollReveal>

        {/* English sub-headline — Crimson Text italic (approved use) */}
        <ScrollReveal variant="rise" delay={200}>
          <p
            className="text-[16px] sm:text-lg md:text-[22px]"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "#B0A89C",
              marginTop: "2px",
            }}
          >
            Quality books, delivered to your doorstep.
          </p>
        </ScrollReveal>

        {/* Primary CTA */}
        <ScrollReveal variant="rise" delay={280}>
          <Link
            href="/books"
            className="btn-lift inline-flex items-center rounded-[4px] bg-[#6B8E6F] px-9 py-[14px] text-sm font-medium uppercase tracking-[0.04em] text-white hover:bg-[#2D4A2B]"
          >
            Browse Books
          </Link>
        </ScrollReveal>

        {/* Secondary caption */}
        <ScrollReveal variant="rise" delay={340}>
          <p className="text-[13px]" style={{ color: "#B0A89C" }}>
            400+ books · Free delivery above ৳500
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
