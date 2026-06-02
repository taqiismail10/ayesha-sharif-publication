"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings } from "lucide-react";
import {
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentPreferences
} from "@/lib/consent-client";

type EditableConsent = Omit<CookieConsentPreferences, "necessary" | "updatedAt">;

const defaultChoices: EditableConsent = {
  personalization: false,
  analytics: false,
  marketing: false
};

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [choices, setChoices] = useState<EditableConsent>(defaultChoices);

  useEffect(() => {
    const existing = readCookieConsent();
    setIsVisible(!existing);
    if (existing) {
      setChoices({
        personalization: existing.personalization,
        analytics: existing.analytics,
        marketing: existing.marketing
      });
    }
  }, []);

  function save(next: EditableConsent) {
    saveCookieConsent(next);
    setChoices(next);
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 shadow-[0_-18px_45px_rgba(16,35,63,0.14)] backdrop-blur">
      <div className="container-px mx-auto grid max-w-7xl gap-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-3">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy text-gold">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-extrabold text-navy">Cookie preferences</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Necessary cookies keep cart and sessions working. Personalization
              helps recommend books only after you allow it. Analytics and
              marketing are placeholders in this phase.
            </p>
            <Link
              href="/privacy-policy"
              className="mt-2 inline-flex text-sm font-bold text-navy underline decoration-gold decoration-2 underline-offset-4"
            >
              Read privacy policy
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[32rem]">
          <button
            type="button"
            onClick={() => save(defaultChoices)}
            className="focus-ring min-h-11 rounded-md border border-line bg-white px-4 py-2 text-sm font-extrabold text-navy"
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={() =>
              save({
                personalization: true,
                analytics: true,
                marketing: true
              })
            }
            className="focus-ring min-h-11 rounded-md bg-navy px-4 py-2 text-sm font-extrabold text-white"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gold bg-gold/10 px-4 py-2 text-sm font-extrabold text-navy"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Choices
          </button>
        </div>

        {isExpanded ? (
          <div className="rounded-md bg-page p-4 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ConsentRow label="Necessary" checked disabled />
              <ConsentRow
                label="Personalization"
                checked={choices.personalization}
                onChange={(checked) =>
                  setChoices((current) => ({
                    ...current,
                    personalization: checked
                  }))
                }
              />
              <ConsentRow
                label="Analytics"
                checked={choices.analytics}
                onChange={(checked) =>
                  setChoices((current) => ({ ...current, analytics: checked }))
                }
              />
              <ConsentRow
                label="Marketing"
                checked={choices.marketing}
                onChange={(checked) =>
                  setChoices((current) => ({ ...current, marketing: checked }))
                }
              />
            </div>
            <button
              type="button"
              onClick={() => save(choices)}
              className="focus-ring mt-4 min-h-11 rounded-md bg-emerald px-4 py-2 text-sm font-extrabold text-white"
            >
              Save choices
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConsentRow({
  label,
  checked,
  disabled = false,
  onChange
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-line bg-white p-3 text-sm font-bold text-navy">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 accent-emerald"
      />
      {label}
    </label>
  );
}
