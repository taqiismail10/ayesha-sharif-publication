import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-[rgba(176,168,156,0.2)] bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-gray-soft">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-forest">{value}</p>
        </div>
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
          style={{ backgroundColor: "rgba(107,142,111,0.12)", color: "#6B8E6F" }}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
