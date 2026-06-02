"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import {
  updateCustomerProfileAction,
  type CustomerActionState
} from "@/app/(site)/account/actions";
import type { DeliveryAreaOption } from "@/lib/constants";

type Option = {
  id: string;
  name: string;
};

type ProfileFormData = {
  name: string;
  email: string | null;
  phone: string | null;
  profile: {
    displayName: string | null;
    email: string | null;
    phone: string | null;
    defaultDistrict: string | null;
    defaultDeliveryArea: string | null;
    defaultAddress: string | null;
    marketingConsent: boolean;
    personalizationConsent: boolean;
  } | null;
  preferences: {
    preferredCategories: unknown;
    preferredTags: unknown;
    preferredLanguages: unknown;
  } | null;
};

const initialState: CustomerActionState = {};

function arrayFromJson(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export function CustomerProfileForm({
  customer,
  categories,
  tags,
  languages,
  deliveryOptions
}: {
  customer: ProfileFormData;
  categories: Option[];
  tags: Option[];
  languages: string[];
  deliveryOptions: DeliveryAreaOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    updateCustomerProfileAction,
    initialState
  );
  const selectedCategories = new Set(
    arrayFromJson(customer.preferences?.preferredCategories)
  );
  const selectedTags = new Set(arrayFromJson(customer.preferences?.preferredTags));
  const selectedLanguages = new Set(
    arrayFromJson(customer.preferences?.preferredLanguages)
  );

  return (
    <form action={formAction} className="grid gap-6">
      {state.error ? (
        <div className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-md bg-emerald/10 p-3 text-sm font-semibold text-emerald">
          {state.success}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="form-label">Display name</span>
          <input
            name="displayName"
            defaultValue={customer.profile?.displayName || customer.name}
            required
            className="form-input mt-1"
          />
        </label>
        <label>
          <span className="form-label">Phone</span>
          <input
            name="phone"
            defaultValue={customer.profile?.phone || customer.phone || ""}
            placeholder="01XXXXXXXXX"
            className="form-input mt-1"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="form-label">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={customer.profile?.email || customer.email || ""}
            className="form-input mt-1"
          />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="form-label">Default district</span>
          <input
            name="defaultDistrict"
            defaultValue={customer.profile?.defaultDistrict || ""}
            className="form-input mt-1"
          />
        </label>
        <label>
          <span className="form-label">Default delivery area</span>
          <select
            name="defaultDeliveryArea"
            defaultValue={customer.profile?.defaultDeliveryArea || ""}
            className="form-input mt-1"
          >
            <option value="">Choose delivery area</option>
            {deliveryOptions.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="form-label">Default address</span>
          <textarea
            name="defaultAddress"
            rows={4}
            defaultValue={customer.profile?.defaultAddress || ""}
            className="form-input mt-1"
          />
        </label>
      </section>

      <section className="grid gap-4">
        <div>
          <p className="form-label">Favorite categories</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="preferredCategories"
                  value={category.id}
                  defaultChecked={selectedCategories.has(category.id)}
                  className="h-4 w-4 accent-emerald"
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="form-label">Preferred tags</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="preferredTags"
                  value={tag.id}
                  defaultChecked={selectedTags.has(tag.id)}
                  className="h-4 w-4 accent-emerald"
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="form-label">Language preference</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {languages.map((language) => (
              <label key={language} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="preferredLanguages"
                  value={language}
                  defaultChecked={selectedLanguages.has(language)}
                  className="h-4 w-4 accent-emerald"
                />
                {language}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-md bg-page p-4">
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            name="personalizationConsent"
            defaultChecked={!!customer.profile?.personalizationConsent}
            className="mt-1 h-4 w-4 accent-emerald"
          />
          <span>
            Allow personalized book recommendations based on my profile,
            browsing events, cart events, and order history.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            name="marketingConsent"
            defaultChecked={!!customer.profile?.marketingConsent}
            className="mt-1 h-4 w-4 accent-emerald"
          />
          <span>Allow occasional marketing messages from the publication team.</span>
        </label>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald px-5 py-3 text-sm font-extrabold text-white disabled:bg-muted/40 sm:w-fit"
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
