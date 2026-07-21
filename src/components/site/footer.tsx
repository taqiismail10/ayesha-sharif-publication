import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { publicNav } from "@/lib/constants";
import { getFooterContent, getContactContent } from "@/lib/site-content";

const columnHeadingClass =
  "mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D4A574]";

const navLinkClass =
  "w-fit text-sm leading-[1.75] text-[rgba(245,241,232,0.76)] transition-colors duration-150 hover:text-[#D4A574]";

export async function Footer() {
  // Both columns now come from the DB (with constants as fallback)
  const [footer, contact, currentCustomer] = await Promise.all([
    getFooterContent(),
    getContactContent(),
    getCurrentCustomer(),
  ]);

  // WhatsApp href uses the editable contact.whatsapp field
  const whatsappHref = `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`;

  return (
    <footer
      role="contentinfo"
      className="site-footer relative z-10"
      style={{
        background: `
          radial-gradient(ellipse at 18% 15%, rgba(212,165,116,0.07) 0%, transparent 52%),
          radial-gradient(ellipse at 82% 88%, rgba(107,142,111,0.14) 0%, transparent 48%),
          #2D4A2B
        `,
        borderTop: "1px solid rgba(212, 165, 116, 0.14)",
      }}
    >
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-6 pt-10 sm:px-10 sm:pt-12 lg:px-16">

        {/* ── Main columns ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1.3fr_0.6fr_0.8fr_1fr] lg:gap-8 xl:gap-10">

          {/* Brand */}
          <div className="min-w-0">
            <Image
              src="/logo/logo-horizontal-light-transparent-trimmed.png"
              alt="Ayesha-Sharif Publication"
              width={1510}
              height={272}
              sizes="152px"
              loading="lazy"
              className="h-auto w-[152px] object-contain"
            />
            <p
              className="mt-3 text-sm leading-[1.65] text-[rgba(245,241,232,0.76)]"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
            >
              {footer.tagline}
            </p>
            <p className="mt-2 text-sm leading-[1.65] text-[rgba(245,241,232,0.60)]">
              {footer.description}
            </p>
            <a
              href={whatsappHref}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[rgba(245,241,232,0.76)] transition-colors duration-150 hover:text-[#D4A574]"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden="true" />
              {footer.whatsappLabel}
            </a>
          </div>

          {/* Explore — kept as static nav (site structure links) */}
          <div>
            <h3 className={columnHeadingClass}>Explore</h3>
            <nav className="flex flex-col" aria-label="Site navigation">
              {publicNav.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info — now reads from footer.infoLinks (DB-editable) */}
          <div>
            <h3 className={columnHeadingClass}>Info</h3>
            <nav className="flex flex-col" aria-label="Policy links">
              {footer.infoLinks.map((item, i) => (
                <Link key={i} href={item.href} className={navLinkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact — now reads from contact content (DB-editable) */}
          <div>
            <h3 className={columnHeadingClass}>Contact</h3>
            <div className="flex flex-col gap-3">
              {contact.phone && (
                <p className="flex items-center gap-2.5 text-sm leading-snug text-[rgba(245,241,232,0.68)]">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-[#D4A574]" aria-hidden="true" />
                  <span>{contact.phone}</span>
                </p>
              )}
              {contact.email && (
                <p className="flex items-center gap-2.5 text-sm leading-snug text-[rgba(245,241,232,0.68)]">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#D4A574]" aria-hidden="true" />
                  <span>{contact.email}</span>
                </p>
              )}
              {contact.address && (
                <p className="flex items-start gap-2.5 text-sm leading-snug text-[rgba(245,241,232,0.68)]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4A574]" aria-hidden="true" />
                  <span>{contact.address}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className="mb-4 mt-8"
          style={{ height: "1px", backgroundColor: "rgba(245, 241, 232, 0.12)" }}
          aria-hidden="true"
        />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col gap-2 text-xs text-[rgba(245,241,232,0.48)] sm:flex-row sm:items-center sm:justify-between">
          <p>{footer.copyright}</p>
          {!currentCustomer ? (
            <Link
              href="/admin/login"
              className="w-fit transition-colors duration-150 hover:text-[#D4A574]"
            >
              Admin Login
            </Link>
          ) : null}
        </div>

      </div>
    </footer>
  );
}
