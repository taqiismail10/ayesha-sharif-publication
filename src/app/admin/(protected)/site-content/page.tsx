import { FileText, Link2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_FOOTER_CONTENT } from "@/lib/site-content";
import {
  getAdminAboutContent,
  getAdminContactContent,
  getAdminFooterContent,
} from "@/lib/admin-content";
import { ContentFormSection } from "@/components/admin/content-form-section";
import {
  updateFooterContentAction,
  updateContactContentAction,
  updateAboutContentAction,
} from "./actions";

export const dynamic = "force-dynamic";

/* ── Shared field helpers ──────────────────────────────────────────────────── */

function Field({
  name,
  label,
  defaultValue = "",
  textarea = false,
  rows = 3,
  hint,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  textarea?: boolean;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={rows}
          placeholder={placeholder}
          className="form-input resize-y"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="form-input"
        />
      )}
      {hint && <span className="text-[11px] text-gray-soft">{hint}</span>}
    </label>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default async function SiteContentPage() {
  await requireAdmin(["super_admin", "admin"]);

  const [footer, contact, about] = await Promise.all([
    getAdminFooterContent(),
    getAdminContactContent(),
    getAdminAboutContent(),
  ]);

  // Ensure we always have 4 info link rows to render, filling gaps with defaults
  const infoRows = Array.from({ length: 4 }, (_, i) => ({
    label: footer.infoLinks[i]?.label ?? DEFAULT_FOOTER_CONTENT.infoLinks[i]?.label ?? "",
    href:  footer.infoLinks[i]?.href  ?? DEFAULT_FOOTER_CONTENT.infoLinks[i]?.href  ?? "",
  }));

  return (
    <div>
      {/* Page header */}
      <div className="mb-7">
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cream text-gold">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="font-serif text-2xl font-normal text-forest">
            Site Content
          </h1>
        </div>
        <p className="text-[13px] text-gray-soft">
          Edit public-facing text for the footer, contact page, and about page.
          Changes apply immediately to the live site.
        </p>
      </div>

      <div className="grid gap-5">

        {/* ── Section 1: Footer text ── */}
        <ContentFormSection
          title="Footer — Brand Text"
          description="Tagline, description, WhatsApp label, and copyright shown at the bottom of every page."
          action={updateFooterContentAction}
        >
          <Field
            name="tagline"
            label="Tagline"
            defaultValue={footer.tagline}
            hint="Short italic line below the logo."
          />
          <Field
            name="description"
            label="Description"
            defaultValue={footer.description}
            textarea
            rows={2}
            hint="Second paragraph below the tagline."
          />
          <Field
            name="whatsappLabel"
            label="WhatsApp link label"
            defaultValue={footer.whatsappLabel}
          />
          <Field
            name="copyright"
            label="Copyright line"
            defaultValue={footer.copyright}
            hint='Shown in the bottom bar. Example: "© 2026 Ayesha-Sharif Publication."'
          />

          {/* ── Info links (same form, same save action) ── */}
          <div className="mt-2 border-t border-[rgba(176,168,156,0.2)] pt-4">
            <div className="mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-sage" aria-hidden="true" />
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-soft">
                Footer Info / Policy Links
              </span>
            </div>
            <p className="mb-3 text-[11px] text-gray-soft">
              These appear in the <strong>Info</strong> column of the footer.
              Change the label text or destination URL for each link.
            </p>
            <div className="grid gap-3">
              {infoRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr] gap-2">
                  <label className="grid gap-1">
                    <span className="text-[11px] font-medium text-gray-soft">
                      Link {i + 1} — Label
                    </span>
                    <input
                      name={`infoLabel_${i}`}
                      defaultValue={row.label}
                      placeholder={`e.g. Delivery Policy`}
                      className="form-input text-sm"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-[11px] font-medium text-gray-soft">
                      Link {i + 1} — URL / Path
                    </span>
                    <input
                      name={`infoHref_${i}`}
                      defaultValue={row.href}
                      placeholder={`e.g. /delivery-policy`}
                      className="form-input text-sm"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </ContentFormSection>

        {/* ── Section 2: Contact details (also controls footer Contact column) ── */}
        <ContentFormSection
          title="Contact Details"
          description="Controls both the /contact page and the Contact column in the footer."
          action={updateContactContentAction}
        >
          {/* Small callout so admins know this feeds the footer too */}
          <div className="rounded-[4px] bg-sage/8 px-3 py-2 text-[12px] text-sage">
            💡 Phone, Email, and Address below also appear in the <strong>Contact</strong> column of the site footer.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="pageTitle"
              label="Contact page title"
              defaultValue={contact.pageTitle}
            />
            <Field
              name="pageSubtitle"
              label="Contact page subtitle"
              defaultValue={contact.pageSubtitle}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="phone"
              label="Phone number"
              defaultValue={contact.phone}
              placeholder="+8801XXXXXXXXX"
            />
            <Field
              name="whatsapp"
              label="WhatsApp number"
              defaultValue={contact.whatsapp}
              placeholder="+8801XXXXXXXXX"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="email"
              label="Email address"
              defaultValue={contact.email}
              placeholder="hello@example.com"
            />
            <Field
              name="facebookText"
              label="Facebook display text"
              defaultValue={contact.facebookText}
            />
          </div>
          <Field
            name="address"
            label="Office address"
            defaultValue={contact.address}
            hint="Also shown in the footer Contact column."
          />
        </ContentFormSection>

        {/* ── Section 3: About page ── */}
        <ContentFormSection
          title="About Page"
          description="Badge label, heading, and body text shown on the /about page."
          action={updateAboutContentAction}
        >
          <Field
            name="badge"
            label="Badge / label text"
            defaultValue={about.badge}
            hint='Small pill above the heading. Example: "Small publishing house"'
          />
          <Field
            name="title"
            label="Page heading"
            defaultValue={about.title}
          />
          <Field
            name="description"
            label="Body description"
            defaultValue={about.description}
            textarea
            rows={4}
          />
        </ContentFormSection>

      </div>
    </div>
  );
}
