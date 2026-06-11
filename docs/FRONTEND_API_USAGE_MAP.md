# Frontend API Usage Map

Every frontend dependency on the old backend, by mechanism. Risk level = blast radius if the migration of that call breaks (🔴 checkout/auth-critical · 🟠 visible feature · 🟡 degraded-gracefully).

## A. Client-side `fetch()` (5 call sites — the only true HTTP dependencies)

| Frontend file | API called | Feature | Old route/function | Proposed NestJS endpoint | Risk level |
|---|---|---|---|---|---|
| `src/components/checkout/checkout-page-client.tsx` | `POST /api/orders` | Checkout submit | `app/api/orders/route.ts` | `POST /orders` | 🔴 revenue path |
| `src/components/site/account-menu.tsx` | `GET /api/account/me` | Header login state (renders on every page) | `app/api/account/me/route.ts` | `GET /auth/customer/me` | 🟠 every-page header |
| `src/components/admin/upload-field.tsx` | `POST /api/admin/upload` | Book cover/gallery/PDF upload | `app/api/admin/upload/route.ts` | `POST /admin/uploads` | 🟠 admin workflow |
| `src/components/books/client-recommendation-section.tsx` | `GET /api/recommendations`, `POST /api/recommendations` | Personalized + cart recommendations | `app/api/recommendations/route.ts` | `GET /recommendations`, `POST /recommendations/cart` | 🟡 section self-hides on failure |
| `src/lib/tracking-client.ts` (used by `product-card`, `book-interaction-tracker`, `book-sample-link`) | `POST /api/recommendation-events` | Interaction tracking | `app/api/recommendation-events/route.ts` | `POST /recommendations/events` | 🟡 fire-and-forget |

Also: admin orders page links directly to `GET /api/admin/orders/export` (anchor href, not fetch) → `GET /admin/orders/export.csv` — 🟡.

## B. Server-Action form bindings (convert with Phase 2/3, form-by-form)

| Frontend file | Action(s) used | Feature | Proposed NestJS endpoint | Risk level |
|---|---|---|---|---|
| `src/components/admin/login-form.tsx` | `loginAction` | Admin login | `POST /auth/admin/login` | 🔴 admin lockout if broken |
| `src/components/admin/admin-shell.tsx` | `logoutAction` | Admin logout | `POST /auth/admin/logout` | 🟡 |
| `src/components/account/customer-auth-form.tsx` | `registerCustomerAction`, `loginCustomerAction` | Customer register/login | `POST /auth/customer/{register,login}` | 🔴 |
| `src/components/account/customer-profile-form.tsx` | `updateCustomerProfileAction` | Profile edit | `PUT /customers/me/profile` | 🟠 |
| `src/components/account/customer-password-form.tsx` | `changeCustomerPasswordAction` | Password change | `PUT /customers/me/password` | 🟠 |
| `src/app/admin/(protected)/books/new` + `[id]/edit` + list pages | book CRUD actions | Book management | `/admin/books*` | 🟠 |
| `src/app/admin/(protected)/categories/page.tsx` | category actions | Category management | `/admin/categories*` | 🟠 |
| `src/app/admin/(protected)/tags/page.tsx` | tag actions | Tag management | `/admin/tags*` | 🟠 |
| `src/app/admin/(protected)/orders/[id]/page.tsx` | `updateOrderAction` | Order status + stock | `PATCH /admin/orders/:id` | 🔴 stock integrity |
| `src/app/admin/(protected)/settings/page.tsx` | `updateDeliverySettingsAction` | Delivery charges | `PUT /admin/settings/delivery-charges` | 🟠 |
| `src/app/admin/(protected)/site-content/page.tsx` + `components/admin/content-form-section.tsx` | 3 site-content actions | CMS editing | `PUT /admin/site-content/*` | 🟡 |

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
| `src/app/(site)/order-success/[orderNumber]/page.tsx` | inline `prisma.order.findUnique` | Post-checkout confirmation | `GET /orders/:orderNumber/public` | 🟠 |
| `src/app/(site)/account/login` + `register` pages | `getCurrentCustomer()` redirect guard | Auth gating | `GET /auth/customer/me` server-side | 🟠 |
| 11 admin pages (`admin/(protected)/**`) | inline prisma queries | All admin lists/details/stats | `GET /admin/*` family | 🟠 |

## D. Client-only libs with NO backend dependency (no migration needed)

`lib/cart-client.ts` (localStorage cart) · `lib/consent-client.ts` (localStorage consent + anonymous ID) · `lib/format.ts` · `lib/constants.ts` — these stay in the frontend as-is. `tracking-client.ts` stays too, only its target URL changes.
