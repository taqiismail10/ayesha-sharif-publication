"use client";

/**
 * Checkout draft autosave
 * -----------------------
 * Persists the in-progress checkout form fields to localStorage so a
 * customer who reloads or returns later does not lose their details.
 *
 * Stored shape (versioned so future schema changes can be handled):
 *
 *   {
 *     v: 1,
 *     savedAt: <iso date string>,
 *     fields: { customerName, customerPhone, … }
 *   }
 *
 * Conventions:
 * - Key prefix is `asp_*` (project-wide).
 * - JSON only; never write a raw object.
 * - The browser is the source of truth — we never call a server.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export const CHECKOUT_DRAFT_KEY = "asp_checkout_draft_v1";
export const CHECKOUT_DRAFT_DEBOUNCE_MS = 600;
/** Drafts older than this are ignored on restore. */
export const CHECKOUT_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type CheckoutDraftFields = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  district?: string;
  shippingAddress?: string;
  deliveryArea?: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
};

type StoredDraft = {
  v: 1;
  savedAt: string;
  fields: CheckoutDraftFields;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Load the persisted draft from localStorage. Returns null if nothing
 * is stored, the stored JSON is invalid, the schema version does not
 * match, or the draft has expired.
 */
export function loadCheckoutDraft(): CheckoutDraftFields | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed || parsed.v !== 1 || !parsed.fields || !parsed.savedAt) {
      return null;
    }
    const savedAt = Date.parse(parsed.savedAt);
    if (Number.isNaN(savedAt)) return null;
    if (Date.now() - savedAt > CHECKOUT_DRAFT_TTL_MS) {
      // Best-effort cleanup so we do not leak expired entries.
      window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      return null;
    }
    return parsed.fields;
  } catch {
    return null;
  }
}

/**
 * Persist the supplied fields immediately. Silent on quota / privacy
 * errors — drafts are a convenience, not a guarantee.
 */
export function saveCheckoutDraft(fields: CheckoutDraftFields): void {
  if (!isBrowser()) return;
  try {
    const payload: StoredDraft = {
      v: 1,
      savedAt: new Date().toISOString(),
      fields
    };
    window.localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // ignore — quota, private mode, or storage disabled
  }
}

/** Remove the persisted draft (called after a successful order). */
export function clearCheckoutDraft(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch {
    // ignore
  }
}

/* ─────────────────────────────────── hook ── */

/**
 * useCheckoutDraftAutosave
 * ------------------------
 * Wires a form element to the draft store:
 *
 *   const { draftRestored, clearDraft } = useCheckoutDraftAutosave(formRef);
 *
 * - On mount: reads any stored draft and writes its values into the
 *   form via FormData-style field lookups (skipping fields whose
 *   defaultValue is non-empty, so logged-in customers keep their
 *   profile defaults).
 * - On every input/change event inside the form, debounces a save
 *   by `CHECKOUT_DRAFT_DEBOUNCE_MS`.
 * - `draftRestored` is true once an existing draft was found and
 *   applied, so the host can show a "Draft restored" hint.
 *
 * The hook is intentionally small and tolerant: a missing ref, an
 * unmounted form, or a localStorage error should never break checkout.
 */
export function useCheckoutDraftAutosave(
  formRef: React.RefObject<HTMLFormElement | null>
): {
  draftRestored: boolean;
  savedAt: string | null;
  clearDraft: () => void;
} {
  const [draftRestored, setDraftRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const debounceTimer = useRef<number | null>(null);

  // Restore on mount.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const stored = loadCheckoutDraft();
    if (!stored) return;

    // Apply values only to fields that are empty / absent.
    let applied = false;
    (Object.entries(stored) as [string, string | undefined][]).forEach(
      ([name, value]) => {
        if (value === undefined || value === "") return;
        const field = form.elements.namedItem(name);
        if (!field) return;
        // RadioNodeList if shared name; handle the common single-input case.
        if (field instanceof HTMLInputElement) {
          if (field.type === "radio") {
            const same = form.querySelector<HTMLInputElement>(
              `input[type="radio"][name="${name}"][value="${CSS.escape(value)}"]`
            );
            if (same && !same.checked) {
              same.checked = true;
              same.dispatchEvent(new Event("change", { bubbles: true }));
              applied = true;
            }
            return;
          }
          if (field.value === "" || field.value == null) {
            field.value = value;
            applied = true;
          }
          return;
        }
        if (field instanceof HTMLTextAreaElement) {
          if (field.value === "") {
            field.value = value;
            applied = true;
          }
          return;
        }
        if (field instanceof HTMLSelectElement) {
          if (field.value !== value) {
            // Only apply if the option actually exists in the select.
            const hasOption = Array.from(field.options).some(
              (opt) => opt.value === value
            );
            if (hasOption) {
              field.value = value;
              field.dispatchEvent(new Event("change", { bubbles: true }));
              applied = true;
            }
          }
        }
      }
    );

    if (applied) setDraftRestored(true);
  }, [formRef]);

  // Wire input/change listeners for autosave.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const collect = (): CheckoutDraftFields => {
      const data = new FormData(form);
      const fields: CheckoutDraftFields = {};
      for (const [key, value] of data.entries()) {
        if (typeof value === "string") {
          (fields as Record<string, string>)[key] = value;
        }
      }
      return fields;
    };

    const scheduleSave = () => {
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = window.setTimeout(() => {
        const fields = collect();
        saveCheckoutDraft(fields);
        setSavedAt(new Date().toISOString());
        debounceTimer.current = null;
      }, CHECKOUT_DRAFT_DEBOUNCE_MS);
    };

    const events: (keyof HTMLElementEventMap)[] = ["input", "change"];
    events.forEach((evt) => form.addEventListener(evt, scheduleSave));

    return () => {
      events.forEach((evt) => form.removeEventListener(evt, scheduleSave));
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [formRef]);

  const clearDraft = useCallback(() => {
    clearCheckoutDraft();
    setSavedAt(null);
    setDraftRestored(false);
  }, []);

  return { draftRestored, savedAt, clearDraft };
}