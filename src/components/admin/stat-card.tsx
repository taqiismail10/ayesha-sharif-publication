import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-muted">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-navy">{value}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-cream text-gold">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
