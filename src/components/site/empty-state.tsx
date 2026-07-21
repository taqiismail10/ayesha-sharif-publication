import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type EmptyStateAction = {
  label: string;
  href: string;
  /** Optional click handler — useful for closing drawers / dialogs before navigating */
  onClick?: () => void;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional primary CTA — shows a sage button when provided */
  action?: EmptyStateAction;
  /** Optional secondary CTA — shown as a subtle text link below the primary action */
  secondaryAction?: EmptyStateAction;
  /** Compact variant for inline use (empty cart drawer, panel-level). Reduces vertical padding. */
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-[8px] border border-[rgba(176,168,156,0.2)] bg-white p-8 text-center ${
        compact ? "py-6" : ""
      }`}
      style={compact ? undefined : { paddingBlock: "80px" }}
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
          onClick={action.onClick}
          className="btn-lift mt-6 inline-flex select-none items-center rounded-[4px] bg-[#6B8E6F] px-8 py-[14px] text-sm font-medium uppercase tracking-[0.04em] text-white hover:bg-[#2D4A2B]"
        >
          {action.label}
        </Link>
      )}

      {secondaryAction && (
        <div className="mt-3">
          <Link
            href={secondaryAction.href}
            onClick={secondaryAction.onClick}
            className="text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: "#6B8E6F" }}
          >
            {secondaryAction.label}
          </Link>
        </div>
      )}
    </div>
  );
}