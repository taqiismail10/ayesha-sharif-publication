# Customer Accounts And Recommendations Plan

This phase expands the original guest-only bookstore into optional customer
accounts and privacy-safe recommendations without changing the admin auth model
or forcing customers to register.

## Safety Principles

- Guest checkout remains fully supported.
- Admin authentication remains separate in `src/lib/auth.ts` with
  `asp_admin_session`.
- Customer authentication uses a new DB-backed session model and a separate
  `asp_customer_session` cookie.
- Orders keep their existing customer snapshot fields. Logged-in orders add a
  nullable `customerId`; guest orders keep `customerId = null`.
- Stock reduction continues to happen only when admin confirms an order.
- Manual payment verification remains admin-managed.
- Account, order history, personalized recommendation, consent, and event routes
  are dynamic/private/no-store.
- Anonymous personalization only starts after explicit personalization consent.

## Database Migration Needed

Add:

- `Customer`
- `CustomerProfile`
- `CustomerSession`
- `CustomerBookEvent`
- `CustomerPreference`
- `SavedBook`
- `CustomerBookEventType` enum
- Nullable `Order.customerId` relation and index
- Event indexes for customer, anonymous ID, and book/event queries

No existing order fields become required or renamed.

## Authentication Plan

- Create `src/lib/customer-auth.ts`.
- Hash customer passwords with existing bcrypt helpers.
- Generate random session tokens, store only SHA-256 hashes in
  `CustomerSession.tokenHash`.
- Read/write `asp_customer_session` as httpOnly, secure in production, sameSite
  lax, path `/`.
- Add customer-only helpers: current customer, require customer, create session,
  clear session.
- Keep customer helpers out of admin authorization.

## Checkout Plan

- Server-render checkout with optional current customer/profile data.
- Prefill form fields for logged-in customers.
- API order creation reads customer session from the request and attaches
  `customerId` only when logged in.
- Guests matching an existing phone/email are not auto-linked.

## Recommendations Plan

- Implement `src/lib/recommendations.ts`.
- Similar books use explainable metadata scoring: category, tags, author,
  language, stock, discount, and status.
- Personalized recommendations use customer events, order history, and saved
  preferences for logged-in customers.
- Anonymous recommendations use only events tied to a random anonymous ID after
  consent.
- No-consent/no-login fallback uses best sellers, featured books, and new
  arrivals.
- Personalized recommendation routes and components stay dynamic/private.

## Consent And Tracking Plan

- Add a cookie banner and `/cookie-settings`.
- Categories: necessary, personalization, analytics placeholder, marketing
  placeholder.
- Necessary cart/session cookies remain available.
- Anonymous recommendation ID is created only after personalization consent.
- Event writes validate book ID/event type and fail silently from the UI.
- Retention policy: delete anonymous recommendation events older than 180 days.

## UI Plan

- Header gets account actions while keeping cart visible.
- Add account register/login/profile/orders pages.
- Add homepage/cart/book-detail recommendation sections.
- Add privacy/cookie policy wording in simple, non-legalistic language.
- Add minimal admin customer visibility through order detail/list and a customer
  list if role checks remain simple.
