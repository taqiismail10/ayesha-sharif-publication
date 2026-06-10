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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <div
        className="pointer-events-auto mx-auto grid max-h-[calc(100vh-2rem)] w-full max-w-[980px] gap-4 overflow-y-auto rounded-[8px] border p-4 shadow-[0_18px_44px_rgba(45,74,43,0.16)] backdrop-blur sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
        style={{
          backgroundColor: "rgba(245, 241, 232, 0.97)",
          borderColor: "rgba(212, 165, 116, 0.22)",
        }}
      >
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-forest text-gold">
            <Cookie className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-forest">Cookie preferences</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Cookies keep carts and sessions working. Optional personalization
              can improve book recommendations.
            </p>
            <Link
              href="/privacy-policy"
              className="mt-1 inline-flex text-sm font-medium text-forest underline decoration-gold decoration-2 underline-offset-4"
            >
              Read privacy policy
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[27rem]">
          <button
            type="button"
            onClick={() => save(defaultChoices)}
            className="focus-ring min-h-11 rounded-[6px] border border-[rgba(176,168,156,0.35)] bg-transparent px-4 py-2 text-sm font-semibold text-forest transition-colors duration-150 hover:border-gold hover:bg-white/35"
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
            className="focus-ring min-h-11 rounded-[6px] bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-sage"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="focus-ring col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-gold bg-transparent px-4 py-2 text-sm font-semibold text-forest transition-colors duration-150 hover:bg-gold/10 sm:col-span-1"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Choices
          </button>
        </div>

        {isExpanded ? (
          <div className="rounded-[8px] border border-[rgba(176,168,156,0.18)] bg-white/35 p-4 lg:col-span-2">
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
              className="focus-ring mt-4 min-h-11 rounded-[6px] bg-sage px-4 py-2 text-sm font-semibold text-white"
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
    <label className="flex items-center gap-2 rounded-[6px] border border-[rgba(176,168,156,0.24)] bg-[#F5F1E8] p-3 text-sm font-medium text-forest">
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
