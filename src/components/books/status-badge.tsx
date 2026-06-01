import type { BookStatus } from "@prisma/client";
import { bookStatusLabels } from "@/lib/constants";

const styles: Record<BookStatus, string> = {
  draft: "bg-muted/10 text-muted",
  upcoming: "bg-gold/15 text-navy",
  pre_order: "bg-emerald/10 text-emerald",
  published: "bg-emerald/10 text-emerald",
  out_of_stock: "bg-danger/10 text-danger",
  archived: "bg-muted/10 text-muted"
};

export function StatusBadge({ status }: { status: BookStatus }) {
  return (
    <span className={`rounded-sm px-2 py-1 text-xs font-bold ${styles[status]}`}>
      {bookStatusLabels[status]}
    </span>
  );
}
