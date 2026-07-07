"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { Eye, Send, Save } from "lucide-react";
import {
  publishPolicyAction,
  savePolicyDraftAction,
  type PolicyActionState,
} from "@/app/admin/(protected)/policies/actions";
import { useToast } from "@/components/ui/toast";

const initialState: PolicyActionState = {};

export function PolicyEditorForm({
  policy,
}: {
  policy: {
    slug: string;
    title: string;
    content: string;
  };
}) {
  const [draftState, saveDraft, isSaving] = useActionState(
    savePolicyDraftAction,
    initialState,
  );
  const [publishState, publish, isPublishing] = useActionState(
    publishPolicyAction,
    initialState,
  );
  const toast = useToast();

  useEffect(() => {
    if (!draftState.requestId) return;
    if (draftState.success) toast.success(draftState.message ?? "Draft saved.");
    else if (draftState.error) toast.error(draftState.error);
  }, [draftState, toast]);

  useEffect(() => {
    if (!publishState.requestId) return;
    if (publishState.success) toast.success(publishState.message ?? "Policy published.");
    else if (publishState.error) toast.error(publishState.error);
  }, [publishState, toast]);

  const state = publishState.requestId ? publishState : draftState;
  const pending = isSaving || isPublishing;

  return (
    <form className="grid gap-5">
      <input type="hidden" name="slug" value={policy.slug} />

      <label className="grid gap-1.5" htmlFor="policy-title">
        <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
          Policy title
        </span>
        <input
          id="policy-title"
          name="title"
          required
          maxLength={160}
          defaultValue={policy.title}
          className="form-input"
          autoComplete="off"
        />
      </label>

      <label className="grid gap-1.5" htmlFor="policy-content">
        <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
          Policy content
        </span>
        <textarea
          id="policy-content"
          name="content"
          defaultValue={policy.content}
          rows={18}
          maxLength={100000}
          className="form-input min-h-[360px] resize-y leading-7"
          aria-describedby="policy-content-help"
        />
        <span id="policy-content-help" className="text-[11px] leading-5 text-gray-soft">
          Separate paragraphs with a blank line. Content is rendered as plain text for safety.
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="rounded-md bg-sage/10 px-3 py-2 text-sm text-sage">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
        <Link
          href={`/admin/policies/${policy.slug}/preview`}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-forest transition-colors duration-150 hover:border-sage hover:bg-cream"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          Preview saved draft
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            formAction={saveDraft}
            disabled={pending}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-sage bg-white px-4 py-2 text-sm font-medium text-forest transition-colors duration-150 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="submit"
            formAction={publish}
            disabled={pending}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-forest px-5 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#1e3320] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}
