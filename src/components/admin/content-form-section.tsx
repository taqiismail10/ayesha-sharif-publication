"use client";

import { useActionState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";
import type { ContentActionState } from "@/app/admin/(protected)/site-content/actions";

type Action = (
  prev: ContentActionState,
  formData: FormData,
) => Promise<ContentActionState>;

export function ContentFormSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action: Action;
  children: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState<ContentActionState, FormData>(
    action,
    {},
  );

  return (
    <section className="rounded-lg border border-[rgba(176,168,156,0.25)] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 border-b border-[rgba(176,168,156,0.2)] pb-4">
        <h2 className="text-[15px] font-semibold text-forest">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] text-gray-soft">{description}</p>
        )}
      </div>

      {/* Feedback */}
      {state.success && (
        <div className="mb-4 flex items-center gap-2 rounded-[4px] bg-sage/10 px-3 py-2 text-[13px] font-medium text-sage">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Saved successfully.
        </div>
      )}
      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-[4px] bg-danger/10 px-3 py-2 text-[13px] font-medium text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </div>
      )}

      <form action={formAction} className="grid gap-4">
        {children}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-[4px] bg-forest px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1e3320] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </section>
  );
}
