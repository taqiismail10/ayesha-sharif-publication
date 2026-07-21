# API Foundation Setup (Phase 0)

Historical Phase 0 note for the original NestJS foundation at `apps/api`. The current repository has progressed beyond this snapshot: customer-facing APIs already run on NestJS, while some admin APIs and compatibility routes still remain in Next.js. Use `README.md` and `docs/API_ROUTE_MIGRATION_MAP.md` for the current state.

---

## Layout

```
F:\Project\AS_Publications\
├── prisma/schema.prisma     ← shared schema (one ADDITIVE generator block added, models untouched)
├── src/…                    ← Next.js app, unchanged
├── apps/api/                ← NEW: NestJS backend (own package.json, own node_modules)
│   ├── src/
│   │   ├── main.ts          (helmet, cookie-parser, CORS, global ValidationPipe)
│   │   ├── app.module.ts    (ConfigModule global, Prisma, Health, Prisma exception filter)
│   │   ├── config/env.ts    (hasUsableDatabaseUrl — mirrors Next's src/lib/env.ts)
│   │   ├── prisma/          (PrismaModule global + PrismaService with pg driver adapter)
│   │   ├── health/          (GET /health with real DB ping)
│   │   └── common/filters/  (Prisma P2002→409, P2025→404)
│   ├── generated/prisma/    ← generated client (gitignored)
│   ├── .env.example
│   └── package.json
└── docs/
```

**Why not npm workspaces yet:** moving the Next app to `apps/web` or hoisting dependencies risks breaking its build. `apps/api` is fully standalone (own lockfile/node_modules). Workspace conversion can happen later as its own low-risk step.

**Prisma dual-generator:** the shared `prisma/schema.prisma` now has two generators — the original `client` (unchanged, → root node_modules, used by Next) and `apiClient` (→ `apps/api/generated/prisma`, used by the API). Both run on every `prisma generate` from either location. Models were not modified.

---

## Install

```bash
# Frontend deps (unchanged)
npm install

# Backend deps
cd apps/api
npm install
npm run prisma:generate     # generates client into apps/api/generated/prisma
```

## Run

```bash
# Next.js frontend (port 3000) — from repo root
npm run dev

# NestJS backend (port 4000) — from apps/api
cd apps/api
cp .env.example .env        # then fill DATABASE_URL (same value as the root .env)
npm run start:dev           # watch mode
# or: npm run build && npm start
```

## Environment variables (`apps/api/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | for DB features | — | Same PostgreSQL URL the Next app uses. API boots without it (health reports `not_configured`). |
| `API_PORT` | no | `4000` | |
| `FRONTEND_ORIGIN` | no | `http://localhost:3000` | CORS origin(s), comma-separated, `credentials: true`. |

No variables were renamed; `NEXTAUTH_SECRET` stays in the root `.env` untouched (auth migrates in Phase 2/3).

## Health check

```bash
curl http://localhost:4000/health
# → {"status":"ok","service":"asp-api","environment":"…","database":"ok|unreachable|not_configured","checkedAt":"…"}
```

Unlike the old Next `/api/health` (which always said `not_checked`), this runs a real `SELECT 1` when a database is configured.

---

## Known risks

1. **Dual Prisma generators**: `prisma generate` from the root now also writes `apps/api/generated/prisma`. If `apps/api/` were ever deleted, remove the `apiClient` generator block from `prisma/schema.prisma` too.
2. **Schema drift discipline**: there is ONE schema. Never copy it into `apps/api`; always regenerate both clients after schema changes.
3. **No production hardening yet**: no rate limiting, no request logging, no graceful-shutdown hooks beyond Prisma disconnect. Planned for later phases.
4. **Port 4000** must be free locally; change `API_PORT` if it collides.

## What is intentionally NOT done (Phase 0 scope)

- No admin APIs, uploads, or site-content endpoints
- At Phase 0 there were no frontend changes — this is no longer true in the current repository state
- No env renames, no file deletions, no workspace conversion
