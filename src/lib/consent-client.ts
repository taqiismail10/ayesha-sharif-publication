"use client";

export type CookieConsentPreferences = {
  necessary: true;
  personalization: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const COOKIE_CONSENT_KEY = "asp_cookie_consent";
export const ANONYMOUS_RECOMMENDATION_KEY = "asp_anon_reco_id";
export const COOKIE_CONSENT_EVENT = "asp_cookie_consent_changed";

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    return {
      necessary: true,
      personalization: !!parsed.personalization,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(
  preferences: Omit<CookieConsentPreferences, "necessary" | "updatedAt">
) {
  if (typeof window === "undefined") return;
  const next: CookieConsentPreferences = {
    necessary: true,
    ...preferences,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(next));
  if (!next.personalization) {
    window.localStorage.removeItem(ANONYMOUS_RECOMMENDATION_KEY);
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function getAnonymousRecommendationId() {
  if (typeof window === "undefined") return null;
  const consent = readCookieConsent();
  if (!consent?.personalization) return null;
  const existing = window.localStorage.getItem(ANONYMOUS_RECOMMENDATION_KEY);
  if (existing) return existing;
  const next = window.crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_RECOMMENDATION_KEY, next);
  return next;
}

export function peekAnonymousRecommendationId() {
  if (typeof window === "undefined") return null;
  const consent = readCookieConsent();
  if (!consent?.personalization) return null;
  return window.localStorage.getItem(ANONYMOUS_RECOMMENDATION_KEY);
}
