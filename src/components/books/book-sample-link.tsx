"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { trackBookEvent } from "@/lib/tracking-client";

export function BookSampleLink({
  href,
  bookId
}: {
  href: string;
  bookId: string;
}) {
  return (
    <Link
      href={href}
      onClick={() =>
        trackBookEvent({
          bookId,
          eventType: "sample_open",
          source: "book_detail"
        })
      }
      className="mt-5 inline-flex items-center gap-2 rounded-md border border-gold px-4 py-2 text-sm font-bold text-navy"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Preview sample
    </Link>
  );
}
