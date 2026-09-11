import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const CUSTOMER_SESSION_COOKIE = "asp_customer_session";

type CustomerProfile = {
  displayName: string | null;
  email: string | null;
  phone: string | null;
  defaultDistrict: string | null;
  defaultDeliveryArea: string | null;
  defaultAddress: string | null;
  marketingConsent: boolean;
  personalizationConsent: boolean;
};

type CustomerPreferences = {
  preferredCategories: unknown;
  preferredTags: unknown;
  preferredLanguages: unknown;
};

export type CurrentCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile: CustomerProfile | null;
  preferences: CustomerPreferences | null;
};

type CustomerMeResponse = {
  ok?: boolean;
  customer?: CurrentCustomer | null;
};

function apiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "");
}

/**
 * Resolve customer identity through NestJS. The browser session cookie is
 * forwarded to the API; Next.js does not query or mutate CustomerSession.
 */
export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const response = await fetch(`${apiBaseUrl()}/auth/customer/me`, {
      headers: { cookie: `${CUSTOMER_SESSION_COOKIE}=${sessionCookie.value}` },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as CustomerMeResponse;
    if (!data.customer) {
      // NestJS owns database cleanup and response cookie clearing. A server
      // component cannot safely mutate cookies during ordinary rendering.
      return null;
    }

    return data.customer;
  } catch {
    return null;
  }
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");
  return customer;
}

export function isSafeAccountRedirect(value?: string | null) {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/admin");
}
