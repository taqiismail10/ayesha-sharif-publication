# NestJS Backend Migration Plan

**Project:** Ayesha-Sharif Publication — book e-commerce platform
**Goal:** Replace the Next.js-embedded backend with a standalone NestJS API (`apps/api`), leaving Next.js as a pure frontend.
**Companion docs:** `API_ROUTE_MIGRATION_MAP.md` · `FRONTEND_API_USAGE_MAP.md` · `CLEANUP_RECOMMENDATIONS.md` · `API_FOUNDATION_SETUP.md`

---

## 1. Current Architecture Summary

```
┌──────────────────────────── Next.js 15 (port 3000) ───────────────────────────┐
│  (site) pages ──► RSC readers (lib/data.ts …) ──► Prisma ──► PostgreSQL       │
│  (site) client components ──► fetch /api/* route handlers ──► Prisma          │
│  (site) forms ──► Server Actions (account/actions.ts) ──► Prisma              │
│  admin pages ──► inline prisma queries + Server Actions (admin/actions.ts)    │
│  Auth: 2 cookie systems (admin HMAC stateless / customer DB sessions)         │
│  Cache: unstable_cache + revalidateTag/Path (Next-only mechanism)             │
└────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────── NestJS (port 4000) — Phase 0 done ────────────────┐
│  /health (real SELECT 1) · PrismaService (pg adapter) · CORS · helmet ·       │
│  cookie-parser · ValidationPipe · Prisma exception filter                     │
│  Shares prisma/schema.prisma via second generator → apps/api/generated/prisma │
└────────────────────────────────────────────────────────────────────────────────┘
```

- **Router:** App Router only — **no `pages/api`** exists.
- **Package manager:** npm. Root app and `apps/api` are separate packages (no workspaces yet).
- **DB:** PostgreSQL via Prisma 7 + `@prisma/adapter-pg`.
- **Validation:** Zod (`src/lib/validators.ts`). **Passwords:** bcryptjs (cost 12).
- **No `middleware.ts`** — auth enforced per page/action.

## 2. Next.js Backend/API Summary

Backend logic exists in **four shapes** (full route-by-route detail in `API_ROUTE_MIGRATION_MAP.md`):

| Shape | Location | Count |
|---|---|---|
| REST route handlers | `src/app/api/**/route.ts` | 7 |
| Server Actions | `src/app/admin/actions.ts` (14), `src/app/(site)/account/actions.ts` (5), `src/app/admin/(protected)/site-content/actions.ts` (3) | 22 |
| RSC data readers | `lib/data.ts` (4), `lib/recommendations.ts` (3), `lib/settings.ts` (1), `lib/site-content.ts` (3) | 11 |
| Inline Prisma in pages | 11 admin pages + 4 site pages (`account/orders`, `account/orders/[n]`, `account/profile`, `order-success/[n]`) | 15 pages |

Supporting server libs: `lib/auth.ts` (admin HMAC sessions), `lib/customer-auth.ts` (DB sessions), `lib/order-utils.ts` (order number + delivery charge), `lib/recommendation-events.ts` (consent-aware event writes), `lib/cache-invalidation.ts` + `cache-tags.ts` + `http-cache.ts` (Next caching), `lib/prisma.ts`, `lib/env.ts`.

## 3. Database / Prisma Summary

One schema: `prisma/schema.prisma` (15 models, 6 enums). Two generators: `client` (Next, root node_modules) + `apiClient` (NestJS, `apps/api/generated/prisma`). **No schema changes made in this phase.**

| Domain | Models | Used today? |
|---|---|---|
| Books/catalogue | `Book`, `Category`, `Tag`, `BookTag` | ✅ heavily |
| Authors/publishers | — (plain string columns on `Book`) | ✅ as strings only |
| Orders/checkout | `Order`, `OrderItem` | ✅ |
| Customers/auth | `Customer`, `CustomerProfile`, `CustomerSession`, `CustomerPreference` | ✅ |
| Admin/auth | `Admin` (roles: super_admin, admin, editor, order_manager) | ✅ |
| Recommendations | `CustomerBookEvent` | ✅ |
| Wishlist | `SavedBook` | ⚠️ read-only (counts in profile + admin customers); no add/remove UI |
| Marketing banners | `Banner` | ❌ unused by any UI |
| Settings/content | `SiteSetting` (keys: `delivery_charges`, `site_content.footer/contact/about`) | ✅ |
| Payments | — (enum fields on `Order`: `PaymentMethod`, `PaymentStatus`, `transactionId`) | ✅ manual only |

## 4. Detected Business Features

| Feature | Exists? | Implementation |
|---|---|---|
| Books/products | ✅ | Full CRUD (admin actions) + public catalogue/detail |
| Categories / Tags | ✅ | CRUD via admin actions; public filters |
| Authors / Publishers | ➖ | String fields on Book — no entities, no pages |
| Customers + auth | ✅ | Register/login (email or BD phone), profile, password change, DB sessions |
| Admin auth | ✅ | Email+password, HMAC cookie, 4 roles |
| Cart | ✅ client-only | **localStorage** (`lib/cart-client.ts`) — no server cart, nothing to migrate server-side |
| Wishlist | ⚠️ partial | `SavedBook` model + counts only; no add/remove feature |
| Checkout/orders | ✅ | Guest + logged-in checkout → `POST /api/orders`; totals computed server-side |
| Payment | ✅ manual | COD / bKash / Nagad / Rocket; customer enters `transactionId`; admin verifies. **No payment gateway.** |
| Admin dashboard | ✅ | Stats, books, orders (status+stock transactions), customers (read-only list), categories, tags, settings, site-content, CSV export, invoice print |
| Coupons/discounts | ➖ | Per-book `salePrice`/`discountPercent` only — no coupon system |
| Reviews | ❌ | Not implemented anywhere |
| Uploads | ✅ | Admin-only; local disk `public/uploads/books/`; images ≤5MB, sample PDFs ≤10MB |
| Search/filter/sort | ✅ | `getBooks` params: q, category, tag, status, min/max price, sort (newest/price/best-selling) |
| Recommendations | ✅ | Personalized (events + preferences), cart-based, similar-books; consent-aware anonymous tracking |
| Site content CMS | ✅ | Footer/contact/about editable via admin → `SiteSetting` |

## 5. Environment Variables (from example files only — no secrets)

**Root `.env.example` (Next.js):** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET` *(misnomer — NextAuth not used; signs admin tokens + hashes IPs)*, `NEXTAUTH_URL`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `UPLOAD_PROVIDER` ("local"), `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` *(placeholders, unused)*, `NEXT_PUBLIC_IMAGE_CDN_HOST` *(unused)*.

**`apps/api/.env.example` (NestJS):** `DATABASE_URL` (same DB), `API_PORT` (4000), `FRONTEND_ORIGIN` (CORS).

**⚠️ Unsafe pattern documented (not fixed in root):** real local `.env` files were found containing **duplicate `DATABASE_URL` lines** (an empty `DATABASE_URL=` near the top and the real value at the bottom). The empty first occurrence wins in some loaders — this silently disabled the API's DB connection until `apps/api/.env` was cleaned. Root `.env` still has the duplicate; left untouched per instructions, flagged as a manual step.

**Future (Phase 2/3):** API will need `SESSION_SECRET` (same value as `NEXTAUTH_SECRET` for cookie compatibility) and the frontend will need `NEXT_PUBLIC_API_URL` / `API_URL`.

## 6. Required NestJS Modules

Already built (Phase 0): `PrismaModule`, `HealthModule`, `common/filters`.
To build: `AdminAuthModule`, `CustomerAuthModule`, `BooksModule`, `CategoriesModule`, `TagsModule`, `OrdersModule`, `CustomersModule`, `RecommendationsModule`, `SettingsModule`, `SiteContentModule`, `UploadsModule`, plus `common/guards` (AdminRolesGuard, CustomerGuard, OptionalCustomerGuard) and `common/decorators` (@CurrentAdmin, @CurrentCustomer, @Roles). Contracts: port `lib/validators.ts` Zod schemas (recommend `nestjs-zod`).

## 7. Recommended Migration Order

1. **Phase 1 — Read-only public catalogue** (no auth, lowest risk): `GET /books/home`, `/books`, `/books/:slug`, `/books/:slug/similar`, `/settings/delivery-options`, `/site-content/*` + Next revalidation webhook. Point RSC pages at the API.
2. **Phase 2 — Anonymous writes + customer surface:** `POST /orders`, recommendations GET/POST, `POST /recommendations/events`, customer auth (register/login/logout/me), account pages data endpoints. Retarget the 5 client fetch sites.
3. **Phase 3 — Admin:** admin auth + guards, books/categories/tags CRUD, order management (transactional stock), CSV export, uploads (storage decision required first), settings + site-content, dashboard/list endpoints.
4. **Phase 4 — Cutover:** delete old routes/actions/libs, remove Prisma from Next, env renames, workspace conversion (optional).

## 8. Risks

| # | Risk | Severity |
|---|---|---|
| 1 | `updateOrderAction` stock-adjustment transaction (`stockReduced` flag) — concurrency-sensitive; port with `$transaction` + tests | 🔴 |
| 2 | Next cache invalidation (`revalidateTag`) unreachable from NestJS — requires secret-protected `POST /api/revalidate` webhook in Next | 🔴 |
| 3 | Admin HMAC cookie format — change logs out all admins; replicate byte-for-byte or schedule forced re-login | 🔴 |
| 4 | Upload route writes to Next's `public/` — impossible cross-process; storage must move before Phase 3 | 🟠 |
| 5 | `Decimal` → number serialization (`serializeBookCard/Detail`) must match exactly | 🟠 |
| 6 | Server-action forms (admin + account) rely on Next redirects/`useActionState` — conversion is UI-touching; do it form-by-form | 🟠 |
| 7 | Duplicate `DATABASE_URL` pattern in root `.env` (see §5) | 🟡 |

## 9. Assumptions

1. Single shared PostgreSQL database for both backends during migration (verified working).
2. Local dev topology: Next 3000 + NestJS 4000, CORS with credentials; production will sit behind a same-domain proxy.
3. Cart stays client-side (localStorage) — no server cart module planned.
4. `Banner` and the wishlist feature (`SavedBook` add/remove) are out of migration scope unless requested.
5. Payment remains manual verification — no gateway integration during migration.
6. Frontend visual design is frozen during migration phases.

## 10. Manual Steps Needed (human decisions/actions)

1. **Fix root `.env` duplicate `DATABASE_URL`** (delete the empty first line) — user-owned file, not touched by automation.
2. **Decide upload storage** before Phase 3: shared volume vs S3-compatible vs Cloudinary (env placeholders already exist).
3. **Decide admin cookie strategy**: byte-compatible HMAC replication vs forced re-login at Phase 3 cutover.
4. **Provide `NEXTAUTH_SECRET` value to `apps/api/.env`** when Phase 2 starts (needed for IP hashing + admin token parity).
5. **Choose deployment proxy** (Next rewrites vs nginx/Caddy) before production cutover.
6. Confirm whether wishlist/`Banner` features should be built, kept dormant, or dropped from schema (Phase 4 decision).
