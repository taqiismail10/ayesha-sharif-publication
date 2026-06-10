"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import {
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentPreferences
} from "@/lib/consent-client";

type EditableConsent = Omit<CookieConsentPreferences, "necessary" | "updatedAt">;

const defaults: EditableConsent = {
  personalization: false,
  analytics: false,
  marketing: false
};

export function CookieSettingsClient() {
  const [choices, setChoices] = useState<EditableConsent>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    if (existing) {
      setChoices({
        personalization: existing.personalization,
        analytics: existing.analytics,
        marketing: existing.marketing
      });
    }
  }, []);

  function save() {
    saveCookieConsent(choices);
    setSaved(true);
  }

  return (
    <div className="grid gap-4">
      {saved ? (
        <div className="rounded-md bg-sage/10 p-3 text-sm font-semibold text-sage">
          Cookie preferences saved.
        </div>
      ) : null}

      <ConsentToggle
        title="Necessary cookies"
        description="Required for cart storage, customer/admin sessions, security, and checkout."
        checked
        disabled
      />
      <ConsentToggle
        title="Personalization cookies"
        description="Allows anonymous recommendation ID and book interaction events for recommendations."
        checked={choices.personalization}
        onChange={(checked) =>
          setChoices((current) => ({ ...current, personalization: checked }))
        }
      />
      <ConsentToggle
        title="Analytics cookies"
        description="Placeholder for future first-party analytics. No analytics script is installed now."
        checked={choices.analytics}
        onChange={(checked) =>
          setChoices((current) => ({ ...current, analytics: checked }))
        }
      />
      <ConsentToggle
        title="Marketing cookies"
        description="Placeholder for future marketing preferences. No ad pixel is installed now."
        checked={choices.marketing}
        onChange={(checked) =>
          setChoices((current) => ({ ...current, marketing: checked }))
        }
      />

      <div className="grid gap-3 sm:flex">
        <button
          type="button"
          onClick={() => {
            setChoices(defaults);
            saveCookieConsent(defaults);
            setSaved(true);
          }}
          className="focus-ring min-h-11 rounded-md border border-line bg-white px-4 py-2 text-sm font-extrabold text-forest"
        >
          Reject all optional
        </button>
        <button
          type="button"
          onClick={save}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-sage px-4 py-2 text-sm font-extrabold text-white"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save preferences
        </button>
      </div>
    </div>
  );
}

function ConsentToggle({
  title,
  description,
  checked,
  disabled = false,
  onChange
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-line bg-white p-4">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-1 h-4 w-4 accent-sage"
      />
      <span>
        <span className="block font-extrabold text-forest">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-muted">{description}</span>
      </span>
    </label>
  );
}
