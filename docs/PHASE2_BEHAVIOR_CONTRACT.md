# Phase 2 Behavior Contract — Customer-Facing Writes

Documented **before** implementation, from the live Next.js code. The NestJS port must match these behaviors unless a deviation is explicitly listed in §13.

## 1. Customer register (`registerCustomerAction`)

**Input** (form fields): `name`, `email?`, `phone?`, `password`, `confirmPassword`
**Validation** (`customerRegisterSchema`): name trim min 2 · email optional, normalized lowercase · phone optional, normalized BD (`+88`/`88` prefixes stripped, spaces/dashes removed) and must match `^01[3-9]\d{8}$` · password 8–128 · confirmPassword must equal password · **at least one of email/phone required**.
**Effect:** creates `Customer` + nested `CustomerProfile` (displayName/email/phone) + empty `CustomerPreference`, bcrypt-hashes password (cost 12), creates session, sets cookie.
**Errors:** first Zod issue message; Prisma `P2002` → `"An account with this email or phone may already exist."`; other → generic failure message.
**Output:** redirect to `/account/profile` (Next-only concern; API returns JSON instead).

## 2. Customer login (`loginCustomerAction`)

**Input:** `identifier` (min 5), `password`, `redirectTo?`
**Identifier resolution:** contains `@` → treat as email (normalized); else normalize as BD phone and only use if it matches `^01[3-9]\d{8}$`. Lookup `Customer.findFirst({ OR: [email?, phone?] })`.
**Checks:** bcrypt compare (only when a customer row was found — no timing equalization); customer must be `isActive`. All failures return the same generic `"Invalid email/phone or password."`
**Effect:** updates `lastLoginAt`, creates session + cookie.
**Output:** redirect to safe `redirectTo` or `/account/profile` (frontend concern).

## 3. Logout (`logoutCustomerAction`)

Reads cookie → deletes the matching `CustomerSession` row (`deleteMany` by tokenHash) → deletes cookie → redirect `/` (frontend concern).

## 4. Customer session cookie format

- **Name:** `asp_customer_session`
- **Value:** 32 random bytes, base64url (raw token; **only sha256 hex hash is stored** in `CustomerSession.tokenHash`)
- **Attributes:** `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`, max-age **30 days**
- **Session row:** `customerId`, `tokenHash` (unique), `expiresAt`, `userAgent`, `ipHash` (HMAC-sha256 of first `x-forwarded-for` entry or `x-real-ip`, keyed by `NEXTAUTH_SECRET`, dev fallback `"development-only-change-this-secret"`)
- **Resolution** (`getCurrentCustomer`): hash cookie token → lookup session incl. customer{profile, preferences} → invalid/expired/inactive ⇒ delete session row + cookie, return null.

## 5. Legacy compatibility shape — `GET /api/account/me` / Nest `GET /auth/customer/me`

Always **HTTP 200** (guests are not an error):
```json
{ "ok": true, "customer": { "name": "<profile.displayName ?? customer.name>", "email": "...|null", "phone": "...|null" } }
{ "ok": true, "customer": null }
```
Headers: `Cache-Control: private, no-store, max-age=0`.

## 6. Profile update (`PUT /customers/me/profile`; formerly `updateCustomerProfileAction`)

**Validation** (`customerProfileSchema`): displayName min 2 · email/phone optional normalized, **at least one required** · consents boolean · preferred* string arrays.
**Effect — single `$transaction` of 3 ops:**
1. `customer.update` — name/email/phone
2. `customerProfile.upsert` — displayName/email/phone/defaultDistrict/defaultDeliveryArea/defaultAddress/marketingConsent/personalizationConsent
3. `customerPreference.upsert` — preferredCategories/Tags/Languages (default `[]`)

**Quirk preserved:** empty default-address fields become `undefined` → Prisma *skips* them on update, so a user cannot clear a saved default via empty input. (Pre-existing behavior, kept for parity.)
**Errors:** P2002 → same conflict message as register. **Success:** `"Profile saved."`

## 7. Password change (`PUT /customers/me/password`; formerly `changeCustomerPasswordAction`)

Requires logged-in customer. Verify `currentPassword` against stored hash → on mismatch `"Current password is incorrect."` New passwords used by password change, OTP signup, and password reset share one creation policy: 8–128 characters, at least one uppercase ASCII letter, lowercase ASCII letter, digit, and non-whitespace special character; leading/trailing whitespace is rejected; confirmation must match. Login intentionally uses a separate basic input schema so historical passwords still reach bcrypt verification. Accepted passwords are passed unchanged to bcrypt(12) → `customer.update`. Success: `"Password changed."` No session invalidation (existing sessions stay valid — pre-existing behavior).

## 8. Checkout request/response (`POST /api/orders`)

**Request:** `customerName` (min 2) · `customerPhone` (BD normalize + pattern) · `customerEmail?` · `shippingAddress` (min 10) · `district` (min 2) · `deliveryArea` (min 2) · `paymentMethod` ∈ {cash_on_delivery, bkash, nagad, rocket} · `transactionId?` (**required when paymentMethod is bkash/nagad/rocket**) · `notes?` (≤500) · `anonymousId?` · `items[]` {bookId, quantity 1–99}, min 1.
**Response:** `200 {ok:true, orderNumber}` · `400 {ok:false, message}` · `503` when DB unconfigured. Customer linkage is implicit via session cookie (`customerId` set when logged in).

## 9. Order total calculation

Per item: book must be `published|pre_order` AND `stockQuantity ≥ quantity`, else error `"<title> is not available in the requested quantity."`
- `subtotal` = Σ `regularPrice × qty` (Decimal → number via `toNumber`)
- `saleSubtotal` = Σ `salePrice × qty`
- `discountTotal` = max(subtotal − saleSubtotal, 0)
- `grandTotal` = saleSubtotal + deliveryCharge
- `paymentStatus` = `unpaid` for COD else `pending`; `orderStatus` = `pending`; stock **NOT** reduced at checkout (admin confirm does that).
- Order number: `ASP-YYMMDD-NNNN` (4-digit random, ≤5 uniqueness retries). Items snapshot `bookTitleSnapshot`, `unitPrice` = salePrice.
- After create: fire-and-forget `purchase` events per item.

## 10. Delivery charge calculation

`deliveryChargeFor(area, options)` → match on `DeliveryAreaOption.value`, fallback **120**. Options = constants overridden by `SiteSetting["delivery_charges"]` (per-area numbers). Charged only when cart non-empty.

## 11. Legacy compatibility shapes — recommendations

- `GET /api/recommendations?anonymousId=` / `GET /recommendations?anonymousId=` → `{ ok: true, books: BookCardData[] }` (8 max, personalized via events+preferences; falls back to popular).
- `POST /api/recommendations` / `POST /recommendations/cart` `{bookIds: string[≤30]}` → `{ ok: true, books: BookCardData[4] }` (cart-based).
- `anonymousId` valid iff `^[a-zA-Z0-9_-]{16,80}$`.

## 12. Legacy compatibility shape — event tracking (`POST /api/recommendation-events` / Nest `POST /recommendations/events`)

`{ bookId, eventType ∈ {view,add_to_cart,purchase,search_click,sample_open}, anonymousId?, source? (≤80) }` → always `{ok:true, tracked:boolean}` (400 only on shape errors).
**Server rules:** logged-in customer **without personalizationConsent ⇒ not tracked**; guest without valid anonymousId ⇒ not tracked; book must exist in visible statuses; `view` deduped per actor+book within 30 min; weights: view 1, search_click 2, sample_open 3, add_to_cart 4, purchase 8. Client additionally dedupes `view` per session and uses `keepalive`.

## 13. Phase-2 implementation decisions (deviations & rationale)

1. **Session strategy: keep DB-backed `CustomerSession` — NOT JWT.** Same cookie name, token format, hashing, and expiry as Next. Rationale: (a) sessions become **mutually valid across both backends** during migration — users stay logged in through cutover and 2F can retarget call-sites gradually; (b) instant server-side revocation preserved; (c) zero schema change. JWT would orphan every existing session and remove revocation. Revisit post-migration if desired.
2. **Redirects removed from API:** `redirectTo` is accepted but ignored; navigation stays a frontend concern (2F).
3. **HTTP codes:** API uses 201 (register), 401 (bad login), 409 (conflict) instead of action-state `{error}` objects; messages preserved verbatim.
4. **Dev cross-port cookies:** `localhost:3000 → localhost:4000` is same-site (port ignored), so `sameSite=lax` + `credentials:'include'` works in dev without changes; production uses the planned same-domain proxy.
5. `NEXTAUTH_SECRET` must be added to `apps/api/.env` for production parity of `ipHash` (dev fallback matches Next's).

## 14. Phase 2C addendum — Google OAuth (new capability, no old behavior to preserve)

- New **additive** model `CustomerAuthProvider` (`@@unique([provider, providerUserId])`, `@@unique([customerId, provider])`, cascade on customer delete). Migration: `20260611080612_add_customer_auth_provider`. No existing model/field changed.
- Routes: `GET /auth/customer/google` (CSRF state cookie `asp_oauth_state`, 10 min, path-scoped) → Google consent (`openid email profile` only) → `GET /auth/customer/google/callback` (timing-safe state check, code exchange, link/create, **same DB CustomerSession as §4**, redirect to `FRONTEND_URL` + safe target).
- Linking: provider-match → login · verified-email match → link (never overwrite name/hash/data) · else create Customer+Profile+Preferences (mirrors §1). Unverified emails refused. Conflicting second Google account refused.
- `passwordHash` for Google-created customers = random unusable bcrypt hash (column is required; Next's login compares unconditionally — nullable was unsafe). Password login for such customers fails with the §2 generic message.
- Google access tokens are never stored nor exposed; id_token read in-process only.
- See docs/GOOGLE_OAUTH_SETUP.md for console setup, env, and manual tests.
