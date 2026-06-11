# Phase 2 Customer Migration — Verification & Security Report

**Date:** 2026-06-11 · **Scope:** Phases 2A–2F (customer auth, profile/password, Google OAuth, checkout, recommendations, frontend retargeting). Admin, uploads, payments NOT in scope and verified untouched.
**References applied:** OWASP Top 10, OWASP API Security Top 10, NestJS security guidance (Helmet/CORS/CSRF/rate-limiting).

## 1–2. Scope & what was tested

Automated batteries against the live API + real PostgreSQL (all test rows deleted afterwards), code inspection of every Phase 2 file, dependency audits, TypeScript/lint/builds for both apps, and grep-based sweeps (raw SQL, localStorage, passwordHash, secrets, old-route references, admin diffs).

## 3. Functional verification results — ALL PASS

| Area | Result |
|---|---|
| Register / me / cookie attrs (httpOnly) | ✅ |
| Login email + BD phone (`+880…`→`01…`), invalid login generic 401 | ✅ (tested 2A + re-verified) |
| Duplicate email → 409 with old message | ✅ *(an apparent 400 was a test artifact — 1-char name failed validation first)* |
| Logout deletes DB session; **old token unusable after logout** | ✅ `customer:null` |
| Profile update (3-op transaction), password change incl. wrong-current 400 | ✅ (2B + re-verified) |
| Google OAuth routes, linking, dedupe, unverified-email rejection, open-redirect block | ✅ (2C battery, 9 cases) |
| Guest + authenticated checkout, totals math, charge fallback, snapshots, defaults | ✅ (2D battery, 12 cases) |
| Recommendations: fallback/personalized/cart, event tracking, dedupe, weights | ✅ (2E battery, 11 cases) |
| Frontend retargeting: 5 call-sites via api-client, CORS preflight, old routes alive | ✅ (2F) |

## 4–5. SQL injection / database safety — PASS

- 100 % Prisma query builder; the only `$queryRaw` is the tagged-template health ping (`SELECT 1`, no input). **No `$queryRawUnsafe` anywhere.**
- No string concatenation into queries; no user-controlled `orderBy` in Phase 2 code (recommendation ordering is hardcoded).
- Inputs validated by ported Zod schemas: IDs (length-bounded), anonymousId (`^[a-zA-Z0-9_-]{16,80}$` — 200-char value verified ignored), eventType (closed enum), quantity (int 1–99, coerce; `0/-5/2.5/100/"abc"/null` all → 400, verified live).
- Prisma exception filter maps P2002→409 / P2025→404 with generic messages; no stack/internals leak.

## 6. Access control / ownership — PASS

- `/customers/me/*` derive the customer **only** from the session cookie (CustomerGuard) — no customerId accepted from the body.
- **Mass-assignment tested live:** profile update with `isActive:false, role:"super_admin", passwordHash:"hacked", id:"other"` → all stripped by Zod (objects strip unknown keys), account unaffected.
- Google OAuth links only via (a) provider-id match or (b) **verified**-email match; second-Google-account conflict refused; Admin table never touched by any Phase 2 code path.
- Customer order-history endpoints were NOT added in Phase 2 (account pages still read via Next RSC with `requireCustomer`) — nothing new to protect. Public order-success lookup (order number as access token) is pre-existing Next behavior, unchanged, risk carried in the migration plan.

## 7. Auth / session / cookies — PASS (1 fix applied)

- Cookie `asp_customer_session`: httpOnly ✓ · `sameSite=lax` ✓ · `secure` in production ✓ · 30-day expiry ✓ · raw token never stored (sha256 hash in DB) ✓.
- Logout deletes the DB row → token dead for BOTH backends (verified).
- bcrypt cost 12 (unchanged); login failures are uniform `"Invalid email/phone or password."` for wrong-password AND nonexistent-user (verified both).
- No tokens in localStorage/sessionStorage (swept; sessionStorage only holds view-dedupe keys, localStorage only cart/consent — not auth).
- **FIXED:** the API silently fell back to the dev secret in production (`sessionSecret()`); now throws `NEXTAUTH_SECRET is required in production.` — parity with Next's `getSecret()`.

## 8. CSRF / CORS / rate limiting

- **CSRF — adequate via SameSite=Lax:** browsers do not attach lax cookies to cross-site POST/PUT, so register/login/logout/profile/password/checkout/events cannot ride the session cookie cross-site. Guest checkout needs no cookie (cross-site junk-order spam ≠ CSRF; mitigated by rate limiting + same risk existed in the old route). **Recommendation for production:** keep the same-domain proxy plan; optionally add Origin-header validation at the proxy. No CSRF-token framework needed at this stage.
- **CORS — PASS:** explicit `FRONTEND_ORIGIN` allow-list (never `*`), `credentials:true` only for it; preflight verified (`OPTIONS /orders` → 204 with correct origin + credentials).
- **Rate limiting — ADDED (fix):** `@nestjs/throttler`, global 100 req/min/IP; strict 10/min on register, login, password change. **Verified live: 11th rapid login attempt → 429.** Note: in-memory store (per-instance) — use proxy/WAF limits in production for multi-instance.

## 9. Checkout / order tampering — PASS (verified live)

Sent `grandTotal:1, subtotal:1, paymentStatus:"paid", orderStatus:"delivered", stockReduced:true` in checkout → all stripped; DB row showed server-computed `subtotal 420 / grand 430`, `unpaid`, `pending`, `stockReduced:false`. Payment can never be marked PAID by a client; transactionId is stored verbatim for admin manual verification (old behavior); admin stock/payment logic was NOT migrated (confirmed absent from `apps/api`).
**Hardening added:** checkout `items[]` now capped at 100 (old route was unbounded — verified 101 items → 400) and `bookId` length capped at 64.

## 10. Dependency audit — moderate only, documented

| App | Findings | Disposition |
|---|---|---|
| `apps/api` | 3 moderate — `@hono/node-server` serveStatic bypass (transitive via Prisma tooling; that middleware is unused at runtime) | Document; fix needs `--force` (breaking) — revisit on next Prisma upgrade |
| root | 5 moderate — same hono + `postcss <8.5.10` inside Next's bundled copy (build-time only) | Document; fix needs `--force` — revisit on next Next.js upgrade |

No high/critical. `npm audit fix --force` was NOT run (per instructions).

## 11. Firewall / production network recommendations

No deployment config exists in the repo (no Dockerfile/compose/nginx/Caddyfile) — recommendations only, nothing invented:

1. Expose only **80/443** publicly; reverse-proxy (nginx/Caddy) terminates TLS and routes `app.domain → :3000`, `api.domain or /backend/* → :4000`. Port 4000 must not be directly public.
2. PostgreSQL (5432) bound to localhost/private network only; never public.
3. Same-domain (or same-site subdomain) deployment so the session cookie is first-party; set `NODE_ENV=production` (enables `secure` cookies) and a real `NEXTAUTH_SECRET` (now enforced — API refuses to boot without it).
4. Proxy must forward `X-Forwarded-For` (ipHash) and `Origin`; enable proxy-level rate limiting/WAF for the auth endpoints as defense-in-depth over the in-process throttler.
5. Keep Helmet defaults (already enabled) and HSTS at the proxy.

## 12–14. Passed / failed / fixed

**Passed:** every functional and security check listed above. **Failed:** none outstanding.
**Fixed during verification (3 minimal changes):**
1. `customer-auth.service.ts` — production secret enforcement.
2. `checkout.schema.ts` — `items[]` ≤100, `bookId` ≤64 chars.
3. `app.module.ts` + auth/password controllers — `@nestjs/throttler` global 100/min, 10/min on register/login/password.

## 15. Remaining risks (documented, not blocking)

| Risk | Severity | Plan |
|---|---|---|
| Moderate dep advisories (hono, postcss — both effectively dormant) | low | next framework upgrades |
| In-memory throttler (per-instance) | low | proxy/WAF limits in production |
| Order-success page = order-number-as-token (pre-existing) | low | conscious sign-off at Phase 3/4 |
| Both servers required for customer flows (graceful degradation verified) | low | same-domain proxy + monitoring |
| Login timing oracle (bcrypt only runs when user exists — pre-existing parity) | very low | optional dummy-hash compare later |

## 16. Manual browser checklist

See `API_TESTING_GUIDE.md` → "Phase 2F browser checklist" (12 steps). Critical five: register→header shows name · logout→header resets · guest checkout→order-success · logged-in checkout→order has customerId in DB · recommendation sections render with Network tab showing `:4000` calls.

## 17. Verdict

**Phase 3 is safe to start.** All Phase 2 surfaces verified functionally and hardened; old Next.js paths intact as rollback; admin code byte-identical to last commit. Phase 3 prerequisites to decide first: upload storage location and admin cookie strategy (see migration plan §10).
