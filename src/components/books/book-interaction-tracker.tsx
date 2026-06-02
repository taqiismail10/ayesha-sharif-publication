"use client";

import { useEffect } from "react";
import { trackBookEvent } from "@/lib/tracking-client";

export function BookInteractionTracker({ bookId }: { bookId: string }) {
  useEffect(() => {
    trackBookEvent({ bookId, eventType: "view", source: "book_detail" });
  }, [bookId]);

  return null;
}
