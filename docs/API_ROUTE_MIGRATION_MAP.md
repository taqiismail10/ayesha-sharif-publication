# API Route Migration Map

Status values: `not started` · `planned` · `migrated` · `compatibility` · `deprecated` · `removed`
Roles: `public` (no auth) · `customer` · `optional-customer` (works anonymous, enriches if logged in) · admin roles (`super_admin`, `admin`, `editor`, `order_manager`).

## A. REST route handlers (`src/app/api/**`)

| Feature | Old Next.js route/function | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Health | `GET /api/health` | none (ops only) | `GET /health` | no | public | **compatibility** | NestJS version does a real `SELECT 1`; old route always said `not_checked`. Keep until uptime monitors / hosting probes are migrated. |
| Checkout | `POST /api/orders` | `checkout-page-client.tsx` | `POST /orders` | no | optional-customer | **migrated** (2D) | Byte-identical behavior + response JSON (see docs/API_ROUTES.md table). 12-case test battery passed against real DB. Frontend RETARGETED (2F); old route kept as fallback. |
| Customer session probe | `GET /api/account/me` | none (frontend retargeted) | `GET /auth/customer/me` | cookie | customer (null-safe) | **compatibility** | NestJS endpoint live + tested; identical response shape. Frontend RETARGETED (2F); delete only after external verification. |
| Personalized recs | `GET /api/recommendations?anonymousId=` | none (frontend retargeted) | `GET /recommendations` | no | optional-customer | **compatibility** | 1:1 engine port; BookCardData shape exact. Frontend RETARGETED (2F); delete only after external verification. |
| Cart recs | `POST /api/recommendations` | none (frontend retargeted) | `POST /recommendations/cart` | no | public | **compatibility** | Body: `bookIds[]` (max 30); error body byte-identical. Frontend RETARGETED (2F); delete only after external verification. |
| Event tracking | `POST /api/recommendation-events` | none (frontend retargeted) | `POST /recommendations/events` | no | optional-customer | **compatibility** | Consent rules + 30-min view dedupe + weights identical; tested in DB. Frontend RETARGETED (2F); delete only after external verification. |
| Public policy JSON | removed `GET /api/policies/:slug` | public policy pages | `GET /policies/:slug`, `GET /policies` | no | public | **migrated** (Test 29) | NestJS returns published content only; draft content remains admin-only. |
| Admin upload | `POST /api/admin/upload` | `components/admin/upload-field.tsx` | `POST /admin/uploads` | cookie | super_admin/admin/editor* | planned (Phase 3) | *Old route checks login only, not role — tighten in NestJS. Writes to `public/uploads/books/` — storage decision blocks this. |
| Orders CSV export | removed `GET /api/admin/orders/export` | `export-orders-button.tsx` fetches and downloads a Blob | `GET /admin/orders/export` | cookie | super_admin, admin, order_manager | **migrated** (Test 24) | Bounded CSV export with filters q/orderStatus/paymentStatus; 100-order and 1,000-item caps. |

**Removed in Phase 2A:** `GET /api/admin/policies`, `GET/PATCH /api/admin/policies/:slug`, and `POST /api/admin/policies/:slug/publish` were deleted after internal reference checks confirmed the admin policy UI already uses server actions instead of JSON API routes.

## B. Server Actions — `src/app/admin/actions.ts`

| Feature | Old action | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Admin login | `loginAction` | `components/admin/login-form.tsx` | `POST /auth/admin/login` | no | public | planned (Phase 3) | Sets HMAC cookie; replicate format or force re-login. |
| Admin logout | `logoutAction` | `admin-shell.tsx` | `POST /auth/admin/logout` | cookie | any admin | planned (Phase 3) | |
| Create book | `createBookAction` | `admin/books/new` page form | `POST /admin/books` | cookie | super_admin, admin, editor | planned (Phase 3) | Zod `bookFormSchema`; tags relation create. |
| Update book | `updateBookAction` | `admin/books/[id]/edit` form | `PATCH /admin/books/:id` | cookie | super_admin, admin, editor | planned (Phase 3) | Tags `deleteMany` + recreate. |
| Archive book | `archiveBookAction` | `admin/books` list | `POST /admin/books/:id/archive` | cookie | super_admin, admin, editor | planned (Phase 3) | |
| Delete book | `deleteBookAction` | `admin/books` list | `DELETE /admin/books/:id` | cookie | super_admin, admin | **migrated** (Test 27) | NestJS performs one conditional D1 delete; blocked when order items exist. |
| Create/update/archive category | `createCategoryAction` etc. | `admin/categories` page | `POST/PATCH /admin/categories[/:id]`, `POST …/:id/archive` | cookie | super_admin, admin, editor | planned (Phase 3) | |
| Create/update/archive tag | `createTagAction` etc. | `admin/tags` page | `POST/PATCH /admin/tags[/:id]`, `POST …/:id/archive` | cookie | super_admin, admin, editor | planned (Phase 3) | |
| Update order | `updateOrderAction` | `admin/orders/[id]` form | `PATCH /admin/orders/:id` | cookie | super_admin, admin, order_manager | planned (Phase 3) | 🔴 Transactional stock decrement/increment via `stockReduced` flag. Highest-risk port. |
| Delivery charges | `updateDeliverySettingsAction` | `admin/settings` form | `PUT /admin/settings/delivery-charges` | cookie | super_admin, admin | planned (Phase 3) | `SiteSetting` upsert key `delivery_charges`. |

## C. Server Actions — `src/app/admin/(protected)/site-content/actions.ts`

| Feature | Old action | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Footer content | `updateFooterContentAction` | `admin/site-content` page (`content-form-section.tsx`) | `PUT /admin/site-content/footer` | cookie | super_admin, admin | planned (Phase 3) | Includes 4 editable info links. |
| Contact content | `updateContactContentAction` | same | `PUT /admin/site-content/contact` | cookie | super_admin, admin | planned (Phase 3) | Also feeds public footer Contact column. |
| About content | `updateAboutContentAction` | same | `PUT /admin/site-content/about` | cookie | super_admin, admin | planned (Phase 3) | |

## C2. Server Actions — `src/app/admin/(protected)/policies/actions.ts`

| Feature | Old action | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Save policy draft | `savePolicyDraftAction` | `components/admin/policy-editor-form.tsx` | none yet | cookie | super_admin, admin | planned (Phase 3) | Phase 2A removed the unused `/api/admin/policies*` JSON routes; admin policy editing currently uses server actions only. |
| Publish policy | `publishPolicyAction` | `components/admin/policy-editor-form.tsx` | none yet | cookie | super_admin, admin | planned (Phase 3) | Public pages read published policy data server-side; `/api/policies/:slug` remains the optional public JSON surface. |

## D. Server Actions — `src/app/(site)/account/actions.ts`

| Feature | Old action | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Customer register | `registerCustomerAction` | `customer-auth-form.tsx` | `POST /auth/customer/register` | no | public | **migrated** (2A) | E2E tested incl. P2002→409 + phone normalization. Form deliberately STILL uses the server action (2F decision: sessions are cross-backend valid, so converting the progressive-enhancement form adds risk for zero behavior gain; revisit at Phase 4 cleanup). |
| Customer login | removed | `customer-auth-form.tsx` via `postAuth()` | `POST /auth/customer/login` | no | public | **migrated** | Frontend submits credentials directly to NestJS and performs the safe post-success redirect. The obsolete Next.js password-login action and session-creation path were removed. |
| Customer logout | removed | account-menu + mobile header via `apiFetch()` | `POST /auth/customer/logout` | cookie | customer | **migrated** | Both active callers use NestJS. The obsolete action and GET/POST Next.js fallback route were removed; Next.js retains only invalid-session cleanup for RSC reads. |
| Google OAuth start | — (new capability, no old route) | "Continue with Google" button on `customer-auth-form.tsx` | `GET /auth/customer/google` | no | public | **migrated** (2C) | 503 until GOOGLE_CLIENT_ID/SECRET configured; CSRF state cookie; safe-redirect param. |
| Google OAuth callback | — (new capability) | browser redirect from Google | `GET /auth/customer/google/callback` | no | public | **migrated** (2C) | Links via `CustomerAuthProvider` (additive model); creates the same DB CustomerSession; errors → `/account/login?error=google_login_failed`. |
| Profile update | removed | `customer-profile-form.tsx` via `putAuth()` | `PUT /customers/me/profile` | cookie | customer | **migrated** | Frontend retargeted to NestJS; guarded three-write flow, validation feedback, and empty-default-skip behavior preserved. Customer/Profile/Preference now commit atomically through native D1 `batch()`. Obsolete Next.js profile mutation removed. |
| Password change | removed | `customer-password-form.tsx` via `putAuth()` | `PUT /customers/me/password` | cookie | customer | **migrated** | Frontend retargeted to the guarded NestJS endpoint; the obsolete Next.js password verification and mutation were removed. |

## E. RSC data readers + inline Prisma (no HTTP today → new endpoints)

| Feature | Old function / page | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Homepage data | `getHomeData()` | `(site)/page.tsx` | `GET /books/home` | no | public | planned (Phase 1) | featured/newArrivals/bestSellers/categories in one payload. |
| Catalogue/search | `getBooks(params)` | `(site)/books`, `(site)/search` | `GET /books?…` | no | public | planned (Phase 1) | q, category, tag, status, min, max, sort. |
| Book detail | `getBookBySlug()` | `(site)/books/[slug]` | `GET /books/:slug` | no | public | planned (Phase 1) | Includes related books. |
| Similar books | `getSimilarBooks()` | `(site)/books/[slug]` | `GET /books/:slug/similar` | no | public | planned (Phase 1) | |
| Delivery options | `getDeliveryOptions()` | cart, checkout pages | `GET /settings/delivery-options` | no | public | planned (Phase 1) | |
| Site content | `getFooterContent/Contact/About` | footer, contact, about pages | `GET /site-content/{footer,contact,about}` | no | public | planned (Phase 1) | |
| Customer orders list | inline prisma in `account/orders/page.tsx` | that page | `GET /customers/me/orders` | cookie | customer | planned (Phase 2) | |
| Customer order detail | inline prisma in `account/orders/[orderNumber]` | that page | `GET /customers/me/orders/:orderNumber` | cookie | customer | planned (Phase 2) | Ownership check required. |
| Profile stats | inline prisma in `account/profile` | that page | `GET /customers/me/stats` | cookie | customer | planned (Phase 2) | Includes `savedBook.count`. |
| Order success lookup | `fetchPublicApi()` in `order-success/[orderNumber]` | that page | `GET /orders/confirmation/:orderNumber` | no | public* | **migrated** (Test 30) | *Guest flow preserves order-number-as-capability semantics. The API returns confirmation-safe fields only, uses 30/min route throttling, and validates the bounded order-number format. |
| Admin dashboard stats | removed inline Prisma from `admin/(protected)/page.tsx` | dashboard | `GET /admin/dashboard` | cookie | any authenticated admin | **migrated** (Test 25) | Five bounded D1 queries: grouped counts, monthly revenue, and two six-row lists. |
| Admin invoice | removed inline Prisma from `admin/orders/[id]/invoice` | invoice print page | `GET /admin/orders/:id/invoice` | cookie | super_admin, admin, order_manager | **migrated** (Test 25) | Uses order and item snapshots only; does not return account or authentication data. |
| Admin customers | removed inline Prisma from `admin/(protected)/customers/page.tsx` | customer list | `GET /admin/customers?q=` | cookie | super_admin, admin, order_manager | **migrated** (Test 26) | Newest-first, bounded to 100 rows; searches name, email, and phone. |
