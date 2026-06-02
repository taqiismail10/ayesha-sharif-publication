# Production Scaling And Load Balancing Guide

This MVP is designed to run cheaply at first, then scale into multiple app
instances when traffic grows. The main rule is simple: app servers must stay
stateless, and shared state must live in PostgreSQL, object storage, or signed
cookies.

## Request Flow

```mermaid
flowchart LR
  Visitor["Visitor browser"] --> CDN["CDN / edge cache"]
  CDN --> LB["Load balancer"]
  LB --> A["Next.js instance A"]
  LB --> B["Next.js instance B"]
  A --> Pool["PostgreSQL pooler"]
  B --> Pool
  Pool --> DB["Managed PostgreSQL"]
  A --> Storage["Object storage / image CDN"]
  B --> Storage
  CDN --> Static["Static assets and optimized images"]
```

## Runtime Shape

- Run the Next.js app as a stateless Node process.
- Do not rely on local disk for anything that must survive deploys or be visible
  across instances.
- Admin sessions are signed cookies, so no sticky sessions are required.
- Cart state is browser localStorage, so it does not require server affinity.
- Orders, books, settings, and admin data live in PostgreSQL.

## Route Caching

See `CACHE_POLICY.md` for the exact route classification. In short:

- Public catalogue pages use short ISR revalidation and tagged data caching.
- Cart, checkout, order success, admin, and API routes are force dynamic and
  private no-store.
- Admin mutations explicitly revalidate public catalogue tags and paths.

## CDN And HTTP Cache Rules

Recommended CDN behavior:

- Cache public static assets from `/logo/*`, `/banners/*`, `/book-covers/*`,
  `/sample-pages/*`, and `/uploads/*`.
- Respect `Cache-Control` headers from the Next app.
- Never cache `/api/*`, `/admin/*`, `/cart`, `/checkout`, or `/order-success/*`.
- Use Brotli/gzip compression for text assets.
- Keep image optimization enabled in Next, or use a dedicated image CDN.

`next.config.ts` already defines private no-store headers for sensitive routes
and public cache headers for local public asset folders.

## Image And Object Storage Readiness

Local uploads currently save to `public/uploads/books`. That is acceptable for
local development and very small single-instance hosting, but it is not safe for
horizontal scaling because one instance will not see files written by another.

Production migration path:

1. Keep `UPLOAD_PROVIDER=local` only for local development.
2. Add an upload provider module for Cloudinary, S3, Cloudflare R2, or another
   object store.
3. Store only the public asset URL in `Book.coverImage`, `Book.galleryImages`,
   and `Book.samplePdf`.
4. Configure `NEXT_PUBLIC_IMAGE_CDN_HOST` for an exact CDN hostname, or set
   `CLOUDINARY_CLOUD_NAME` for Cloudinary images.
5. Keep upload validation: allowed types, file size limits, and unique filenames.

Do not store uploaded assets in the app server filesystem when running more than
one instance.

## Prisma And PostgreSQL Pooling

Runtime code uses `DATABASE_URL`. For production, point `DATABASE_URL` at a
pooled PostgreSQL endpoint such as PgBouncer, Supabase pooler, Neon pooled
connection, or a provider-managed pool.

Migrations should use a direct database URL. `prisma.config.ts` prefers
`DIRECT_URL` when it exists and falls back to `DATABASE_URL` for local setup.

Recommended env shape:

```env
DATABASE_URL="postgresql://USER:PASSWORD@POOLER_HOST:5432/DB_NAME"
DIRECT_URL="postgresql://USER:PASSWORD@DIRECT_DB_HOST:5432/DB_NAME"
```

Notes:

- Keep Prisma client memoized per Node process.
- Do not create a new Prisma client inside every request.
- Limit app instance count to match the available database pool.
- Run migrations as a release step, not from every running app instance.

## Load Balancing

Use a managed load balancer or platform router in front of the Next instances.

Recommended settings:

- Health check: `GET /api/health`
- Sticky sessions: disabled
- TLS: terminate at the edge or load balancer
- Timeouts: long enough for admin CSV export and uploads, but not unlimited
- Instance count: scale based on CPU, memory, request latency, and DB pool usage

## Health Check

`/api/health` returns a small JSON response with no-store headers. It does not
query the database, so frequent load-balancer checks do not consume database
connections.

Example response:

```json
{
  "status": "ok",
  "service": "ayesha-sharif-publication",
  "environment": "production",
  "database": "not_checked",
  "checkedAt": "2026-06-02T00:00:00.000Z"
}
```

## What Not To Do

- Do not cache admin pages or checkout responses.
- Do not store customer/order data in local files.
- Do not run local uploads in multi-instance production.
- Do not expose `DATABASE_URL` or `DIRECT_URL` to the browser.
- Do not run migrations from each app instance on startup.
- Do not use sticky sessions as a substitute for stateless runtime design.

## Production QA Checklist

- `npm run lint`
- `npm run build`
- Verify `/`, `/books`, `/search`, and a book detail page load without database
  errors.
- Verify `/cart`, `/checkout`, `/admin`, and `/api/health` return no-store
  cache headers.
- Confirm admin book/category/tag/order changes update the storefront after
  invalidation.
- Confirm uploads use object storage before scaling beyond one instance.
