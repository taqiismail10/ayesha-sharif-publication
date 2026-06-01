"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-extrabold text-white print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print invoice
    </button>
  );
}
