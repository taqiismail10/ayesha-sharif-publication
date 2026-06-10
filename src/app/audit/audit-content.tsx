"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";

const SCORES = [
  { label: "Architecture & code quality", sub: "Structure, separation, conventions", pct: 84, score: "8.4", grade: "g-good" },
  { label: "Data model", sub: "Schema integrity, indexing", pct: 87, score: "8.7", grade: "g-good" },
  { label: "Security & auth", sub: "Sessions, hashing, validation", pct: 71, score: "7.1", grade: "g-low" },
  { label: "UX & conversion flow", sub: "Browse → cart → checkout", pct: 70, score: "7.0", grade: "g-low" },
  { label: "Design consistency", sub: "Tokens, brand cohesion", pct: 50, score: "5.0", grade: "g-risk" },
  { label: "Documentation accuracy", sub: "Docs vs. shipped code", pct: 52, score: "5.2", grade: "g-risk" },
  { label: "Launch readiness", sub: "Placeholders, blockers, tests", pct: 60, score: "6.0", grade: "g-low" },
] as const;

const STATS = [
  { n: "11", l: "Prisma models", l2: "(6 added post-MVP)" },
  { n: "4", l: "Payment methods", l2: "COD · bKash · Nagad · Rocket" },
  { n: "4", l: "Admin roles", l2: "super · admin · editor · order-mgr" },
  { n: "0", l: "Automated tests", l2: "in this snapshot" },
] as const;

const STRENGTHS = [
  { title: "Server-validated checkout", text: "The server re-reads every book — status, stock, price — before creating an order. Cart data from the browser is never trusted. Exactly right." },
  { title: "Disciplined stock state machine", text: <>Stock reduces on admin confirm, restores on pre-delivery cancel, and a <Code>stockReduced</Code> flag prevents double-counting.</> },
  { title: "Clean auth separation", text: "Admin and customer auth are fully separate — distinct cookies, distinct helpers, no privilege bleed between them." },
  { title: "Privacy-conscious by default", text: "Hashed session tokens, hashed IPs, and personalization that only begins after explicit consent. Thoughtful for a small shop." },
  { title: "Zod validation everywhere", text: "Checkout, book/category/tag forms, and customer flows all validate with shared schemas — including Bangladeshi phone normalization." },
  { title: "Graceful sample-data fallback", text: "The storefront renders from sample data when no database is configured, so the catalogue previews before infra is ready." },
] as const;

const PALETTE_EDITORIAL = [
  { bg: "#6B8E6F", name: "sage" },
  { bg: "#2D4A2B", name: "forest" },
  { bg: "#F5F1E8", name: "cream", dark: true },
  { bg: "#D4A574", name: "gold" },
  { bg: "#B0A89C", name: "gray" },
];

const PALETTE_ORIGINAL = [
  { bg: "#10233F", name: "navy" },
  { bg: "#0F766E", name: "emerald" },
  { bg: "#F7F1E3", name: "cream", dark: true },
  { bg: "#C9A227", name: "gold" },
  { bg: "#B42318", name: "danger" },
];

const PALETTE_CHECKOUT = [
  { bg: "#10233F", name: "bg-navy" },
  { bg: "#0F766E", name: "bg-emerald" },
  { bg: "#D4A574", name: "ring-gold" },
  { bg: "#B42318", name: "danger" },
  { bg: "#6B7280", name: "muted" },
];

function Code({ children }: { children: React.ReactNode }) {
  return <code className="audit-code">{children}</code>;
}

function Ref({ children }: { children: React.ReactNode }) {
  return <span className="audit-ref">{children}</span>;
}

function Swatch({ colors }: { colors: typeof PALETTE_EDITORIAL }) {
  return (
    <div className="audit-sw">
      {colors.map((c) => (
        <div key={c.name} style={{ background: c.bg }}>
          <span
            className="audit-nm"
            style={c.dark ? { color: "#5a5d53", textShadow: "none" } : undefined}
          >
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AuditContent() {
  const progressRef = useRef<HTMLDivElement>(null);
  const scorecardRef = useRef<HTMLDivElement>(null);
  const barsFilledRef = useRef(false);

  const onScroll = useCallback(() => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? h.scrollTop / max : 0;
    if (progressRef.current) {
      progressRef.current.style.width = `${p * 100}%`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    const card = scorecardRef.current;
    if (!card) return;

    const bars = card.querySelectorAll<HTMLSpanElement>(".audit-bar > span");
    const widths: string[] = [];
    bars.forEach((b) => {
      widths.push(b.style.width);
      b.style.width = "0";
    });

    const fill = () => {
      if (barsFilledRef.current) return;
      barsFilledRef.current = true;
      bars.forEach((b, i) => {
        b.style.width = widths[i];
      });
    };

    if (!("IntersectionObserver" in window)) {
      fill();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fill();
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(card);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* ── Top bar ── */}
      <div className="audit-topbar">
        <div className="audit-wrap audit-topbar-row">
          <Image
            src="/logo/logo-horizontal-forest-transparent-trimmed.png"
            alt="Ayesha-Sharif Publication"
            width={160}
            height={26}
            style={{ height: 26, width: "auto" }}
            priority
          />
          <span className="audit-tag">Codebase &amp; Product Audit</span>
        </div>
        <div className="audit-progress" ref={progressRef} />
      </div>

      {/* ── Hero ── */}
      <header className="audit-wrap audit-hero">
        <div className="audit-kicker">Independent Review · June 2026</div>
        <h1>
          An <em>honest read</em> of the
          <br />
          Ayesha-Sharif storefront.
        </h1>
        <p className="audit-lede">
          A code-grounded audit of the bookstore platform — its architecture,
          data model, security posture, design consistency, and how close it
          really is to launch. Findings are drawn directly from the source, not
          the docs.
        </p>

        <div className="audit-meta">
          <div>
            <div className="k">Product</div>
            <div className="v">Bangladeshi book commerce</div>
          </div>
          <div>
            <div className="k">Stack</div>
            <div className="v">Next.js 15 · Prisma 7 · PG</div>
          </div>
          <div>
            <div className="k">Scope reviewed</div>
            <div className="v">~60 source files</div>
          </div>
          <div>
            <div className="k">Stage</div>
            <div className="v">MVP, pre-launch</div>
          </div>
        </div>

        <div className="audit-verdict">
          <div className="audit-badge">
            Solid Core
            <small>NOT YET LAUNCH-READY</small>
          </div>
          <p>
            The engineering foundation is <strong>genuinely strong</strong> —
            clean auth separation, server-validated checkout, a sound stock
            model. But the project has{" "}
            <strong>outgrown its own documentation</strong>, its{" "}
            <strong>
              design tokens have fragmented into three conflicting sources
            </strong>
            , and a handful of <strong>real launch blockers</strong> remain
            (placeholder contacts, no stored merchant payment numbers). Fixable
            in days, not weeks.
          </p>
        </div>
      </header>

      {/* ── Scorecard ── */}
      <section className="audit-section">
        <div className="audit-wrap">
          <div className="audit-shead">
            <div className="audit-num">01 — HEALTH AT A GLANCE</div>
            <h2>Scorecard</h2>
            <p>
              A subjective but code-grounded rating across the dimensions that
              decide whether this ships well. Higher is better.
            </p>
          </div>

          <div className="audit-scorecard" ref={scorecardRef}>
            {SCORES.map((s) => (
              <div key={s.label} className="audit-score-row">
                <div className="audit-label">
                  {s.label}
                  <small>{s.sub}</small>
                </div>
                <div className="audit-bar">
                  <span className={s.grade} style={{ width: `${s.pct}%` }} />
                </div>
                <div className="audit-val">
                  {s.score}
                  <small>/10</small>
                </div>
              </div>
            ))}
          </div>

          <div className="audit-legend">
            <span className="audit-chip">
              <span className="audit-dot d-crit" />
              Critical
            </span>
            <span className="audit-chip">
              <span className="audit-dot d-high" />
              High
            </span>
            <span className="audit-chip">
              <span className="audit-dot d-med" />
              Medium
            </span>
            <span className="audit-chip">
              <span className="audit-dot d-low" />
              Low / polish
            </span>
            <span className="audit-chip">
              <span className="audit-dot d-win" />
              Strength
            </span>
          </div>
        </div>
      </section>

      {/* ── What this product is ── */}
      <section className="audit-section">
        <div className="audit-wrap">
          <div className="audit-shead">
            <div className="audit-num">02 — CONTEXT</div>
            <h2>What this product is</h2>
            <p>
              A low-budget MVP e-commerce bookstore for a new Bangladeshi
              publishing house, built around a deliberately <em>manual</em>{" "}
              fulfillment model — admins verify payments and confirm orders by
              hand, by design.
            </p>
          </div>

          <div className="audit-stats">
            {STATS.map((s) => (
              <div key={s.l} className="audit-stat">
                <div className="audit-n">{s.n}</div>
                <div className="audit-l">
                  {s.l}
                  <br />
                  {s.l2}
                </div>
              </div>
            ))}
          </div>

          <div className="audit-finding low" style={{ marginTop: 26 }}>
            <div className="audit-body">
              <p>
                The core business rule is sound and consistently enforced:{" "}
                <strong>
                  stock is reduced only when an admin confirms an order
                </strong>
                , and restored if a confirmed order is cancelled before delivery.
                Checkout never trusts cart prices or stock from the browser — the
                server re-reads every book from the database before creating an
                order. This is the right instinct for a money-handling app, and
                it&#39;s implemented well.
              </p>
            </div>
            <div className="audit-reflist">
              <Ref>api/orders</Ref>
              <Ref>lib/order-utils.ts</Ref>
              <Ref>checkoutSchema · Zod</Ref>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Findings ── */}
      <section className="audit-section">
        <div className="audit-wrap">
          <div className="audit-shead">
            <div className="audit-num">03 — KEY FINDINGS</div>
            <h2>What needs attention</h2>
            <p>
              Ordered by severity. Each is grounded in specific files in the
              current snapshot.
            </p>
          </div>

          <div className="audit-findings">
            {/* F-01 */}
            <article className="audit-finding high">
              <div className="audit-fhead">
                <span className="audit-fid">F-01</span>
                <span className="audit-sev high">High</span>
                <h3>
                  The design system has split into three conflicting palettes
                </h3>
              </div>
              <div className="audit-body">
                <p>
                  There are{" "}
                  <strong>three separate definitions of the brand colors</strong>
                  , and they no longer agree. The CSS and Tailwind config have
                  migrated to a warm <em>editorial</em> identity (sage / forest /
                  cream / soft-gold), but <Code>lib/constants.ts</Code> still
                  exports the <em>original</em> navy / emerald / amber-gold brand
                  object — now effectively dead, yet still imported as the source
                  of truth in places.
                </p>
                <p>
                  The visible cost: the{" "}
                  <strong>checkout page still renders the old brand</strong> —{" "}
                  <Code>bg-navy</Code> headings, an <Code>bg-emerald</Code>{" "}
                  &#34;Place order&#34; button, <Code>focus:ring-gold</Code> at
                  the old gold value — while the homepage, header, and cards
                  around it are sage-and-forest. The brand visibly changes at the
                  single most important step of the funnel.
                </p>
              </div>
              <div className="audit-impact">
                <b>Impact:</b> A premium, trust-driven brand reads as
                inconsistent exactly where trust matters most — the payment
                screen. Cheap to fix, disproportionately damaging if left.
              </div>
              <div className="audit-reflist">
                <Ref>tailwind.config.ts</Ref>
                <Ref>app/globals.css</Ref>
                <Ref>lib/constants.ts → brand.colors</Ref>
                <Ref>checkout-page-client.tsx</Ref>
              </div>
            </article>

            {/* F-02 */}
            <article className="audit-finding high">
              <div className="audit-fhead">
                <span className="audit-fid">F-02</span>
                <span className="audit-sev high">High</span>
                <h3>
                  Admin sessions can&#39;t be revoked; customer sessions can
                </h3>
              </div>
              <div className="audit-body">
                <p>
                  Customer auth is done the careful way: DB-backed sessions, only
                  a SHA-256 <em>hash</em> of the token stored, IP hashed for
                  privacy, server-side expiry and revocation on logout. Admin auth
                  — the higher-privilege surface — is the opposite: a{" "}
                  <strong>stateless signed token</strong> with no server record.
                  There is no way to revoke a compromised or stolen admin session
                  before its 7-day expiry, and no &#34;log out everywhere.&#34;
                </p>
                <p>
                  Secondary: the development fallback secret{" "}
                  <Code>
                    &#34;development-only-change-this-secret&#34;
                  </Code>{" "}
                  is reused for customer IP hashing <em>without</em> the
                  production guard that admin signing has — so a misconfigured
                  prod deploy fails safe for admins but silently weak for customer
                  IP hashing.
                </p>
              </div>
              <div className="audit-impact">
                <b>Impact:</b> The most sensitive role has the least containable
                session model. The fix is small — store an admin session row and
                check it in <Code>getCurrentAdmin()</Code>.
              </div>
              <div className="audit-reflist">
                <Ref>lib/auth.ts</Ref>
                <Ref>lib/customer-auth.ts</Ref>
                <Ref>NEXTAUTH_SECRET fallback</Ref>
              </div>
            </article>

            {/* F-03 */}
            <article className="audit-finding crit">
              <div className="audit-fhead">
                <span className="audit-fid">F-03</span>
                <span className="audit-sev crit">Launch blocker</span>
                <h3>
                  Customers can&#39;t actually pay — merchant numbers don&#39;t
                  exist anywhere
                </h3>
              </div>
              <div className="audit-body">
                <p>
                  The manual payment flow tells the buyer to &#34;send payment to
                  the merchant bKash/Nagad/Rocket number shown on the invoice,
                  then enter your transaction ID.&#34; But{" "}
                  <strong>no merchant number is stored</strong> in constants,
                  settings, or the schema — the instruction points at information
                  that isn&#39;t there. A customer choosing mobile payment reaches
                  a dead end.
                </p>
                <p>
                  Alongside it, every public contact value is still a placeholder:{" "}
                  <Code>+8801XXXXXXXXX</Code>,{" "}
                  <Code>hello@ayeshasharif.com</Code>, &#34;Office address,
                  Dhaka, Bangladesh.&#34; These ship straight to the footer and
                  contact page.
                </p>
              </div>
              <div className="audit-impact">
                <b>Impact:</b> Hard blocker. Mobile payment is unusable and the
                business is unreachable. Must be resolved before any real traffic.
              </div>
              <div className="audit-reflist">
                <Ref>lib/constants.ts → paymentInstructions</Ref>
                <Ref>defaultContact</Ref>
                <Ref>SiteSetting</Ref>
              </div>
            </article>

            {/* F-04 */}
            <article className="audit-finding med">
              <div className="audit-fhead">
                <span className="audit-fid">F-04</span>
                <span className="audit-sev med">Medium</span>
                <h3>
                  Top-level docs describe a product that no longer exists
                </h3>
              </div>
              <div className="audit-body">
                <p>
                  Both <Code>README.md</Code> and{" "}
                  <Code>LLM_PROJECT_CONTEXT.md</Code> state plainly:{" "}
                  <em>
                    &#34;No customer accounts, login, wishlist, reviews… by
                    design.&#34;
                  </em>{" "}
                  The shipped code has a{" "}
                  <strong>full customer-account system</strong> — registration,
                  DB-backed login, profiles, saved books, preferences,
                  consent-gated personalized recommendations, and behavioral
                  event tracking. (This expansion <em>is</em> documented, but
                  only in a separate phase plan the headline docs never
                  reference.)
                </p>
              </div>
              <div className="audit-impact">
                <b>Impact:</b> Any new contributor — or AI assistant — reading the
                canonical docs will build on false assumptions. Reconcile the
                headline docs with reality.
              </div>
              <div className="audit-reflist">
                <Ref>README.md → MVP notes</Ref>
                <Ref>LLM_PROJECT_CONTEXT.md §19</Ref>
                <Ref>vs. schema.prisma (Customer…)</Ref>
              </div>
            </article>

            {/* F-05 */}
            <article className="audit-finding med">
              <div className="audit-fhead">
                <span className="audit-fid">F-05</span>
                <span className="audit-sev med">Medium</span>
                <h3>Uploads write to the local filesystem</h3>
              </div>
              <div className="audit-body">
                <p>
                  Cover, gallery, and sample-PDF uploads are written to{" "}
                  <Code>public/uploads/books</Code>. On most modern hosts
                  (serverless or multi-instance) that directory is ephemeral or
                  per-instance — files vanish on redeploy or are missing on other
                  nodes. The team has flagged this in the visual-asset guide, but
                  it remains wired as the default{" "}
                  <Code>UPLOAD_PROVIDER=local</Code>.
                </p>
              </div>
              <div className="audit-impact">
                <b>Impact:</b> Silent data loss for admin-uploaded media in
                production. Move to Cloudinary / S3 / R2 before scaling beyond
                one persistent instance.
              </div>
              <div className="audit-reflist">
                <Ref>api/admin/upload</Ref>
                <Ref>UPLOAD_PROVIDER=local</Ref>
              </div>
            </article>

            {/* F-06 */}
            <article className="audit-finding med">
              <div className="audit-fhead">
                <span className="audit-fid">F-06</span>
                <span className="audit-sev med">Medium</span>
                <h3>Money flows through zero automated tests</h3>
              </div>
              <div className="audit-body">
                <p>
                  This snapshot contains no tests. The areas that most deserve
                  them are precisely the ones with the most business logic:
                  total/discount/delivery calculation, the
                  confirm-reduces-stock / cancel-restores-stock state machine,
                  and checkout&#39;s server-side revalidation. These are correct
                  today; nothing guards them against the next refactor.
                </p>
              </div>
              <div className="audit-impact">
                <b>Impact:</b> Regressions in pricing or stock would be invisible
                until a customer or admin hits them. A thin layer of unit tests on{" "}
                <Code>order-utils</Code> and the order state transitions would buy
                outsized safety.
              </div>
              <div className="audit-reflist">
                <Ref>lib/order-utils.ts</Ref>
                <Ref>admin/actions.ts → order status</Ref>
              </div>
            </article>

            {/* F-07 */}
            <article className="audit-finding low">
              <div className="audit-fhead">
                <span className="audit-fid">F-07</span>
                <span className="audit-sev low">Low / polish</span>
                <h3>The homepage hero runs many always-on animations</h3>
              </div>
              <div className="audit-body">
                <p>
                  The hero layers several infinite CSS keyframe loops — pattern
                  drift, gold sweep, glow breathe, floating book cards, ribbon
                  shine — running continuously. Reduced-motion is partially
                  respected in the header&#39;s scroll logic, but the decorative
                  loops in <Code>globals.css</Code> aren&#39;t all gated behind{" "}
                  <Code>prefers-reduced-motion</Code>, and continuous animation is
                  a battery/CPU cost on mobile.
                </p>
              </div>
              <div className="audit-impact">
                <b>Impact:</b> Minor. Gate decorative loops behind{" "}
                <Code>@media (prefers-reduced-motion: no-preference)</Code> and
                consider pausing off-screen.
              </div>
              <div className="audit-reflist">
                <Ref>globals.css → hero-* keyframes</Ref>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Palette Deep Dive ── */}
      <section className="audit-section">
        <div className="audit-wrap">
          <div className="audit-shead">
            <div className="audit-num">04 — DESIGN DEEP DIVE</div>
            <h2>Three palettes, one brand</h2>
            <p>
              The clearest way to see F-01: here are the three color definitions
              living in the codebase right now, and which one the user actually
              sees.
            </p>
          </div>

          <div className="audit-pal-grid">
            <div className="audit-pal">
              <div className="audit-pal-h">
                <div className="audit-src">tailwind.config.ts + globals.css</div>
                <h4>Editorial tokens</h4>
                <div className="audit-note">
                  The current visual identity — homepage, header, cards, buttons.
                </div>
                <span className="audit-status st-live">
                  Live · what users see
                </span>
              </div>
              <Swatch colors={PALETTE_EDITORIAL} />
            </div>

            <div className="audit-pal">
              <div className="audit-pal-h">
                <div className="audit-src">
                  lib/constants.ts → brand.colors
                </div>
                <h4>Original brand object</h4>
                <div className="audit-note">
                  Still exported as canonical brand. No longer matches the
                  rendered site.
                </div>
                <span className="audit-status st-stale">Stale · drifted</span>
              </div>
              <Swatch colors={PALETTE_ORIGINAL} />
            </div>

            <div className="audit-pal">
              <div className="audit-pal-h">
                <div className="audit-src">checkout-page-client.tsx</div>
                <h4>What checkout renders</h4>
                <div className="audit-note">
                  Uses the old tokens directly — navy headings, emerald CTA —
                  mid-funnel.
                </div>
                <span className="audit-status st-mixed">
                  Mixed · inconsistent
                </span>
              </div>
              <Swatch colors={PALETTE_CHECKOUT} />
            </div>
          </div>

          <div className="audit-finding high" style={{ marginTop: 24 }}>
            <div className="audit-body">
              <p>
                <b
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    color: "var(--forest)",
                  }}
                >
                  The fix is consolidation, not redesign.
                </b>{" "}
                Pick the editorial palette as the single source of truth, delete
                or remap <Code>brand.colors</Code>, and sweep the admin +
                checkout surfaces off the legacy <Code>navy/emerald</Code>{" "}
                Tailwind tokens. One token layer, referenced everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Docs vs Reality ── */}
      <section className="audit-section">
        <div className="audit-wrap">
          <div className="audit-shead">
            <div className="audit-num">05 — DOCUMENTATION DRIFT</div>
            <h2>What the docs say vs. what the code does</h2>
            <p>
              The headline documentation was written for the original guest-only
              MVP and never caught up with the customer-accounts phase.
            </p>
          </div>

          <div className="audit-diff">
            <div className="audit-chead">
              <div>The docs say…</div>
              <div>The code does…</div>
            </div>
            <div className="audit-drow">
              <div className="audit-cell says">
                <span className="t">
                  &#34;No customer accounts… by design&#34;
                </span>
                Guest-only checkout, no login or registration.
              </div>
              <div className="audit-cell does">
                <span className="t">Full account system</span>
                Registration, DB-backed login, profiles, password change, saved
                books.
              </div>
            </div>
            <div className="audit-drow">
              <div className="audit-cell says">
                <span className="t">
                  &#34;No wishlist, reviews, loyalty&#34;
                </span>
                Listed as out of scope.
              </div>
              <div className="audit-cell does">
                <span className="t">SavedBook model</span>A wishlist in all but
                name — <Code>SavedBook</Code> join per customer.
              </div>
            </div>
            <div className="audit-drow">
              <div className="audit-cell says">
                <span className="t">No personalization mentioned</span>
                Catalogue is the same for everyone.
              </div>
              <div className="audit-cell does">
                <span className="t">Recommendation engine</span>
                Consent-gated personalized recs + behavioral event tracking.
              </div>
            </div>
            <div className="audit-drow">
              <div className="audit-cell says">
                <span className="t">
                  Brand: navy / cream / gold / emerald
                </span>
                Per LLM_PROJECT_CONTEXT §2.
              </div>
              <div className="audit-cell does">
                <span className="t">
                  Brand: sage / forest / cream / soft-gold
                </span>
                Editorial repaint in Tailwind + CSS.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Strengths ── */}
      <section className="audit-section">
        <div className="audit-wrap">
          <div className="audit-shead">
            <div className="audit-num">06 — CREDIT WHERE DUE</div>
            <h2>What&#39;s genuinely well built</h2>
            <p>
              This is not a troubled codebase. The fundamentals are above the bar
              for an MVP, and several choices are better than they needed to be.
            </p>
          </div>

          <div className="audit-wins">
            {STRENGTHS.map((s) => (
              <div key={s.title} className="audit-win">
                <div className="audit-mk">✓</div>
                <div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section className="audit-section">
        <div className="audit-wrap">
          <div className="audit-shead">
            <div className="audit-num">07 — RECOMMENDATIONS</div>
            <h2>A path to launch</h2>
            <p>
              Sequenced by urgency. The left lane is the difference between
              &#34;demo&#34; and &#34;open for orders.&#34;
            </p>
          </div>

          <div className="audit-road">
            <div className="audit-lane now">
              <div className="audit-lh">
                <div className="audit-when">Before any real traffic</div>
                <h4>Fix now</h4>
              </div>
              <ul>
                <li>
                  <b>Store merchant payment numbers</b> and surface them on the
                  checkout/invoice so mobile payment actually works{" "}
                  <Ref>F-03</Ref>
                </li>
                <li>
                  <b>Replace all placeholder contacts</b> — phone, WhatsApp,
                  email, address <Ref>F-03</Ref>
                </li>
                <li>
                  <b>Consolidate to one palette</b> and repaint checkout off
                  navy/emerald <Ref>F-01</Ref>
                </li>
              </ul>
            </div>

            <div className="audit-lane scale">
              <div className="audit-lh">
                <div className="audit-when">Before scaling up</div>
                <h4>Harden</h4>
              </div>
              <ul>
                <li>
                  <b>Make admin sessions revocable</b> — back them with a DB row
                  like customer sessions <Ref>F-02</Ref>
                </li>
                <li>
                  <b>Move uploads to object storage</b> (Cloudinary / S3 / R2){" "}
                  <Ref>F-05</Ref>
                </li>
                <li>
                  <b>Unit-test pricing &amp; stock</b> transitions before the
                  next refactor <Ref>F-06</Ref>
                </li>
                <li>
                  <b>Reconcile README &amp; context docs</b> with the accounts
                  phase <Ref>F-04</Ref>
                </li>
              </ul>
            </div>

            <div className="audit-lane later">
              <div className="audit-lh">
                <div className="audit-when">Quality &amp; polish</div>
                <h4>Refine</h4>
              </div>
              <ul>
                <li>
                  <b>Gate decorative hero animations</b> behind reduced-motion;
                  pause off-screen <Ref>F-07</Ref>
                </li>
                <li>
                  <b>Add real WebP covers &amp; banner</b> per the visual-asset
                  guide
                </li>
                <li>
                  <b>
                    Delete the dead <Code>brand.colors</Code>
                  </b>{" "}
                  export once nothing references it
                </li>
                <li>
                  <b>Tighten OG/SEO assets</b> — point Open Graph at the
                  optimized banner
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="audit-footer">
        <div className="audit-wrap">
          <div>
            <Image
              src="/logo/logo-horizontal-light-transparent-trimmed.png"
              alt="Ayesha-Sharif Publication"
              width={180}
              height={30}
              style={{ height: 30, width: "auto", opacity: 0.92 }}
            />
            <p style={{ marginTop: 12, maxWidth: 520 }}>
              An independent, code-grounded audit of the Ayesha-Sharif
              Publication storefront. Findings reflect the reviewed snapshot and
              are advisory, not exhaustive.
            </p>
          </div>
          <p className="audit-mono">
            Audit · June 2026
            <br />
            Next.js 15 · Prisma 7 · PostgreSQL
          </p>
        </div>
      </footer>
    </>
  );
}
