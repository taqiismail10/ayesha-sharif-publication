# Ayesha-Sharif Publication

Low-budget MVP e-commerce bookstore for a new Bangladeshi publishing house. It supports a public book catalogue, guest checkout, manual payment, manual delivery updates, and a protected admin panel.

## Tech stack

- Next.js + TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Custom admin-only cookie auth
- Guest cart with localStorage

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Fill `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
   Use `DIRECT_URL` for migrations if your production database provides a
   separate direct connection and pooled runtime connection.

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed the database:

```bash
npm run seed
```

6. Start development server:

```bash
npm run dev
```

## Default admin

- Email: `admin@ayeshasharif.com`
- Password: `ChangeMe123!`

Change the default admin password immediately after the first login. The seed script stores a hashed password in the database.

## Environment variables

See [.env.example](.env.example).

- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: optional direct PostgreSQL URL for Prisma migrations
- `NEXTAUTH_SECRET`: secret used to sign admin sessions
- `NEXTAUTH_URL`: public site URL
- `ADMIN_SEED_EMAIL`: optional seed admin email
- `ADMIN_SEED_PASSWORD`: optional seed admin password
- `UPLOAD_PROVIDER`: currently `local`
- `CLOUDINARY_*`: reserved for future hosted uploads
- `NEXT_PUBLIC_IMAGE_CDN_HOST`: exact CDN/object-storage host allowed by Next Image

## Folder structure

- `src/app/(site)`: public bookstore pages
- `src/app/admin`: admin login and protected admin panel
- `src/app/api`: checkout, upload, and export routes
- `src/components`: shared public and admin UI components
- `src/lib`: Prisma, auth, validation, cart totals, formatting, and data helpers
- `prisma`: schema and seed data
- `public`: logo, favicon, banners, book covers, sample pages, and uploads

## MVP notes

- No customer accounts, login, wishlist, reviews, loyalty points, SMS automation, courier API, or real payment gateway.
- Checkout is guest-only.
- Manual bKash, Nagad, and Rocket require transaction IDs and remain pending until admin verifies payment.
- Stock is reduced only when an admin changes an order to `confirmed`.
- If an order is cancelled before delivery and stock was reduced, stock is restored.
- Books with existing order items cannot be deleted; archive them instead.

## Deployment notes

- Use a managed PostgreSQL database.
- Use a pooled runtime `DATABASE_URL` when running multiple app instances.
- Use `DIRECT_URL` for migrations when your provider separates direct and pooled URLs.
- Set a strong `NEXTAUTH_SECRET`.
- Keep `/admin` behind HTTPS.
- For production uploads, replace local uploads with Cloudinary or object storage.
- Add final phone, WhatsApp, email, Facebook, and office address before launch.
- Health check endpoint: `/api/health`.
- Cache and scaling docs: [CACHE_POLICY.md](CACHE_POLICY.md) and [PRODUCTION_SCALING.md](PRODUCTION_SCALING.md).
