# Ayesha-Sharif Publication

E-commerce bookstore for a Bangladeshi publishing house. Public book catalogue with search/filters, customer accounts (email/phone + Google login), guest and authenticated checkout, manual payment verification (COD / bKash / Nagad / Rocket), consent-aware recommendations, and a protected admin panel with an editable site-content CMS.

The backend is **split between a Next.js frontend and a standalone NestJS service** (`apps/api`). Customer-facing APIs already run on NestJS, while some admin APIs and a small set of compatibility routes still live in Next.js during the remaining migration work.

## Architecture

```
┌─ Next.js 15 (port 3000) ──────────────┐   ┌─ NestJS 11 (port 4000) ─────────────┐
│ • Public storefront (RSC + client)    │   │ • Customer auth (email/phone +      │
│ • Customer account pages              │──▶│   Google OAuth), profile, password  │
│ • Admin panel (still owns admin API   │   │ • Checkout / order creation         │
│   routes + server actions)            │   │ • Recommendations + event tracking  │
│ • Legacy /api/* routes (fallback)     │   │ • Rate limiting, Helmet, CORS       │
└──────────────┬────────────────────────┘   └──────────────┬──────────────────────┘
               └────────────── shared PostgreSQL (Prisma 7) ┘
```

Customer sessions are DB-backed httpOnly cookies **valid across both backends**, so the migration is invisible to logged-in users.

## Tech stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS
- **Backend (new):** NestJS 11 · Zod validation · @nestjs/throttler · Helmet
- **Database:** PostgreSQL · Prisma 7 (`@prisma/adapter-pg`), one shared schema with dual generators
- **Auth:** separate Admin (HMAC cookie) and Customer (DB sessions) systems · Google OAuth via `CustomerAuthProvider`
- **Cart:** client-side localStorage (no server cart)
- **Design:** "Editorial Calm" system — Crimson Text + Inter + Noto Serif Bengali, sage/forest/cream/gold tokens

## Setup

### 1. Frontend (Next.js)

```bash
npm install
cp .env.example .env                # fill DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev                         # http://localhost:3000
```

### 2. Backend (NestJS)

```bash
cd apps/api
npm install
cp .env.example .env                # same DATABASE_URL as root — exactly ONE line
npm run prisma:generate             # generates into apps/api/generated/prisma
npm run start:dev                   # http://localhost:4000
```

Both servers must run for customer features (account menu, checkout, recommendations). The primary health check is `http://localhost:4000/health` (real DB ping). The legacy Next.js route `http://localhost:3000/api/health` remains only as a compatibility endpoint until external monitors are migrated.

## Compatibility route status

| Route | Status | Replacement | Notes |
|---|---|---|---|
| `/api/health` | Compatibility | `GET /health` | Remove after monitor / hosting probe migration |
| `/api/account/me` | Compatibility | `GET /auth/customer/me` | Remove after external verification |
| `/api/recommendations` | Compatibility | `GET /recommendations`, `POST /recommendations/cart` | Remove after external verification |
| `/api/recommendation-events` | Compatibility | `POST /recommendations/events` | Remove after external verification |
| `/api/policies/[slug]` | Retained public JSON API | None | Keep unless product explicitly retires the public JSON surface |

## Default admin

- Email: `admin@ayeshasharif.com` · Password: `ChangeMe123!`

Change it immediately after first login (seed stores a bcrypt hash).

## Environment variables

Full reference: **[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)**. Highlights:

| App | Key variables |
|---|---|
| Next.js (root `.env`) | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_BASE_URL` (NestJS URL, **no `/api` prefix**) |
| NestJS (`apps/api/.env`) | `DATABASE_URL`, `API_PORT`, `FRONTEND_ORIGIN`, `NEXTAUTH_SECRET` (required in production), `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL` |

Google login setup: **[docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md)** (returns 503 until configured — everything else works without it).

## Folder structure

- `src/app/(site)` — public storefront + customer account pages
- `src/app/admin` — admin login + protected panel (books, orders, customers, categories, tags, site content, settings)
- `src/app/api` — remaining Next.js compatibility routes plus admin upload/export bridges
- `src/components` — site, books, account, checkout, admin UI
- `src/lib` — api-client (NestJS calls), cart/consent/tracking clients, Prisma readers, auth helpers
- `apps/api/src` — NestJS: customer-auth (incl. Google OAuth), customers, orders, recommendations, health, prisma, common (guards/contracts/filters)
- `prisma` — shared schema (15 models), migrations, seed
- `docs` — migration plan, API reference, testing guide, verification reports

## Key documentation

| Doc | Purpose |
|---|---|
| [NESTJS_BACKEND_MIGRATION_PLAN.md](docs/NESTJS_BACKEND_MIGRATION_PLAN.md) | Architecture, phases, risks, manual steps |
| [API_ROUTES.md](docs/API_ROUTES.md) | NestJS endpoint reference + old-vs-new behavior tables |
| [API_ROUTE_MIGRATION_MAP.md](docs/API_ROUTE_MIGRATION_MAP.md) | Every old route/action → new endpoint, with status |
| [API_TESTING_GUIDE.md](docs/API_TESTING_GUIDE.md) | curl tests, SQL verification queries, browser checklist |
| [PHASE_2_CUSTOMER_MIGRATION_VERIFICATION.md](docs/PHASE_2_CUSTOMER_MIGRATION_VERIFICATION.md) | Functional + OWASP-focused security verification report |
| [CACHE_POLICY.md](CACHE_POLICY.md) / [PRODUCTION_SCALING.md](PRODUCTION_SCALING.md) | Caching and scaling notes |

## Business rules

- Checkout supports **guests and logged-in customers** (orders link to the customer via session cookie).
- Manual bKash/Nagad/Rocket payments require a transaction ID and stay `pending` until an admin verifies; COD starts `unpaid`. Totals are always computed server-side.
- **Stock is reduced only when an admin confirms an order**; cancelling before delivery restores it.
- Books with order history cannot be deleted — archive instead.
- Recommendations and event tracking are consent-aware (customers must opt in to personalization; guests use a validated anonymous ID).
- Footer, contact, and about content are editable from Admin → Site Content.

## Deployment notes

- Managed PostgreSQL; pooled `DATABASE_URL` for multi-instance; `DIRECT_URL` for migrations if your provider separates them.
- **Only ports 80/443 public** — reverse-proxy the Next app and the API; port 4000 and 5432 must not be directly exposed.
- Same-domain (or same-site subdomain) deployment so the shared session cookie stays first-party.
- `NODE_ENV=production` on the API enables secure cookies; the API **refuses to boot without `NEXTAUTH_SECRET`** in production.
- Rate limiting: 100 req/min/IP global, 10/min on auth endpoints (in-memory — add proxy/WAF limits for multi-instance).
- Set `NEXT_PUBLIC_API_BASE_URL` at build time; replace local uploads with object storage before Phase 3 (see migration plan §10).
