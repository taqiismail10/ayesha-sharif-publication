import { ScrollReveal } from "@/components/site/scroll-reveal";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  /** Optional overline label, e.g. "— Featured —".
   *  Rendered above the title with a slide-left entrance. */
  overline?: string;
};

export function SectionTitle({ title, subtitle, overline }: SectionTitleProps) {
  return (
    <div className="flex flex-col items-center text-center">

      {/* Overline label — slide-left, delay=0 */}
      {overline ? (
        <ScrollReveal variant="slide-left" delay={0}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "10px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#B0A89C",
              marginBottom: "10px",
            }}
          >
            {overline}
          </p>
        </ScrollReveal>
      ) : null}

      {/* Title text — rise, delay staggers after overline */}
      <ScrollReveal variant="rise" delay={overline ? 40 : 0}>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "32px",
            fontWeight: 400,
            color: "#2D4A2B",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </ScrollReveal>

      {/* Gold accent underline — scale, delay staggers after title */}
      <ScrollReveal variant="scale" delay={overline ? 120 : 80}>
        <div
          aria-hidden="true"
          style={{
            width: "60px",
            height: "2px",
            backgroundColor: "#D4A574",
            marginTop: "10px",
          }}
        />
      </ScrollReveal>

      {/* Subtitle — Inter, no italic (italic reserved for approved moments only) */}
      {subtitle ? (
        <ScrollReveal variant="rise" delay={overline ? 160 : 120}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              color: "#B0A89C",
              marginTop: "12px",
            }}
          >
            {subtitle}
          </p>
        </ScrollReveal>
      ) : null}
    </div>
  );
}
