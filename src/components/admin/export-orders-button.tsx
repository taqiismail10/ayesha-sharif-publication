"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

function filenameFromDisposition(value: string | null) {
  const match = value?.match(/filename="([^"\\]+)"/i);
  return match?.[1] || "orders.csv";
}

export function ExportOrdersButton({ query }: { query: string }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      const response = await apiFetch(`/admin/orders/export?${query}`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || "Could not export orders.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filenameFromDisposition(response.headers.get("Content-Disposition"));
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export orders.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gold px-4 py-2 text-sm font-extrabold text-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {downloading ? "Preparing export..." : "Export CSV"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-700" role="alert">{error}</p> : null}
    </div>
  );
}
