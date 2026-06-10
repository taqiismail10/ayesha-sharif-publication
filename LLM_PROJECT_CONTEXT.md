# Ayesha-Sharif Publication Project Context

Use this document as high-level context for an LLM or coding assistant working on this repository. It describes the product, architecture, route structure, data model, UI theme, workflows, and boundaries that should guide future changes.

## 1. Product Summary

Ayesha-Sharif Publication is a low-budget MVP e-commerce bookstore for a new Bangladeshi publishing house. The site sells books directly to readers without customer accounts. It supports:

- Public browsing, search, filtering, and book detail pages.
- Guest cart stored in browser localStorage.
- Guest checkout with delivery charges.
- Cash on Delivery and manual mobile payments through bKash, Nagad, and Rocket.
- A protected admin panel for books, categories, tags, orders, delivery settings, upload handling, invoices, and CSV order export.

The business workflow is intentionally manual. Payment verification, stock confirmation, and delivery updates are handled by admins rather than automated gateway or courier integrations.

## 2. Core Theme and Brand Direction

The product should feel like a trustworthy, simple, premium-but-affordable Bangladeshi bookstore.

- Brand name: Ayesha-Sharif Publication.
- Tagline: Quality books from Ayesha-Sharif Publication, delivered to your doorstep.
- Audience: Bangladeshi readers, students, parents, and publication staff.
- Tone: Clear, practical, direct, trustworthy.
- Visual mood: clean bookstore, soft cream page background, deep navy authority, gold highlights, emerald action buttons.
- Avoid: flashy marketplace behavior, customer account complexity, fake automation, and generic SaaS marketing language.

Design tokens are defined in `tailwind.config.ts` and mirrored in `src/app/globals.css` and `src/lib/constants.ts`:

- `navy`: `#10233F`
- `cream`: `#F7F1E3`
- `gold`: `#C9A227`
- `emerald`: `#0F766E`
- `danger`: `#B42318`
- `ink`: `#111827`
- `muted`: `#6B7280`
- `line`: `#E5E7EB`
- `page`: `#FFFCF6`

Use rounded `md` or `lg` panels, thin borders, simple shadows, and dense admin tables. Buttons are generally navy, emerald, gold-accented, or bordered. Icons come from `lucide-react`.

## 3. Technology Stack

- Framework: Next.js 15 App Router.
- Language: TypeScript with strict mode.
- UI: React 19 and Tailwind CSS.
- Database: PostgreSQL.
- ORM: Prisma 7 with `@prisma/adapter-pg`.
- Validation: Zod.
- Auth: custom admin-only signed cookie auth, not NextAuth, even though env names use `NEXTAUTH_*`.
- Passwords: bcryptjs.
- Cart: browser localStorage.
- Icons: lucide-react.

Important scripts from `package.json`:

- `npm run dev`: start Next.js dev server.
- `npm run build`: production build.
- `npm run lint`: ESLint.
- `npm run prisma:generate`: generate Prisma client.
- `npm run prisma:migrate`: run Prisma migrations in dev.
- `npm run prisma:studio`: open Prisma Studio.
- `npm run seed`: seed admin, categories, tags, books, banners, and settings.

## 4. Repository Structure

Top-level layout:

- `src/app`: App Router pages, layouts, metadata, API routes, robots, sitemap.
- `src/app/(site)`: public storefront routes.
- `src/app/admin`: admin login, server actions, protected admin routes.
- `src/app/api`: checkout, admin uploads, and order export APIs.
- `src/components`: reusable site, book, cart, checkout, and admin components.
- `src/lib`: shared constants, data access, Prisma client, auth, validation, cart helpers, formatting, settings, and order utilities.
- `src/types`: shared app-level TypeScript types.
- `prisma`: schema, migration, and seed script.
- `public`: static assets such as logo, favicon, banner images, and runtime uploads under `public/uploads/books`.

The project uses the `@/*` path alias for `src/*`.

## 5. Public Storefront Routes

Public routes live under `src/app/(site)`.

- `/`: homepage with hero, featured books, new arrivals, discounts, upcoming books, best sellers, categories, trust/benefit blocks, and WhatsApp assistance.
- `/books`: searchable/filterable catalogue using `BookListView`.
- `/books/[slug]`: book detail page with metadata, JSON-LD, cover/gallery, pricing, purchase panel, description, sample PDF link, and related books.
- `/search`: search page, built around the same book list behavior.
- `/cart`: client cart review page with quantity controls and delivery estimate.
- `/checkout`: guest checkout form and order summary.
- `/order-success/[orderNumber]`: confirmation page that reads the persisted order.
- `/about`, `/contact`, `/delivery-policy`, `/payment-policy`, `/return-policy`, `/privacy-policy`, `/terms-and-conditions`: informational pages.

The public layout wraps pages with `Header` and `Footer`. Header includes logo, desktop/mobile nav, search, and cart link. Footer includes logo, public nav, policies, admin login link, and placeholder contact details.

## 6. Admin Routes

Admin routes live under `src/app/admin`.

- `/admin/login`: admin login page.
- `/admin/unauthorized`: unauthorized role landing page.
- `/admin`: dashboard with book counts, order counts, revenue, low stock, and recent orders.
- `/admin/books`: book listing, search, archive/delete/preview/edit actions.
- `/admin/books/new`: create book.
- `/admin/books/[id]/edit`: edit book.
- `/admin/books/[id]/preview`: admin book preview.
- `/admin/orders`: order listing with search, filters, CSV export link.
- `/admin/orders/[id]`: order detail and status/payment/courier/admin-note update form.
- `/admin/orders/[id]/invoice`: printable invoice.
- `/admin/categories`: create/edit/archive categories.
- `/admin/tags`: create/edit/archive tags.
- `/admin/settings`: delivery charge settings.

Protected admin routes use `requireAdmin()` in the protected layout or page-level role checks. The shell is `src/components/admin/admin-shell.tsx`.

## 7. API Routes and Server Actions

API routes:

- `POST /api/orders`: validates checkout payload, loads current books, checks purchasable status and stock, calculates totals, creates order and order items.
- `POST /api/admin/upload`: admin-only upload endpoint for cover/gallery/sample files. It accepts JPG, PNG, WebP, and sample PDFs, then writes to `public/uploads/books`.
- `GET /api/admin/orders/export`: admin/order-manager CSV export with optional filters.

Server actions live in `src/app/admin/actions.ts`:

- Login/logout.
- Create/update/archive/delete book.
- Create/update/archive category.
- Create/update/archive tag.
- Update order status, payment status, courier info, tracking number, and admin note.
- Update delivery charges.

Stock rules are important:

- Checkout does not reduce stock.
- Stock is reduced only when an admin changes an order to `confirmed`.
- If a stock-reduced order is cancelled before delivery, stock is restored.
- Books with order items cannot be deleted; archive them instead.

## 8. Data Access and Fallback Behavior

Data helpers are mainly in `src/lib/data.ts`.

Public book data supports a graceful sample-data fallback:

- `getHomeData()`
- `getBooks()`
- `getBookBySlug()`

If `DATABASE_URL` is missing or invalid, these functions return sample content from `src/lib/sample-data.ts`, allowing the storefront catalogue to preview without PostgreSQL.

Database readiness is checked by `hasUsableDatabaseUrl()` in `src/lib/env.ts`. The Prisma client in `src/lib/prisma.ts` is a lazy proxy; it throws only when a real Prisma operation is attempted without a usable database URL. This allows pages that use sample data to render before the database is configured.

Not every route has fallback behavior. Real checkout, admin pages, order success, and database-backed mutations require PostgreSQL.

## 9. Prisma Data Model

Schema location: `prisma/schema.prisma`.

Main models:

- `Admin`: admin users with role, email, password hash, active flag.
- `Book`: catalogue item with slug, metadata, prices, stock, status, images, sample PDF, feature flags, category, tags, and order items.
- `Category`: active/archiveable grouping for books.
- `Tag`: active/archiveable labels for filtering and book badges.
- `BookTag`: many-to-many join between books and tags.
- `Order`: guest customer/order/payment/delivery record.
- `OrderItem`: book snapshot, quantity, unit price, total price.
- `Banner`: homepage or promotional banner records.
- `SiteSetting`: JSON settings such as delivery charges and contact info.

Enums:

- `AdminRole`: `super_admin`, `admin`, `editor`, `order_manager`.
- `BookStatus`: `draft`, `upcoming`, `pre_order`, `published`, `out_of_stock`, `archived`.
- `PaymentMethod`: `cash_on_delivery`, `bkash`, `nagad`, `rocket`.
- `PaymentStatus`: `unpaid`, `pending`, `paid`, `failed`, `refunded`.
- `OrderStatus`: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`.

Public catalogue statuses are `published`, `pre_order`, `upcoming`, and `out_of_stock`. Purchasable statuses are `published` and `pre_order`, and the book must have enough stock.

## 10. Checkout and Order Flow

1. Visitor browses books and adds available books to cart.
2. Cart is stored in localStorage under `asp_guest_cart`.
3. Checkout collects name, Bangladeshi phone number, optional email, shipping address, district, delivery area, payment method, optional note, and transaction ID for manual mobile payments.
4. Client posts to `/api/orders`.
5. Server validates with `checkoutSchema`.
6. Server verifies book availability and stock against the database.
7. Server calculates subtotal, discount, delivery charge, and grand total.
8. Server creates an order number like `ASP-YYMMDD-1234`.
9. Order is created with order items.
10. Cart is cleared on success and user is redirected to `/order-success/[orderNumber]`.
11. Admin later verifies payment, confirms order, reduces stock, and manages delivery status.

Manual payment methods require a transaction ID. Cash on Delivery starts as `unpaid`; mobile payment methods start as `pending` verification.

## 11. Cart Behavior

Cart code is in `src/lib/cart-client.ts` and is client-only.

- Storage key: `asp_guest_cart`.
- Event name: `asp_cart_changed`.
- `addCartItem()` merges by `bookId` and clamps quantity to stock.
- `useCart()` exposes items, count, setQuantity, removeItem, and clear.
- Cart items snapshot title, slug, author, cover image, prices, stock quantity, and quantity.

Because cart state is client-side, server checkout must always revalidate book IDs, status, stock, and prices from the database.

## 12. Validation and Formatting

Validation lives in `src/lib/validators.ts`.

- Bangladeshi phone numbers must match `^(\+?88)?01[3-9]\d{8}$`.
- Checkout requires at least one item.
- Manual payment methods require a transaction ID.
- Slugs must be lowercase URL-friendly strings.
- Book, category, and tag forms are validated with Zod.

Formatting utilities live in `src/lib/format.ts`.

- `formatCurrency()` formats values as BDT with no decimal places.
- `formatDate()` uses `en-BD`.
- `slugify()` lowercases and hyphenates ASCII slugs.
- `toNumber()` converts Prisma decimals and nullable values to numbers.

## 13. UI Components

Important shared components:

- `src/components/site/header.tsx`: public header, nav, search, cart link.
- `src/components/site/footer.tsx`: footer, policy links, contact placeholders.
- `src/components/site/empty-state.tsx`: reusable empty state.
- `src/components/site/policy-page.tsx`: policy content wrapper.
- `src/components/books/book-section.tsx`: homepage/recommendation sections.
- `src/components/books/product-card.tsx`: catalogue card and add-to-cart button.
- `src/components/books/book-cover.tsx`: cover image or generated fallback cover.
- `src/components/books/book-purchase-panel.tsx`: quantity picker, add to cart, buy now.
- `src/components/books/book-list-view.tsx`: search/filter/sort UI and grid.
- `src/components/cart/cart-page-client.tsx`: cart page client UI.
- `src/components/checkout/checkout-page-client.tsx`: checkout page client UI.
- `src/components/admin/admin-shell.tsx`: protected admin navigation shell.
- `src/components/admin/admin-book-form.tsx`: create/edit book form.
- `src/components/admin/upload-field.tsx`: client upload helper.
- `src/components/admin/login-form.tsx`: server-action-backed login form.
- `src/components/admin/stat-card.tsx`, `print-button.tsx`: admin support components.

## 14. Auth and Roles

Auth lives in `src/lib/auth.ts`.

- Cookie name: `asp_admin_session`.
- Session lifetime: 7 days.
- Token format: base64url JSON payload plus HMAC SHA-256 signature.
- Secret: `NEXTAUTH_SECRET`, with development fallback.
- Passwords are hashed with bcrypt.

Role expectations:

- `super_admin`: full control.
- `admin`: broad control, including settings and most mutations.
- `editor`: content/catalogue management, not order settings.
- `order_manager`: order management and order CSV export.

Always keep protected admin mutations behind `assertAdminRole()` and protected pages behind `requireAdmin()` with the appropriate role list.

## 15. Seed Data

Seed script: `prisma/seed.ts`.

It creates or updates:

- Default super admin.
- Categories: Academic Books, Islamic Books, Children Books, Literature, Admission Books.
- Tags: New, Discount, Upcoming, Published, Pre-order, Best Seller, Bangla, English.
- Sample book catalogue.
- Banner records.
- Delivery charge settings.
- Contact settings.

Default admin from README and seed:

- Email: `admin@ayeshasharif.com`
- Password: `ChangeMe123!`

This password must be changed after first login.

## 16. SEO and Metadata

Global metadata is in `src/app/layout.tsx`.

- `metadataBase` uses `NEXTAUTH_URL` or `http://localhost:3000`.
- Default title: Ayesha-Sharif Publication.
- Open Graph image defaults to `/banners/homepage-banner.png`.
- Book detail pages generate per-book metadata and JSON-LD `Book` structured data.
- `src/app/robots.ts` and `src/app/sitemap.ts` provide crawlers with site metadata.

The root layout also includes a small script that removes certain browser extension mutations to reduce hydration mismatch issues.

## 17. Assets and Uploads

Static assets currently include:

- `public/logo/logo.png`
- `public/logo/logo-white.png`
- `public/favicon/favicon.ico`
- `public/banners/homepage-banner.png`

Uploaded book files are stored locally in `public/uploads/books`. Local upload storage is acceptable for MVP development, but production should use Cloudinary, S3, or another object storage provider.

## 18. Coding Conventions for Future Work

- Prefer existing Tailwind utility patterns and design tokens.
- Keep the public site simple and purchase-focused.
- Keep admin screens dense, operational, and table/form driven.
- Use server components for data-heavy pages where possible.
- Use client components only for browser state, localStorage, uploads, forms needing client interactivity, and imperative navigation.
- Validate all user-provided data with Zod or explicit checks.
- Revalidate affected paths after server actions that change visible data.
- Never trust cart prices or stock from localStorage during checkout.
- Preserve the manual operations model unless explicitly asked to add automation.
- Archive books/categories/tags when preserving history matters.
- Use `formatCurrency`, `formatDate`, `slugify`, and existing constants rather than duplicating logic.
- Avoid adding customer accounts, payment gateway logic, courier integration, reviews, wishlists, SMS automation, or loyalty features unless the product scope changes.

## 19. Known Gaps and Launch Notes

- README references `.env.example`, but this repository snapshot does not include it.
- Contact values are placeholders and must be replaced before launch.
- Manual payment instructions mention merchant numbers but no merchant numbers are currently stored in constants/settings.
- Uploads are local filesystem based.
- The public fallback sample data is for preview only; real checkout and admin workflows require PostgreSQL.
- No automated tests are present in this snapshot.
- No customer authentication exists by design.
- No real payment gateway or courier API exists by design.

## 20. One-Paragraph LLM Brief

This is a Next.js 15, TypeScript, Tailwind, Prisma/PostgreSQL MVP bookstore for Ayesha-Sharif Publication, a Bangladeshi publishing house. It has a public catalogue with sample-data fallback, guest localStorage cart, guest checkout, manual payment methods, and a protected admin panel for catalogue/order operations. The visual identity is clean, trustworthy, and bookstore-like, using navy, cream, gold, emerald, and restrained cards/tables. The core business rule is manual fulfillment: orders are created at checkout, admins verify payment and confirm orders, and stock is reduced only on admin confirmation. Future changes should preserve this simple MVP scope and reuse existing helpers, validation, constants, Prisma schema, and UI patterns.
