# Environment Variables Reference

Never commit real values — only the `.env.example` files are tracked.

## Frontend — root `.env` (Next.js, port 3000)

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes (until Phase 4) | Prisma readers, old API routes, server actions | ⚠️ keep exactly ONE line (a duplicate empty `DATABASE_URL=` breaks env loading) |
| `DIRECT_URL` | declared, unused | — | verify hosting needs before removing |
| `NEXTAUTH_SECRET` | yes | admin HMAC tokens, customer ipHash | misnomer — NextAuth is not used |
| `NEXTAUTH_URL` | yes | `metadataBase` | |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | seed only | `prisma/seed.ts` | |
| `UPLOAD_PROVIDER` | `"local"` | upload route | Cloudinary vars are unused placeholders |
| `NEXT_PUBLIC_API_BASE_URL` | recommended | `src/lib/api-client.ts` (Phase 2F) | **No `/api` prefix** — e.g. `http://localhost:4000`. Browser-visible, inlined at build. |
| `NEXT_PUBLIC_API_URL` | legacy fallback | same | older name from Phase 2C; `API_BASE_URL` wins when both set |

Local dev works with neither `NEXT_PUBLIC_API_*` set — the client falls back to `http://localhost:4000`.

## Backend — `apps/api/.env` (NestJS, port 4000)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | same PostgreSQL DB as the Next app; ONE line only |
| `API_PORT` | no (4000) | |
| `FRONTEND_ORIGIN` | no (`http://localhost:3000`) | CORS allow-list, comma-separated, credentials enabled |
| `FRONTEND_URL` | for OAuth | post-OAuth redirect target (defaults to first `FRONTEND_ORIGIN`) |
| `NEXTAUTH_SECRET` | production | must equal the Next app's value (ipHash parity); dev fallback matches |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Google login | route returns 503 without them |
| `GOOGLE_CALLBACK_URL` | no (localhost default) | must match Google Console redirect URI |

## Rate limiting (Phase 2 verification)

Global: 100 req/min/IP (`@nestjs/throttler`, in-memory). Strict 10/min on `POST /auth/customer/register`, `POST /auth/customer/login`, `PUT /customers/me/password`. 429 on exceed. Production: add proxy/WAF-level limits for multi-instance deployments.

## Production checklist
1. `NODE_ENV=production` on the API — enables `secure` cookies.
2. Same-domain proxy (planned) so the session cookie covers both apps; until then `FRONTEND_ORIGIN` must list the exact frontend origin.
3. Set `NEXT_PUBLIC_API_BASE_URL` to the public API URL at **build time** (inlined into the client bundle).
4. Google Console: production origins + redirect URI (see `GOOGLE_OAUTH_SETUP.md`).
