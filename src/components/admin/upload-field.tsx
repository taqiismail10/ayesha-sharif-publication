"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function UploadField({
  name,
  label,
  type,
  accept,
  multiple = false,
  defaultValue = ""
}: {
  name: string;
  label: string;
  type: "cover" | "gallery" | "sample";
  accept: string;
  multiple?: boolean;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setStatus("Uploading...");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        const response = await apiFetch("/admin/uploads", {
          method: "POST",
          body: formData
        });
        const result = (await response.json()) as {
          ok?: boolean;
          url?: string;
          message?: string;
        };
        if (!response.ok || !result.ok || !result.url) {
          throw new Error(result.message || "Upload failed.");
        }
        uploaded.push(result.url);
      }
      setValue((current) =>
        multiple ? [current, ...uploaded].filter(Boolean).join(",") : uploaded[0]
      );
      setStatus("Uploaded");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Upload failed.");
    }
  }

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-bold text-navy">
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          Upload
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            className="sr-only"
            onChange={(event) => upload(event.target.files)}
          />
        </label>
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="URL or uploaded path"
          className="form-input"
        />
      </div>
      {status ? <p className="mt-1 text-xs font-semibold text-muted">{status}</p> : null}
    </div>
  );
}
