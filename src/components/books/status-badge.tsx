import type { BookStatus } from "@prisma/client";
import { bookStatusLabels } from "@/lib/constants";

const styles: Record<BookStatus, string> = {
  draft: "border-muted/20 bg-white/75 text-muted",
  upcoming: "status-badge-glow border-gold/40 bg-gold/15 text-forest",
  pre_order: "status-badge-glow border-emerald/25 bg-emerald/10 text-emerald",
  published: "border-emerald/20 bg-emerald/10 text-emerald",
  out_of_stock: "border-danger/20 bg-danger/10 text-danger",
  archived: "border-muted/20 bg-muted/10 text-muted"
};

export function StatusBadge({ status }: { status: BookStatus }) {
  return (
    <span className={`status-badge ${styles[status]}`}>
      {bookStatusLabels[status]}
    </span>
  );
}
