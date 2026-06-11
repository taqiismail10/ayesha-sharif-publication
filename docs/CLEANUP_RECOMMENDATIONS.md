# Cleanup Recommendations

**Nothing is deleted yet.** This is the inventory of what becomes removable as migration phases complete. Every row stays `No` until its replacement is verified in production-like testing; rows flip phase-by-phase, never in bulk.

## Next.js backend code (removable after the phase that replaces it)

| File/folder | Why it may be unnecessary | Delete now? | Risk level | Reason |
|---|---|---|---|---|
| `src/app/api/health/route.ts` | NestJS `/health` already superior (real DB ping) | **No** | 🟢 low | Harmless duplicate; remove in Phase 4 sweep. May be referenced by uptime monitors — check before removal. |
| `src/app/api/orders/route.ts` | Replaced by `POST /orders` (Phase 2) | **No** | 🔴 high | Revenue path. Remove only after checkout E2E passes against NestJS. |
| `src/app/api/account/me/route.ts` | Replaced by `GET /auth/customer/me` (Phase 2) | **No** | 🟠 med | Header on every page depends on it. |
| `src/app/api/recommendations/route.ts` | Replaced by recommendations module (Phase 2) | **No** | 🟡 low | Sections fail gracefully. |
| `src/app/api/recommendation-events/route.ts` | Replaced (Phase 2) | **No** | 🟡 low | Fire-and-forget. |
| `src/app/api/admin/upload/route.ts` | Replaced by `POST /admin/uploads` (Phase 3) | **No** | 🟠 med | Blocked on storage decision; old uploads in `public/uploads/books/` must keep serving. |
| `src/app/api/admin/orders/export/route.ts` | Replaced by CSV endpoint (Phase 3) | **No** | 🟡 low | |
| `src/app/admin/actions.ts` | All 14 actions become admin REST endpoints (Phase 3) | **No** | 🔴 high | Contains the stock-transaction logic; last to go. |
| `src/app/admin/(protected)/site-content/actions.ts` | Becomes `PUT /admin/site-content/*` (Phase 3) | **No** | 🟡 low | |
| `src/app/(site)/account/actions.ts` | Becomes customer auth/profile endpoints (Phase 2) | **No** | 🔴 high | Auth path. |
| `src/lib/auth.ts` | Admin sessions move to NestJS (Phase 3) | **No** | 🔴 high | Cookie-format compatibility decision pending. |
| `src/lib/customer-auth.ts` | Customer sessions move to NestJS (Phase 2) | **No** | 🔴 high | |
| `src/lib/data.ts` | Readers become `GET /books*` etc. (Phase 1) | **No** | 🟠 med | Serializers must be ported byte-exact first. |
| `src/lib/recommendations.ts`, `src/lib/recommendation-events.ts` | Move to RecommendationsModule (Phase 2) | **No** | 🟡 low | |
| `src/lib/settings.ts`, `src/lib/site-content.ts` | Move to Settings/SiteContent modules (Phase 1) | **No** | 🟡 low | |
| `src/lib/order-utils.ts` | Moves into OrdersModule (Phase 2) | **No** | 🟠 med | Order-number format must stay identical. |
| `src/lib/prisma.ts`, `src/lib/env.ts` | Next stops touching the DB (Phase 4) | **No** | 🔴 high | Needed until ALL pages read from the API. |
| `src/lib/http-cache.ts`, `cache-tags.ts`, `cache-invalidation.ts` | Caching moves to fetch-cache + revalidation webhook | **No** | 🟠 med | Webhook must exist first; `cache-tags` likely survives in the webhook handler. |
| `src/lib/validators.ts` | Splits: server schemas → API/contracts; client-side stays | **No** | 🟠 med | Partial removal only — checkout form validates client-side too. |
| `prisma/` folder + root `prisma`/`@prisma/*`/`pg`/`bcryptjs` deps | Next stops owning the DB (Phase 4) | **No** | 🔴 high | Shared schema is the API's source of truth; relocation is a Phase 4 task with the dual-generator block updated. |

## Database models (decision needed, not code cleanup)

| File/folder | Why it may be unnecessary | Delete now? | Risk level | Reason |
|---|---|---|---|---|
| `Banner` model (schema.prisma) | No UI reads or writes it anywhere | **No** | 🟡 low | Confirm with owner: build feature later vs drop in a Phase 4 migration. |
| `SavedBook` model | Only counted (profile stats, admin customers list); no add/remove UI | **No** | 🟡 low | Either build wishlist or accept dormant model. Counts ARE displayed — dropping it breaks two pages. |

## Environment / config

| File/folder | Why it may be unnecessary | Delete now? | Risk level | Reason |
|---|---|---|---|---|
| Root `.env` duplicate `DATABASE_URL=` empty line | Confusing duplicate; already broke the API once | **No (manual)** | 🟠 med | User-owned file — flagged as manual step in the migration plan §10. |
| `CLOUDINARY_*`, `NEXT_PUBLIC_IMAGE_CDN_HOST`, `UPLOAD_PROVIDER` env keys | Declared but no code reads them | **No** | 🟢 low | Likely useful for the Phase 3 storage decision — keep. |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` names | Misnomers (NextAuth unused) | **No** | 🟠 med | Rename only at Phase 4 (`SESSION_SECRET`, `SITE_URL`) with deploy-env coordination. |
| `DIRECT_URL` env key | Schema has no `directUrl` field; nothing reads it | **No** | 🟢 low | Verify hosting provider doesn't expect it (e.g. pooled vs direct connections) before removing from example. |

## Miscellaneous

| File/folder | Why it may be unnecessary | Delete now? | Risk level | Reason |
|---|---|---|---|---|
| `src/app/audit/` (audit-content.tsx, audit.css …) | Internal design-audit page; not linked from the site | **No** | 🟢 low | Dev tooling; owner call. Unrelated to backend migration. |
| `src/lib/sample-data.ts` | Demo/no-DB fallback data | **No** | 🟡 low | Part of the "works without DB" mode; drop together with that mode (Phase 4 decision). |
| `src/components/home/premium-hero.tsx` | Unmounted since homepage redesign (replaced by `hero-section.tsx`) | **No** | 🟢 low | Frontend, not backend — listed for completeness only. Verify no imports first. |

## Cleanup sequencing rule

A row may flip to `Yes` only when: (1) its replacement endpoint is `migrated` in `API_ROUTE_MIGRATION_MAP.md`, (2) every consumer in `FRONTEND_API_USAGE_MAP.md` has been retargeted, and (3) a full regression of the affected flow passed. Phase 4 performs the actual deletions in one reviewed commit per area.
