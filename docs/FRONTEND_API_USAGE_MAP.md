# Frontend API Usage Map

Every frontend dependency on the old backend, by mechanism. Risk level = blast radius if the migration of that call breaks (🔴 checkout/auth-critical · 🟠 visible feature · 🟡 degraded-gracefully).

**Phase 2F status:** all customer-facing `fetch()` call-sites now go through `src/lib/api-client.ts` (`NEXT_PUBLIC_API_BASE_URL`, `credentials:"include"`) to the NestJS API. Admin calls untouched. The remaining old Next routes listed below are now compatibility endpoints that need external verification before deletion.

## A. Client-side `fetch()` (5 call sites — the only true HTTP dependencies)

| Frontend file | API called | Feature | Old route/function | NestJS endpoint | Status | Risk level |
|---|---|---|---|---|---|---|
| `src/components/checkout/checkout-page-client.tsx` | ~~`POST /api/orders`~~ | Checkout submit | `app/api/orders/route.ts` (kept) | `POST /orders` | ✅ **retargeted (2F)** | 🔴 revenue path |
| `src/components/site/account-menu.tsx`, `src/components/site/header.tsx` | `GET /auth/customer/me` + `POST /auth/customer/logout` | Header login state + logout | removed `/account/logout` fallback | `GET /auth/customer/me`, `POST /auth/customer/logout` | ✅ **retargeted** | 🟠 every-page header |
| `src/components/admin/upload-field.tsx` | `POST /api/admin/upload` | Book cover/gallery/PDF upload | `app/api/admin/upload/route.ts` | `POST /admin/uploads` | ⏳ Phase 3 — **not touched** | 🟠 admin workflow |
| `src/components/books/client-recommendation-section.tsx` | ~~`GET/POST /api/recommendations`~~ | Personalized + cart recommendations | `app/api/recommendations/route.ts` (compatibility only) | `GET /recommendations`, `POST /recommendations/cart` | ✅ **retargeted (2F)** | 🟡 self-hides on failure |
| `src/lib/tracking-client.ts` | ~~`POST /api/recommendation-events`~~ | Interaction tracking | `app/api/recommendation-events/route.ts` (compatibility only) | `POST /recommendations/events` | ✅ **retargeted (2F)** | 🟡 fire-and-forget |
| `src/components/account/customer-auth-form.tsx` | `POST /auth/customer/login` via `postAuth()` | Customer password login | removed `loginCustomerAction` | `POST /auth/customer/login` | ✅ **retargeted** | 🔴 authentication path |
| `src/components/account/customer-profile-form.tsx` | `PUT /customers/me/profile` via `putAuth()` | Profile, preferences, and consent | removed `updateCustomerProfileAction` | `PUT /customers/me/profile` | ✅ **retargeted** | 🟠 account settings |
| `src/components/account/customer-password-form.tsx` | `PUT /customers/me/password` via `putAuth()` | Password change | removed `changeCustomerPasswordAction` | `PUT /customers/me/password` | ✅ **retargeted** | 🟠 account security |

Also: the admin orders page fetches `GET /admin/orders/export` with credentials and downloads the returned Blob — ✅ retargeted in Test 24. The Google login button (`customer-auth-form.tsx`) now also uses `apiUrl()` from the shared client. The old admin policy JSON API routes were removed in Phase 2A because the policy editor already uses server actions.

## B. Server-Action form bindings (convert with Phase 2/3, form-by-form)

| Frontend file | Action(s) used | Feature | Proposed NestJS endpoint | Risk level |
|---|---|---|---|---|
| `src/components/admin/login-form.tsx` | `loginAction` | Admin login | `POST /auth/admin/login` | 🔴 admin lockout if broken |
| `src/components/admin/admin-shell.tsx` | `logoutAction` | Admin logout | `POST /auth/admin/logout` | 🟡 |
| `src/components/account/customer-auth-form.tsx` | `registerCustomerAction` (legacy register mode only) | Customer register fallback | `POST /auth/customer/register` | 🔴 |
| `src/app/admin/(protected)/books/new` + `[id]/edit` + list pages | book CRUD actions | Book management | `/admin/books*` | 🟠 |
| `src/app/admin/(protected)/categories/page.tsx` | category actions | Category management | `/admin/categories*` | 🟠 |
| `src/app/admin/(protected)/tags/page.tsx` | tag actions | Tag management | `/admin/tags*` | 🟠 |
| `src/app/admin/(protected)/orders/[id]/page.tsx` | `updateOrderAction` | Order status + stock | `PATCH /admin/orders/:id` | 🔴 stock integrity |
| `src/app/admin/(protected)/settings/page.tsx` | `updateDeliverySettingsAction` | Delivery charges | `PUT /admin/settings/delivery-charges` | 🟠 |
| `src/app/admin/(protected)/site-content/page.tsx` + `components/admin/content-form-section.tsx` | 3 site-content actions | CMS editing | `PUT /admin/site-content/*` | 🟡 |
| `src/components/admin/policy-editor-form.tsx` | `savePolicyDraftAction`, `publishPolicyAction` | Policy management | no HTTP route yet | 🟡 |

## C. RSC pages calling readers / Prisma directly (switch to API fetch in Phase 1/2)

| Frontend file | Reader / query | Feature | Proposed NestJS endpoint | Risk level |
|---|---|---|---|---|
| `src/app/(site)/page.tsx` | `getHomeData()` | Homepage sections | `GET /books/home` | 🟠 |
| `src/app/(site)/books/page.tsx`, `search/page.tsx` | `getBooks()` | Catalogue + search | `GET /books` | 🟠 |
| `src/app/(site)/books/[slug]/page.tsx` | `getBookBySlug()`, `getSimilarBooks()` | Book detail | `GET /books/:slug{,/similar}` | 🟠 |
| `src/app/(site)/cart/page.tsx`, `checkout/page.tsx` | `getDeliveryOptions()` | Delivery pricing | `GET /settings/delivery-options` | 🔴 wrong totals if stale |
| `src/components/site/footer.tsx`, `contact/page.tsx`, `about/page.tsx` | `getFooterContent/Contact/About` | CMS content | `GET /site-content/*` | 🟡 |
| `src/app/(site)/account/orders/page.tsx` (+`[orderNumber]`) | inline `prisma.order.*` + `requireCustomer` | Customer order history | `GET /customers/me/orders{,/:n}` | 🟠 |
| `src/app/(site)/account/profile/page.tsx` | inline prisma counts (orders, events, savedBooks) | Profile stats | `GET /customers/me/stats` | 🟡 |
| `src/app/(site)/order-success/[orderNumber]/page.tsx` | `fetchPublicApi()` | Post-checkout confirmation | `GET /orders/confirmation/:orderNumber` | 🟡 public order-number capability; response is confirmation-safe |
| `src/app/(site)/account/login` + `register` pages | `getCurrentCustomer()` redirect guard | Auth gating | `GET /auth/customer/me` server-side | 🟠 |
| 11 admin pages (`admin/(protected)/**`) | inline prisma queries | All admin lists/details/stats | `GET /admin/*` family | 🟠 |

## D. Client-only libs with NO backend dependency (no migration needed)

`lib/cart-client.ts` (localStorage cart) · `lib/consent-client.ts` (localStorage consent + anonymous ID) · `lib/format.ts` · `lib/constants.ts` — these stay in the frontend as-is. `tracking-client.ts` stays too, only its target URL changes.
