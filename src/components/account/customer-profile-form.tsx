"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { CustomerActionState } from "@/app/(site)/account/actions";
import { AuthApiError, putAuth } from "@/lib/auth-api-client";
import type { DeliveryAreaOption } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldControl,
  FieldTextarea,
  FieldSelect
} from "@/components/ui/field";
import { FormSuccess } from "@/components/forms/form-success";

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
  const router = useRouter();
  const [state, setState] = useState<CustomerActionState>(initialState);
  const [isPending, setIsPending] = useState(false);
  const toast = useToast();
  const prevStateRef = useRef<CustomerActionState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await putAuth<{ message: string }>("/customers/me/profile", {
        displayName: formData.get("displayName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        defaultDistrict: formData.get("defaultDistrict"),
        defaultDeliveryArea: formData.get("defaultDeliveryArea"),
        defaultAddress: formData.get("defaultAddress"),
        marketingConsent: formData.get("marketingConsent") === "on",
        personalizationConsent:
          formData.get("personalizationConsent") === "on",
        preferredCategories: formData.getAll("preferredCategories").map(String),
        preferredTags: formData.getAll("preferredTags").map(String),
        preferredLanguages: formData.getAll("preferredLanguages").map(String)
      });
      setState({ success: result.message });
      router.refresh();
    } catch (caught) {
      setState({
        error:
          caught instanceof Error
            ? caught.message
            : "Could not update your profile. Please try again.",
        fieldErrors:
          caught instanceof AuthApiError ? caught.fieldErrors : undefined
      });
    } finally {
      setIsPending(false);
    }
  }

  useEffect(() => {
    const prev = prevStateRef.current;
    if (state.error && state.error !== prev.error) {
      toast.error({
        title: "Could not save profile",
        description: state.error
      });
    }
    if (state.success && state.success !== prev.success) {
      toast.success({
        title: "Profile saved",
        description: state.success
      });
    }
    prevStateRef.current = state;
  }, [state, toast]);

  const selectedCategories = new Set(
    arrayFromJson(customer.preferences?.preferredCategories)
  );
  const selectedTags = new Set(arrayFromJson(customer.preferences?.preferredTags));
  const selectedLanguages = new Set(
    arrayFromJson(customer.preferences?.preferredLanguages)
  );
  const readingPreferenceCount =
    selectedCategories.size + selectedTags.size + selectedLanguages.size;
  const privacyChoiceCount =
    Number(Boolean(customer.profile?.personalizationConsent)) +
    Number(Boolean(customer.profile?.marketingConsent));

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {state.error ? (
        <div role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      <FormSuccess message={state.success} />

      <section className="grid gap-4 rounded-lg border border-line/70 bg-page/50 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="text-base font-medium text-forest">Contact details</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            This is the information we use across your account and signed-in checkout.
          </p>
        </div>
        <Field
          name="displayName"
          error={state.fieldErrors?.displayName}
        >
          <FieldLabel htmlFor="customer-profile-displayName">Display name</FieldLabel>
          <FieldControl
            id="customer-profile-displayName"
            name="displayName"
            defaultValue={customer.profile?.displayName || customer.name}
            required
          />
          <FieldError />
        </Field>
        <Field
          name="phone"
          error={state.fieldErrors?.phone}
        >
          <FieldLabel htmlFor="customer-profile-phone">Phone</FieldLabel>
          <FieldControl
            id="customer-profile-phone"
            name="phone"
            defaultValue={customer.profile?.phone || customer.phone || ""}
            placeholder="01XXXXXXXXX"
          />
          <FieldError />
        </Field>
        <div className="sm:col-span-2">
          <Field
            name="email"
            error={state.fieldErrors?.email}
          >
            <FieldLabel htmlFor="customer-profile-email">Email</FieldLabel>
            <FieldControl
              id="customer-profile-email"
              name="email"
              type="email"
              defaultValue={customer.profile?.email || customer.email || ""}
            />
            <FieldError />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-line/70 bg-page/50 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h3 className="text-base font-medium text-forest">Delivery defaults</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Save your usual location details to make future orders quicker.
          </p>
        </div>
        <Field
          name="defaultDistrict"
          error={state.fieldErrors?.defaultDistrict}
        >
          <FieldLabel htmlFor="customer-profile-defaultDistrict">Default district</FieldLabel>
          <FieldControl
            id="customer-profile-defaultDistrict"
            name="defaultDistrict"
            defaultValue={customer.profile?.defaultDistrict || ""}
          />
          <FieldError />
        </Field>
        <Field
          name="defaultDeliveryArea"
          error={state.fieldErrors?.defaultDeliveryArea}
        >
          <FieldLabel htmlFor="customer-profile-defaultDeliveryArea">Default delivery area</FieldLabel>
          <FieldSelect
            id="customer-profile-defaultDeliveryArea"
            name="defaultDeliveryArea"
            defaultValue={customer.profile?.defaultDeliveryArea || ""}
          >
            <option value="">Choose delivery area</option>
            {deliveryOptions.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </FieldSelect>
          <FieldError />
        </Field>
        <div className="sm:col-span-2">
          <Field
            name="defaultAddress"
            error={state.fieldErrors?.defaultAddress}
          >
            <FieldLabel htmlFor="customer-profile-defaultAddress">Default address</FieldLabel>
            <FieldTextarea
              id="customer-profile-defaultAddress"
              name="defaultAddress"
              rows={4}
              defaultValue={customer.profile?.defaultAddress || ""}
            />
            <FieldError />
          </Field>
        </div>
      </section>

      <details className="group rounded-lg border border-line bg-white/70">
        <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg px-4 py-4 marker:hidden">
          <div>
            <h3 className="text-base font-medium text-forest">Reading preferences</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              Choose the categories, topics, and languages you want to hear more about.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-forest">
              {readingPreferenceCount > 0
                ? `${readingPreferenceCount} selected`
                : "Optional"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gold">
              Expand
            </p>
          </div>
        </summary>
        <div className="grid gap-5 border-t border-line/70 px-4 py-4">
          <Field
            name="preferredCategories"
            error={state.fieldErrors?.preferredCategories}
          >
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
            <FieldError />
          </Field>

          <Field
            name="preferredTags"
            error={state.fieldErrors?.preferredTags}
          >
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
            <FieldError />
          </Field>

          <Field
            name="preferredLanguages"
            error={state.fieldErrors?.preferredLanguages}
          >
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
            <FieldError />
          </Field>
        </div>
      </details>

      <details className="group rounded-lg border border-line bg-white/70">
        <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg px-4 py-4 marker:hidden">
          <div>
            <h3 className="text-base font-medium text-forest">Privacy and recommendations</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              Decide how the site personalizes recommendations and contacts you.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-forest">
              {privacyChoiceCount > 0
                ? `${privacyChoiceCount} enabled`
                : "Optional"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gold">
              Expand
            </p>
          </div>
        </summary>
        <div className="grid gap-3 border-t border-line/70 bg-page/35 px-4 py-4">
          <Field
            name="personalizationConsent"
            error={state.fieldErrors?.personalizationConsent}
          >
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
            <FieldError />
          </Field>
          <Field
            name="marketingConsent"
            error={state.fieldErrors?.marketingConsent}
          >
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                name="marketingConsent"
                defaultChecked={!!customer.profile?.marketingConsent}
                className="mt-1 h-4 w-4 accent-emerald"
              />
              <span>Allow occasional marketing messages from the publication team.</span>
            </label>
            <FieldError />
          </Field>
        </div>
      </details>

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
