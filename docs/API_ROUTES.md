# NestJS API Routes Reference

Base URL (local): `http://localhost:4000` — **no global prefix**. All cookies are httpOnly; auth cookies are the same DB-backed `asp_customer_session` the Next.js app uses (mutually valid).

## Health

| Method | Route | Auth | Response |
|---|---|---|---|
| GET | `/health` | — | `{status, service, environment, database: ok\|unreachable\|not_configured, checkedAt}` |

## Customer auth (Phase 2A/2C)

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| POST | `/auth/customer/register` | — | `201 {ok, customer:{name,email,phone}}` + session cookie | `400` first validation issue · `409` "An account with this email or phone may already exist." |
| POST | `/auth/customer/login` | — | `200 {ok, customer}` + session cookie | `400` validation · `401` "Invalid email/phone or password." |
| POST | `/auth/customer/logout` | cookie | `200 {ok:true}` + cookie cleared | — |
| GET | `/auth/customer/me` | optional | **always 200**: `{ok, customer:{…}\|null}` | — |
| GET | `/auth/customer/google?redirect=/path` | — | 302 → Google consent | `503` if GOOGLE_* env missing |
| GET | `/auth/customer/google/callback` | — | 302 → `FRONTEND_URL` + safe target, session cookie set | 302 → `/account/login?error=google_login_failed` |

## Customer profile (Phase 2B — CustomerGuard)

| Method | Route | Success | Errors |
|---|---|---|---|
| PUT | `/customers/me/profile` | `200 {ok, message:"Profile saved."}` | `400` validation · `401` no session · `409` email/phone conflict |
| PUT | `/customers/me/password` | `200 {ok, message:"Password changed."}` | `400` "Current password is incorrect." / validation · `401` |

## Orders (Phase 2D)

### `POST /orders` — guest + authenticated checkout

Optional customer session: a valid cookie attaches `customerId`; guests check out identically.

**Request body** (same as old `POST /api/orders`):
```json
{
  "customerName": "min 2 chars",
  "customerPhone": "BD phone — +88/88 prefixes & spaces/dashes normalized, must match 01[3-9]XXXXXXXX",
  "customerEmail": "optional",
  "shippingAddress": "min 10 chars",
  "district": "min 2",
  "deliveryArea": "min 2 (inside_dhaka | outside_dhaka | inside_chattogram | outside_chattogram | other | …)",
  "paymentMethod": "cash_on_delivery | bkash | nagad | rocket",
  "transactionId": "REQUIRED for bkash/nagad/rocket",
  "notes": "optional ≤500",
  "anonymousId": "optional, ^[a-zA-Z0-9_-]{16,80}$",
  "items": [{ "bookId": "…", "quantity": 1 }]
}
```

**Responses** (identical shape to old route — `checkout-page-client.tsx` compatible):
- `200 {"ok":true,"orderNumber":"ASP-YYMMDD-NNNN"}`
- `400 {"ok":false,"message":"<first validation issue | business error>"}`
- `503 {"ok":false,"message":"Database is not configured yet. …"}`

### Old (Next.js) vs new (NestJS) behavior

| Aspect | Old `src/app/api/orders/route.ts` | New `POST /orders` |
|---|---|---|
| Guest checkout | ✅ | ✅ identical |
| Customer linking | session cookie → `customerId` | ✅ same cookie, same linkage |
| Item/stock validation | exists + `published\|pre_order` + `stockQuantity ≥ qty`; **stock NOT reduced** | ✅ identical (stock reduction stays with admin confirm — untouched) |
| Totals | `subtotal`=Σ regular×qty · `discount`=max(sub−sale,0) · `grand`=sale+delivery, float math on `Number(Decimal)` | ✅ identical math, identical `toNumber` port |
| Delivery charge | `SiteSetting["delivery_charges"]` override constants, fallback 120 | ✅ identical (no `unstable_cache` — direct read) |
| Order number | `ASP-YYMMDD-NNNN`, ≤5 uniqueness retries | ✅ identical |
| paymentStatus / orderStatus | COD→`unpaid`, manual→`pending` / `pending` | ✅ identical |
| Items | `bookTitleSnapshot`, `unitPrice`=salePrice, `totalPrice` | ✅ identical |
| Purchase events | fire-and-forget per item, consent-aware, weight 8 | ✅ identical port |
| Atomicity | single nested `order.create` (atomic) | ✅ same (nested create = one transaction) |
| Error JSON | `{ok:false,message}` 400/503 | ✅ byte-identical via custom HttpException |

**Only intentional differences:** none in behavior. (Auth-module endpoints from 2A/2B use NestJS-standard error JSON `{message,error,statusCode}` — still client-compatible since `message` is present and `ok` is absent/falsy.)
