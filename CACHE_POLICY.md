# Cache Policy

This project separates the public storefront from private customer and admin state.
Public catalogue pages are safe to cache briefly. Cart, checkout, order, admin, and
API routes must always render from the current request.

## Public Routes

| Route | Runtime behavior | Revalidation | Notes |
| --- | --- | ---: | --- |
| `/` | ISR/public cached | 300 seconds | Homepage sections use tagged public data cache. |
| `/books` | ISR/public cached by URL/search query | 60 seconds | Filters and search are cached briefly and invalidated on catalogue edits. |
| `/search` | ISR/public cached by URL/search query | 60 seconds | Same catalogue cache rules as `/books`. |
| `/books/[slug]` | ISR/public cached | 300 seconds | Invalidated by exact book slug after admin edits or stock changes. |
| `/sitemap.xml` | ISR/public cached | 3600 seconds | Invalidated on catalogue mutations. |
| Policy/about/contact pages | Static by default | Build/static | No request-specific data. |

## Dynamic And No-Store Routes

These routes are intentionally dynamic and should not be cached by a CDN or shared
proxy:

- `/cart`
- `/checkout`
- `/order-success/[orderNumber]`
- `/admin/*`
- `/api/*`

The Next route segments use `force-dynamic`/`force-no-store` where applicable, and
`next.config.ts` adds private `Cache-Control` headers for these route groups.

## Data Cache Tags

Public read-heavy data uses `unstable_cache` with tags:

- `public:catalogue`
- `public:home`
- `public:books`
- `public:categories`
- `public:tags`
- `public:settings`
- `public:book:<slug>`

Admin mutations call `revalidatePublicCatalogue()` or `revalidatePublicSettings()`
from `src/lib/cache-invalidation.ts`.

## Invalidation Rules

| Mutation | Cache action |
| --- | --- |
| Create/update/archive/delete book | Revalidate homepage, catalogue, search, sitemap, and affected book slug. |
| Create/update/archive category | Revalidate homepage, catalogue, search, and sitemap. |
| Create/update/archive tag | Revalidate catalogue and search. |
| Confirm order | Reduce stock, then revalidate affected book slugs and catalogue sections. |
| Cancel confirmed order before delivery | Restore stock, then revalidate affected book slugs and catalogue sections. |
| Update delivery settings | Revalidate public settings and dynamic cart/checkout paths. |

## Do Not Cache

- Checkout POST responses
- Manual payment transaction IDs
- Admin dashboard/order/book-management data
- CSV export responses
- Upload responses
- Health-check responses

## CDN Notes

Let the CDN cache public static assets and ISR outputs, but bypass or respect
private no-store headers for `/api/*`, `/admin/*`, `/cart`, `/checkout`, and
`/order-success/*`.
