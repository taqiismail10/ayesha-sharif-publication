# NestJS Backend Migration Plan

**Project:** Ayesha-Sharif Publication — book e-commerce platform
**Goal:** Extract all backend/API logic from the Next.js monolith into a standalone NestJS service, leaving Next.js as a pure frontend (RSC + client components) that talks to NestJS over HTTP.
**Status:** PLAN ONLY — no implementation yet.

---

## 1. Current Backend Summary

The backend currently lives **inside** the Next.js 15 App Router project in four distinct shapes:

| Shape | Where | Count | Notes |
|---|---|---|---|
| REST route handlers | `src/app/api/**/route.ts` | 7 routes | Used by client components via `fetch()` |
| Server Actions | `src/app/**/actions.ts` | 22 actions across 3 files | Used by forms (`useActionState` / `action=`) — admin CRUD, customer auth |
| RSC direct data readers | `src/lib/data.ts`, `recommendations.ts`, `settings.ts`, `site-content.ts` | ~11 reader functions | Server Components call Prisma directly at render time |
| Auth/session libraries | `src/lib/auth.ts`, `src/lib/customer-auth.ts` | — | Cookie creation/verification, role guards |

**Stack facts:**
- **Package manager:** npm (`package-lock.json`)
- **Database:** PostgreSQL via **Prisma 7** (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Validation:** Zod 3 (`src/lib/validators.ts`, 242 lines — checkout, book form, customer register/login/profile/password, category, tag, login schemas)
- **Password hashing:** bcryptjs (cost 12)
- **No middleware.ts** — auth enforcement happens per-page (`requireAdmin`) and per-action (`assertAdminRole`)
- **File uploads:** local disk → `public/uploads/books/` (UPLOAD_PROVIDER="local"; Cloudinary env vars exist but are unused placeholders)
- **Caching:** Next-specific `unstable_cache` + cache tags + `revalidatePath`/`revalidateTag` (`src/lib/cache-tags.ts`, `src/lib/cache-invalidation.ts`, `src/lib/http-cache.ts`)

### Auth systems (two separate ones)

| | Admin | Customer |
|---|---|---|
| Cookie | `asp_admin_session` | `asp_customer_session` |
| Mechanism | **Stateless** HMAC-SHA256-signed token (JWT-like, custom) | **Stateful** — random token, SHA-256 hash stored in `CustomerSession` table |
| Lifetime | 7 days | 30 days |
| Roles | `super_admin`, `admin`, `editor`, `order_manager` | n/a (single role) |
| Secret | `NEXTAUTH_SECRET` | `NEXTAUTH_SECRET` (for IP hashing only) |
| Extras | — | Stores userAgent + HMAC-hashed IP per session |

### Environment variables (`.env.example`)

```
DATABASE_URL, DIRECT_URL          → Prisma/PostgreSQL
NEXTAUTH_SECRET                   → HMAC signing + IP hashing (misnomer; NextAuth is NOT used)
NEXTAUTH_URL                      → metadataBase URL
ADMIN_SEED_EMAIL/PASSWORD         → prisma/seed.ts
UPLOAD_PROVIDER                   → "local" (Cloudinary vars present, unused)
CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET, NEXT_PUBLIC_IMAGE_CDN_HOST
```

---

## 2. All Detected Backend Routes & Actions

### 2a. REST API routes (`src/app/api/`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | Health check |
| POST | `/api/orders` | optional customer | Checkout: validates items/stock, computes totals + delivery charge, creates Order + OrderItems, records purchase events |
| GET | `/api/account/me` | customer cookie | Current customer summary (name/email/phone) for the header account menu |
| GET | `/api/recommendations?anonymousId=` | optional customer | Personalized recommendations (8 books) |
| POST | `/api/recommendations` | none | Cart-based recommendations (body: `bookIds[]`, returns 4) |
| POST | `/api/recommendation-events` | optional customer | Track book interaction events (view, add_to_cart, purchase, search_click, sample_open) |
| POST | `/api/admin/upload` | admin cookie | Multipart upload (JPG/PNG/WebP ≤5MB, PDF ≤10MB) → writes to `public/uploads/books/` |
| GET | `/api/admin/orders/export` | admin roles (super_admin, admin, order_manager) | Orders CSV export with q/orderStatus/paymentStatus filters |

### 2b. Server Actions — `src/app/admin/actions.ts` (admin)

| Action | Roles | Purpose |
|---|---|---|
| `loginAction` | public | Admin email+password login → HMAC cookie |
| `logoutAction` | admin | Clear admin cookie |
| `createBookAction` / `updateBookAction` | super_admin, admin, editor | Full book CRUD incl. tags relation rewrite |
| `archiveBookAction` | super_admin, admin, editor | Set status=archived |
| `deleteBookAction` | super_admin, admin | Hard delete (blocked if order items exist) |
| `createCategoryAction` / `updateCategoryAction` / `archiveCategoryAction` | super_admin, admin, editor | Category CRUD (archive = isActive:false) |
| `createTagAction` / `updateTagAction` / `archiveTagAction` | super_admin, admin, editor | Tag CRUD |
| `updateOrderAction` | super_admin, admin, order_manager | **Transactional** status update with stock decrement on confirm / re-increment on cancel (`stockReduced` flag) |
| `updateDeliverySettingsAction` | super_admin, admin | Upsert `SiteSetting` key `delivery_charges` |

### 2c. Server Actions — `src/app/admin/(protected)/site-content/actions.ts`

| Action | Roles | Purpose |
|---|---|---|
| `updateFooterContentAction` | super_admin, admin | Upsert `site_content.footer` (tagline, description, whatsappLabel, copyright, infoLinks[4]) |
| `updateContactContentAction` | super_admin, admin | Upsert `site_content.contact` (page title/subtitle, phone, whatsapp, email, facebookText, address) |
| `updateAboutContentAction` | super_admin, admin | Upsert `site_content.about` (badge, title, description) |

### 2d. Server Actions — `src/app/(site)/account/actions.ts` (customer)

| Action | Purpose |
|---|---|
| `registerCustomerAction` | Create Customer + Profile + Preferences, start session, handle P2002 conflicts |
| `loginCustomerAction` | Email-or-BD-phone login (phone normalization `01[3-9]\d{8}`), updates lastLoginAt |
| `logoutCustomerAction` | Delete session row + cookie |
| `updateCustomerProfileAction` | Transaction: Customer + CustomerProfile upsert + CustomerPreference upsert (consents, default address, preferred categories/tags/languages) |
| `changeCustomerPasswordAction` | Verify current → rehash |

### 2e. RSC direct data readers (no HTTP — Prisma at render time)

| Function | File | Used by |
|---|---|---|
| `getHomeData()` | `lib/data.ts` | Homepage (featured/newArrivals/bestSellers/categories) |
| `getBooks(params)` | `lib/data.ts` | Catalogue + search (q, category, tag, status, min/max price, sort) |
| `getBookBySlug(slug)` | `lib/data.ts` | Book detail (+related) |
| `getContactSettings()` | `lib/data.ts` | Contact page |
| `getSimilarBooks` / `getCartRecommendations` / `getPersonalizedRecommendations` | `lib/recommendations.ts` | Detail page, API routes |
| `getDeliveryOptions()` | `lib/settings.ts` | Cart/checkout pricing |
| `getFooterContent` / `getContactContent` / `getAboutContent` | `lib/site-content.ts` | Footer, contact, about |
| Admin dashboard stats, order/customer/book/category/tag lists | inline `prisma.*` in admin `page.tsx` files | All admin list/detail pages |

### 2f. Client-side fetch calls (the frontend's real API surface)

```
src/components/admin/upload-field.tsx            → POST /api/admin/upload
src/components/books/client-recommendation-section.tsx → GET+POST /api/recommendations
src/components/checkout/checkout-page-client.tsx → POST /api/orders
src/components/site/account-menu.tsx             → GET /api/account/me
src/lib/tracking-client.ts                       → POST /api/recommendation-events
```

---

## 3. Current Database Models (`prisma/schema.prisma`)

**Enums:** `AdminRole`, `BookStatus`, `PaymentMethod`, `PaymentStatus`, `OrderStatus`, `CustomerBookEventType`

| Model | Key fields / relations |
|---|---|
| `Admin` | email unique, passwordHash, role, isActive |
| `Book` | slug unique, isbn13 unique, Decimal prices, galleryImages[], status, flags (isFeatured/isBestSeller/isNewArrival/isRecommended), → Category, → BookTag[], → OrderItem[], → CustomerBookEvent[], → SavedBook[] |
| `Category` | slug unique, isActive, → Book[] |
| `Tag` | slug unique, isActive, → BookTag[] |
| `BookTag` | composite PK (bookId, tagId), cascade deletes |
| `Order` | orderNumber unique, customer snapshot fields, Decimal money fields, paymentMethod/Status, orderStatus, `stockReduced` flag, → Customer?, → OrderItem[] |
| `OrderItem` | bookTitleSnapshot, quantity, unit/total price, → Order (cascade), → Book |
| `Banner` | position-based, **appears unused by current UI** |
| `SiteSetting` | key unique + Json value (keys: `delivery_charges`, `site_content.footer`, `site_content.contact`, `site_content.about`) |
| `Customer` | email unique?, phone unique?, passwordHash, → Profile, → Sessions, → Preference, → Events, → SavedBooks, → Orders |
| `CustomerProfile` | 1:1, default address/district/area, marketing+personalization consents |
| `CustomerSession` | tokenHash unique, expiresAt, userAgent, ipHash |
| `CustomerBookEvent` | customerId? OR anonymousId, eventType, weight, source — the recommendations signal store |
| `CustomerPreference` | 1:1, preferred categories/tags/languages as Json |
| `SavedBook` | unique (customerId, bookId) — **appears unused by current UI** |

**Migration note:** the schema itself migrates as-is. Prisma works fine in NestJS — keep the same `schema.prisma`, move it to the NestJS repo (or a shared package).

---

## 4. Required NestJS Modules

```
nest-backend/
├── src/
│   ├── main.ts                    (CORS for the Next origin, cookie-parser, helmet, global ValidationPipe)
│   ├── app.module.ts
│   ├── prisma/                    PrismaModule (global) — PrismaService wrapping @prisma/client
│   ├── auth/
│   │   ├── admin-auth/            AdminAuthModule — login/logout, HMAC or JWT token, AdminGuard + RolesGuard + @Roles() decorator
│   │   └── customer-auth/         CustomerAuthModule — register/login/logout/me, DB session strategy, CustomerGuard (+ optional-customer decorator)
│   ├── books/                     BooksModule — public catalogue queries (home, list+filters, by-slug, similar) + admin CRUD
│   ├── categories/                CategoriesModule — public list + admin CRUD
│   ├── tags/                      TagsModule — public list + admin CRUD
│   ├── orders/                    OrdersModule — checkout (POST), admin list/detail/update (transactional stock logic), CSV export
│   ├── customers/                 CustomersModule — profile update, password change, admin customer list
│   ├── recommendations/           RecommendationsModule — personalized, cart-based, similar; event tracking
│   ├── settings/                  SettingsModule — delivery charges read/update, SiteSetting key-value service
│   ├── site-content/              SiteContentModule — footer/contact/about read + admin update
│   ├── uploads/                   UploadsModule — multipart upload (Multer), local-disk strategy with provider interface (Cloudinary later)
│   ├── health/                    HealthModule — @nestjs/terminus, real DB ping
│   └── common/
│       ├── dto/                   class-validator DTOs (ported from Zod) — or keep Zod via nestjs-zod
│       ├── decorators/            @CurrentAdmin(), @CurrentCustomer(), @Roles()
│       ├── guards/                AdminRolesGuard, CustomerGuard, OptionalCustomerGuard
│       └── filters/               Prisma exception filter (P2002 → 409, P2025 → 404)
```

**Recommended supporting choices:**
- **Validation:** `nestjs-zod` to reuse the existing `validators.ts` schemas verbatim (lowest-risk), or rewrite as class-validator DTOs (more idiomatic). Recommend **nestjs-zod** for parity.
- **Auth tokens:** keep the exact cookie formats during migration (HMAC admin token, hashed customer session) so existing logged-in users survive the cutover. Refactor to `@nestjs/jwt` later if desired.
- **Config:** `@nestjs/config` with a validated env schema.
- **Caching:** `@nestjs/cache-manager` (in-memory now, Redis-ready) replacing `unstable_cache`.

---

## 5. Old → New Route Mapping

### REST routes (1:1 carryover, new base URL)

| Old (Next.js) | New (NestJS) |
|---|---|
| `GET /api/health` | `GET /health` |
| `POST /api/orders` | `POST /orders` |
| `GET /api/account/me` | `GET /auth/customer/me` |
| `GET /api/recommendations` | `GET /recommendations` |
| `POST /api/recommendations` | `POST /recommendations/cart` |
| `POST /api/recommendation-events` | `POST /recommendations/events` |
| `POST /api/admin/upload` | `POST /admin/uploads` |
| `GET /api/admin/orders/export` | `GET /admin/orders/export.csv` |

### Server Actions → REST endpoints (the bigger conversion)

| Old server action | New NestJS endpoint |
|---|---|
| `loginAction` | `POST /auth/admin/login` |
| `logoutAction` | `POST /auth/admin/logout` |
| `createBookAction` | `POST /admin/books` |
| `updateBookAction` | `PATCH /admin/books/:id` |
| `archiveBookAction` | `POST /admin/books/:id/archive` |
| `deleteBookAction` | `DELETE /admin/books/:id` |
| `create/update/archiveCategoryAction` | `POST /admin/categories`, `PATCH /admin/categories/:id`, `POST /admin/categories/:id/archive` |
| `create/update/archiveTagAction` | `POST /admin/tags`, `PATCH /admin/tags/:id`, `POST /admin/tags/:id/archive` |
| `updateOrderAction` | `PATCH /admin/orders/:id` |
| `updateDeliverySettingsAction` | `PUT /admin/settings/delivery-charges` |
| `updateFooter/Contact/AboutContentAction` | `PUT /admin/site-content/footer`, `…/contact`, `…/about` |
| `registerCustomerAction` | `POST /auth/customer/register` |
| `loginCustomerAction` | `POST /auth/customer/login` |
| `logoutCustomerAction` | `POST /auth/customer/logout` |
| `updateCustomerProfileAction` | `PUT /customers/me/profile` |
| `changeCustomerPasswordAction` | `PUT /customers/me/password` |

### RSC data readers → public REST endpoints

| Old reader | New NestJS endpoint |
|---|---|
| `getHomeData()` | `GET /books/home` (single aggregated payload) |
| `getBooks(params)` | `GET /books?q=&category=&tag=&status=&min=&max=&sort=` |
| `getBookBySlug()` | `GET /books/:slug` |
| `getSimilarBooks()` | `GET /books/:slug/similar` |
| `getDeliveryOptions()` | `GET /settings/delivery-options` |
| `getFooterContent/ContactContent/AboutContent` | `GET /site-content/footer`, `…/contact`, `…/about` |
| Admin dashboard stats | `GET /admin/dashboard/stats` |
| Admin lists (orders/customers/books/categories/tags) | `GET /admin/orders`, `GET /admin/customers`, etc. with pagination |

---

## 6. Frontend Integration Plan

1. **API client layer.** Create `src/lib/api-client.ts` in Next.js: a thin typed `fetch` wrapper with `API_BASE_URL` env (`NEXT_PUBLIC_API_URL` for client components, `API_URL` for server-side calls). All `/api/...` fetches and Prisma readers route through it.
2. **RSC pages keep SSR.** Server Components switch from direct Prisma calls to `fetch(API_URL + '/books/home', { next: { revalidate: 300, tags: ['home'] } })` — Next's fetch-cache replaces `unstable_cache`, keeping ISR behavior.
3. **Server Actions become thin proxies (transition) → direct client calls (final).** During transition, keep `actions.ts` files but have them call NestJS with the forwarded cookie header. Final state: forms post directly to NestJS from client components (`useActionState` replaced by mutation helpers), or keep thin actions permanently for progressive-enhancement forms — decide per form.
4. **Cookies/auth across origins.** Two options:
   - **Same-site deployment (recommended):** reverse-proxy NestJS under the same domain (`/backend/*` via Next rewrites or an edge proxy) so cookies stay first-party. Zero CORS pain.
   - Separate domain: CORS with `credentials: true`, `SameSite=None; Secure` cookies — more fragile.
   Recommend: **Next.js `rewrites()` proxying `/backend/:path*` → NestJS** during migration, real proxy (nginx/Caddy) in production.
5. **Cache invalidation.** NestJS can't call `revalidateTag` directly. Add a private Next route `POST /api/revalidate` (secret-protected) that NestJS calls after admin mutations, mapping entity → tags (reuses existing `cache-invalidation.ts` logic).
6. **Uploads.** Frontend upload-field posts to NestJS; NestJS serves `/uploads/**` statically (ServeStaticModule) or writes to shared volume/S3-style storage. `next.config.ts` image domains must include the backend host.

---

## 7. Risky Files / Folders

| Risk | File(s) | Why |
|---|---|---|
| 🔴 High | `src/app/admin/actions.ts` → `updateOrderAction` | Transactional stock decrement/increment with `stockReduced` flag — race-condition-sensitive; port carefully with `prisma.$transaction` and add a concurrency test |
| 🔴 High | `src/lib/cache-invalidation.ts`, `cache-tags.ts`, all `unstable_cache` wrappers | Entire caching model is Next-specific; needs the revalidation-webhook design (§6.5) or stale admin edits will appear on the public site |
| 🔴 High | `src/lib/auth.ts` custom HMAC token | If the token format changes during cutover, every admin is logged out; replicate byte-for-byte or schedule cutover with forced re-login |
| 🟠 Medium | `src/app/api/admin/upload/route.ts` | Writes into `public/` of the Next app — impossible once the backend is a separate process; storage location must move first |
| 🟠 Medium | `src/app/(site)/account/actions.ts` | Phone normalization + P2002 handling + redirects intertwined; redirects are a frontend concern and must be split out |
| 🟠 Medium | `src/lib/data.ts` serializers | `Decimal` → number conversion happens here; NestJS must serialize identically or every price display breaks |
| 🟡 Low | `src/lib/env.ts` `hasUsableDatabaseUrl()` graceful-degradation | The "works without a DB" demo mode permeates routes/actions; decide whether NestJS keeps it (suggest: drop it, NestJS requires a DB) |
| 🟡 Low | `prisma/seed.ts`, `ADMIN_SEED_*` env | Seeding must move to the NestJS repo |

---

## 8. Cleanup Recommendations

1. **Delete after cutover:** `src/app/api/**` (all 7 routes), all three `actions.ts` files, `src/lib/auth.ts`, `customer-auth.ts`, `order-utils.ts`, `recommendation-events.ts`, `recommendations.ts` (server parts), `settings.ts`, `site-content.ts`, `data.ts` (Prisma parts), `prisma.ts`, `http-cache.ts`, `cache-invalidation.ts`; `prisma/` folder; `@prisma/*`, `pg`, `bcryptjs` deps from the Next package.json.
2. **Keep in Next.js:** `validators.ts` *client-relevant* schemas (or move to a shared `@asp/contracts` package with API types), `cart-client.ts`, `tracking-client.ts` (retargeted to new URLs), `consent-client.ts`, `format.ts`, `constants.ts` (UI-only parts).
3. **Rename misleading env vars:** `NEXTAUTH_SECRET` → `SESSION_SECRET`, `NEXTAUTH_URL` → `SITE_URL` (NextAuth was never used).
4. **Dead models:** `Banner` and `SavedBook` have no UI usage — confirm and either build the feature in NestJS or drop from schema.
5. **Shared types package (recommended):** `packages/contracts` with API request/response types + Zod schemas, consumed by both apps — prevents drift.

---

## 9. Step-by-Step Implementation Checklist

### Phase 0 — Foundations (no behavior change) — ✅ DONE (see docs/API_FOUNDATION_SETUP.md)
- [x] Created `apps/api/` as a **standalone npm package** (workspace conversion deferred — moving the Next app to `apps/web` judged too risky for Phase 0)
- [x] Scaffolded NestJS 11: `@nestjs/config` (global), cookie-parser, helmet, CORS (`FRONTEND_ORIGIN`, credentials), global `ValidationPipe`
- [x] Prisma wired via **dual-generator approach**: root `prisma/schema.prisma` kept in place (NOT moved); an additive `apiClient` generator outputs to `apps/api/generated/prisma`. Models unchanged; Next app's generator untouched. *(Correction to original plan: schema is shared in place, not moved.)*
- [x] Prisma exception filter (P2002→409, P2025→404) + global validation pipe
- [x] Real `/health` with DB ping (`SELECT 1`), graceful `not_configured` mode without DATABASE_URL
- [ ] Port `validators.ts` schemas into a shared contracts package *(deferred to Phase 1 — nestjs-zod decision pending)*
- [ ] Decide upload storage location (move off `public/`) *(deferred to Phase 3 prep)*

### Phase 1 — Read-only public API (lowest risk)
- [ ] `GET /books/home`, `GET /books`, `GET /books/:slug`, `GET /books/:slug/similar`
- [ ] `GET /settings/delivery-options`, `GET /site-content/*`
- [ ] Verify Decimal→number serialization matches `serializeBookCard`/`serializeBookDetail` exactly (snapshot tests against both backends)
- [ ] Point Next RSC pages at these endpoints via `fetch` + tags; delete corresponding Prisma readers
- [ ] Add `POST /api/revalidate` webhook in Next; NestJS calls it on mutations

### Phase 2 — Customer-facing writes
- [ ] Customer auth module (register/login/logout/me) replicating the DB-session cookie exactly
- [ ] `POST /orders` checkout with identical totals math + order-number generation
- [ ] Recommendations module (GET, POST cart, POST events)
- [ ] Retarget the 5 client `fetch()` call sites; retarget `tracking-client.ts`
- [ ] Convert customer account server actions to API calls (redirects stay in the frontend)
- [ ] End-to-end test: guest checkout, registered checkout, login via phone and email

### Phase 3 — Admin API
- [ ] Admin auth (replicate HMAC cookie or schedule forced re-login), `AdminRolesGuard`
- [ ] Books/categories/tags CRUD endpoints; orders admin endpoints **with the transactional stock logic + concurrency test**
- [ ] CSV export, uploads module (new storage), settings + site-content endpoints
- [ ] Admin dashboard stats + paginated list endpoints
- [ ] Convert admin pages/forms to consume the API

### Phase 4 — Cutover & cleanup
- [ ] Delete all `src/app/api/**` routes and `actions.ts` files from Next
- [ ] Remove Prisma/bcrypt/pg from the Next app; delete server-only libs (§8.1)
- [ ] Rename env vars; split `.env` per app
- [ ] Full regression: homepage, catalogue/search, book detail, cart, checkout, account flows, all admin flows, CSV export, upload
- [ ] Lighthouse + load test on the new topology; confirm ISR still works
- [ ] Update README + deployment docs

### Rollback strategy
Each phase keeps the old code path intact until its replacement is verified — Phases 1–3 can each be reverted by flipping the fetch base URL back, since the Next backend code isn't deleted until Phase 4.

---

*Generated from full codebase inspection: 7 API routes, 22 server actions, 15 Prisma models, 2 auth systems, 5 client fetch call sites, npm package manager, no middleware, Next-specific caching throughout.*
