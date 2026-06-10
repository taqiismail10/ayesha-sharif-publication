import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional CTA — shows a sage primary button when provided */
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="rounded-[8px] border border-[rgba(176,168,156,0.2)] bg-white p-8 text-center"
      style={{ paddingBlock: "80px" }}
    >
      <Icon
        className="mx-auto h-10 w-10"
        aria-hidden="true"
        style={{ color: "#B0A89C" }}
      />

      <h2
        className="mt-5"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "24px",
          fontWeight: 400,
          color: "#2D4A2B",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>

      {/* Description — Crimson Text italic: approved pull-quote/empty-state use */}
      <p
        className="mx-auto mt-3 max-w-md"
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "15px",
          lineHeight: 1.7,
          color: "#B0A89C",
        }}
      >
        {description}
      </p>

      {action && (
        <Link
          href={action.href}
          className="btn-lift mt-6 inline-flex select-none items-center rounded-[4px] bg-[#6B8E6F] px-8 py-[14px] text-sm font-medium uppercase tracking-[0.04em] text-white hover:bg-[#2D4A2B]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
