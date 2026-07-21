"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect } from "react";
import { CheckCircle2, Save } from "lucide-react";
import {
  updateHomepageContentAction,
  updateHomepageFeaturesAction,
  type ContentActionState,
} from "@/app/admin/(protected)/site-content/actions";
import {
  HOMEPAGE_ICON_OPTIONS,
  type HomepageContent,
} from "@/lib/homepage-content-definitions";
import { useToast } from "@/components/ui/toast";

const initialState: ContentActionState = {};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[rgba(176,168,156,0.25)] bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-[rgba(176,168,156,0.2)] pb-4">
        <h2 className="text-[15px] font-semibold text-forest">{title}</h2>
        <p className="mt-1 text-[13px] text-gray-soft">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  maxLength,
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  maxLength?: number;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5" htmlFor={name}>
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
        {label}
      </span>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        maxLength={maxLength}
        required={required}
        className="form-input"
      />
      {hint ? <span className="text-[11px] text-gray-soft">{hint}</span> : null}
    </label>
  );
}

export function HomepageContentEditor({
  content,
}: {
  content: HomepageContent;
}) {
  const toast = useToast();
  const [heroState, saveHero, heroPending] = useActionState(
    updateHomepageContentAction,
    initialState,
  );
  const [featureState, saveFeatures, featurePending] = useActionState(
    updateHomepageFeaturesAction,
    initialState,
  );

  useEffect(() => {
    if (!heroState.requestId) return;
    if (heroState.success) {
      toast.success({
        title: "Homepage content saved",
        description: heroState.message ?? "Hero text updated.",
        duration: 2400,
      });
      return;
    }
    if (heroState.error) {
      toast.error({
        title: "Could not save homepage content",
        description: heroState.error,
      });
    }
  }, [heroState, toast]);

  useEffect(() => {
    if (!featureState.requestId) return;
    if (featureState.success) {
      toast.success({
        title: "Homepage features saved",
        description: featureState.message ?? "Feature strip updated.",
        duration: 2400,
      });
      return;
    }
    if (featureState.error) {
      toast.error({
        title: "Could not save homepage features",
        description: featureState.error,
      });
    }
  }, [featureState, toast]);

  const features = [...content.features].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="grid gap-5">
      <SectionCard
        title="Homepage Hero Content"
        description="Edit the eyebrow, subtitle, and supporting line shown in the landing page hero."
      >
        <form action={saveHero} className="grid gap-4">
          <Field
            name="heroEyebrow"
            label="Hero eyebrow"
            defaultValue={content.heroEyebrow}
            maxLength={80}
            hint="Optional. Example: EST. — BANGLADESHI LITERARY PRESS"
          />
          <Field
            name="heroSubtitle"
            label="Hero subtitle"
            defaultValue={content.heroSubtitle}
            maxLength={120}
            required
            hint="Required. This line appears directly under the Bengali headline."
          />
          <Field
            name="heroMeta"
            label="Hero meta line"
            defaultValue={content.heroMeta}
            maxLength={100}
            hint="Optional. Example: 400+ books · Free delivery above ৳500"
          />

          {heroState.error ? (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {heroState.error}
            </p>
          ) : null}

          <div className="flex justify-end border-t border-line/70 pt-5">
            <button
              type="submit"
              disabled={heroPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-[4px] bg-forest px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1e3320] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {heroPending ? "Saving…" : "Save hero content"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Homepage Feature Strip"
        description="Edit the small icon strip near the bottom of the homepage. Keep the layout intact by changing only the content and order."
      >
        <form action={saveFeatures} className="grid gap-4">
          <input type="hidden" name="featureCount" value={String(features.length)} />

          <div className="grid gap-3">
            {features.map((feature, index) => (
              <fieldset
                key={feature.id}
                className="grid gap-4 rounded-lg border border-line/70 bg-cream/50 p-4"
              >
                <legend className="px-1 text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
                  Feature {index + 1}
                </legend>
                <input type="hidden" name={`featureId_${index}`} value={feature.id} />
                <div className="grid gap-4 md:grid-cols-[1.3fr_0.9fr_0.6fr_0.6fr]">
                  <Field
                    name={`featureLabel_${index}`}
                    label="Label"
                    defaultValue={feature.label}
                    required={feature.enabled}
                    hint={feature.enabled ? "Required when enabled." : "Optional when disabled."}
                  />
                  <label className="grid gap-1.5" htmlFor={`featureIcon_${index}`}>
                    <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
                      Icon
                    </span>
                    <select
                      id={`featureIcon_${index}`}
                      name={`featureIcon_${index}`}
                      defaultValue={feature.iconKey}
                      className="form-input"
                    >
                      {HOMEPAGE_ICON_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5" htmlFor={`featureSortOrder_${index}`}>
                    <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
                      Sort order
                    </span>
                    <input
                      id={`featureSortOrder_${index}`}
                      name={`featureSortOrder_${index}`}
                      type="number"
                      defaultValue={feature.sortOrder}
                      className="form-input"
                    />
                  </label>
                  <label className="flex items-end gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-forest">
                    <input
                      id={`featureEnabled_${index}`}
                      name={`featureEnabled_${index}`}
                      type="checkbox"
                      defaultChecked={feature.enabled}
                      className="h-4 w-4 rounded border-line text-forest focus-ring"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </fieldset>
            ))}
          </div>

          {featureState.error ? (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {featureState.error}
            </p>
          ) : null}
          {featureState.success ? (
            <p role="status" className="rounded-md bg-sage/10 px-3 py-2 text-sm text-sage">
              {featureState.message}
            </p>
          ) : null}

          <div className="flex justify-end border-t border-line/70 pt-5">
            <button
              type="submit"
              disabled={featurePending}
              className="inline-flex min-h-11 items-center gap-2 rounded-[4px] bg-forest px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1e3320] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {featurePending ? "Saving…" : "Save feature strip"}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
