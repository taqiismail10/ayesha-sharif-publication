# API Route Migration Map

Status values: `not started` · `planned` · `migrated` · `deprecated` · `removed`
Roles: `public` (no auth) · `customer` · `optional-customer` (works anonymous, enriches if logged in) · admin roles (`super_admin`, `admin`, `editor`, `order_manager`).

## A. REST route handlers (`src/app/api/**`)

| Feature | Old Next.js route/function | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Health | `GET /api/health` | none (ops only) | `GET /health` | no | public | **migrated** | NestJS version does a real `SELECT 1`; old route always said `not_checked`. Old route NOT yet removed. |
| Checkout | `POST /api/orders` | `checkout-page-client.tsx` | `POST /orders` | no | optional-customer | **migrated** (2D) | Byte-identical behavior + response JSON (see docs/API_ROUTES.md table). 12-case test battery passed against real DB. Frontend retarget pending (2F); old route still active. |
| Customer session probe | `GET /api/account/me` | `account-menu.tsx` (header, every page) | `GET /auth/customer/me` | cookie | customer (null-safe) | **migrated** (2A) | NestJS endpoint live + tested; identical response shape. Frontend retarget pending (2F); old route still active. |
| Personalized recs | `GET /api/recommendations?anonymousId=` | `client-recommendation-section.tsx` | `GET /recommendations` | no | optional-customer | **migrated** (2E) | 1:1 engine port; BookCardData shape exact. No sample-data demo mode (empty list instead). Frontend retarget pending (2F). |
| Cart recs | `POST /api/recommendations` | `client-recommendation-section.tsx` | `POST /recommendations/cart` | no | public | **migrated** (2E) | Body: `bookIds[]` (max 30); error body byte-identical. |
| Event tracking | `POST /api/recommendation-events` | `lib/tracking-client.ts` (product cards, detail tracker, sample link) | `POST /recommendations/events` | no | optional-customer | **migrated** (2E) | Consent rules + 30-min view dedupe + weights identical; tested in DB. |
| Admin upload | `POST /api/admin/upload` | `components/admin/upload-field.tsx` | `POST /admin/uploads` | cookie | super_admin/admin/editor* | planned (Phase 3) | *Old route checks login only, not role — tighten in NestJS. Writes to `public/uploads/books/` — storage decision blocks this. |
| Orders CSV export | `GET /api/admin/orders/export` | link on admin orders page | `GET /admin/orders/export.csv` | cookie | super_admin, admin, order_manager | planned (Phase 3) | Streams CSV with filters q/orderStatus/paymentStatus. |

## B. Server Actions — `src/app/admin/actions.ts`

| Feature | Old action | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Admin login | `loginAction` | `components/admin/login-form.tsx` | `POST /auth/admin/login` | no | public | planned (Phase 3) | Sets HMAC cookie; replicate format or force re-login. |
| Admin logout | `logoutAction` | `admin-shell.tsx` | `POST /auth/admin/logout` | cookie | any admin | planned (Phase 3) | |
| Create book | `createBookAction` | `admin/books/new` page form | `POST /admin/books` | cookie | super_admin, admin, editor | planned (Phase 3) | Zod `bookFormSchema`; tags relation create. |
| Update book | `updateBookAction` | `admin/books/[id]/edit` form | `PATCH /admin/books/:id` | cookie | super_admin, admin, editor | planned (Phase 3) | Tags `deleteMany` + recreate. |
| Archive book | `archiveBookAction` | `admin/books` list | `POST /admin/books/:id/archive` | cookie | super_admin, admin, editor | planned (Phase 3) | |
| Delete book | `deleteBookAction` | `admin/books` list | `DELETE /admin/books/:id` | cookie | super_admin, admin | planned (Phase 3) | Blocked when order items exist. |
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

## D. Server Actions — `src/app/(site)/account/actions.ts`

| Feature | Old action | Current frontend usage | New NestJS route | Auth required | Role | Migration status | Notes |
|---|---|---|---|---|---|---|---|
| Customer register | `registerCustomerAction` | `customer-auth-form.tsx` | `POST /auth/customer/register` | no | public | **migrated** (2A) | E2E tested incl. P2002→409 conflict + phone normalization. Frontend retarget pending (2F). |
| Customer login | `loginCustomerAction` | `customer-auth-form.tsx` | `POST /auth/customer/login` | no | public | **migrated** (2A) | Email OR BD phone tested (`+880…` → `01…`). Generic 401 message preserved. |
| Customer logout | `logoutCustomerAction` | account pages | `POST /auth/customer/logout` | cookie | customer | **migrated** (2A) | Deletes session row + cookie; tested. |
| Google OAuth start | — (new capability, no old route) | "Continue with Google" button on `customer-auth-form.tsx` | `GET /auth/customer/google` | no | public | **migrated** (2C) | 503 until GOOGLE_CLIENT_ID/SECRET configured; CSRF state cookie; safe-redirect param. |
| Google OAuth callback | — (new capability) | browser redirect from Google | `GET /auth/customer/google/callback` | no | public | **migrated** (2C) | Links via `CustomerAuthProvider` (additive model); creates the same DB CustomerSession; errors → `/account/login?error=google_login_failed`. |
| Profile update | `updateCustomerProfileAction` | `customer-profile-form.tsx` | `PUT /customers/me/profile` | cookie | customer | **migrated** (2B) | 3-op `$transaction` preserved; empty-default-skip quirk preserved; tested. |
| Password change | `changeCustomerPasswordAction` | `customer-password-form.tsx` | `PUT /customers/me/password` | cookie | customer | **migrated** (2B) | Wrong-current → 400 with exact old message; tested. |

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
| Order success lookup | inline prisma in `order-success/[orderNumber]` | that page | `GET /orders/:orderNumber/public` | no | public* | planned (Phase 2) | *Currently order number = access token; keep semantics, document risk. |
| Admin dashboard stats | inline prisma in `admin/(protected)/page.tsx` | dashboard | `GET /admin/dashboard/stats` | cookie | any admin | planned (Phase 3) | |
| Admin lists/details | inline prisma in books/orders/customers/categories/tags pages + invoice | those pages | `GET /admin/{books,orders,customers,categories,tags}[/:id]` | cookie | per-page roles | planned (Phase 3) | Invoice print = `GET /admin/orders/:id` reuse. |
