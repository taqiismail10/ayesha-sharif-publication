# API Testing Guide

Prereqs: API running (`cd apps/api && npm run start:dev`), `apps/api/.env` with a valid `DATABASE_URL`. All examples use curl with a cookie jar.

```bash
JAR=/tmp/asp-cookies.txt
API=http://localhost:4000
```

## Health
```bash
curl -s $API/health          # expect database:"ok"
```

## Customer auth (2A)
```bash
# register (sets session cookie)
curl -s -c $JAR -X POST $API/auth/customer/register -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"me@example.com","password":"testpass123","confirmPassword":"testpass123"}'
# me / logout / login
curl -s -b $JAR $API/auth/customer/me
curl -s -b $JAR -c $JAR -X POST $API/auth/customer/logout
curl -s -c $JAR -X POST $API/auth/customer/login -H "Content-Type: application/json" \
  -d '{"identifier":"me@example.com","password":"testpass123"}'
```
Phone login also works: `"identifier":"+8801712345678"` (normalized to `01712345678`).

## Profile / password (2B)
```bash
curl -s -b $JAR -X PUT $API/customers/me/profile -H "Content-Type: application/json" \
  -d '{"displayName":"Renamed","email":"me@example.com","personalizationConsent":true}'
curl -s -b $JAR -X PUT $API/customers/me/password -H "Content-Type: application/json" \
  -d '{"currentPassword":"testpass123","newPassword":"newpass456","confirmPassword":"newpass456"}'
```

## Google OAuth (2C)
See `docs/GOOGLE_OAUTH_SETUP.md` (needs real Google credentials; browser flow).

## Checkout (2D) — `POST /orders`

Get a real published book id first:
```sql
SELECT id, title, "stockQuantity", "salePrice" FROM "Book" WHERE status='published' LIMIT 3;
```

```bash
BOOK=<published-book-id>

# 1. Guest COD checkout (expect {"ok":true,"orderNumber":"ASP-…"})
curl -s -X POST $API/orders -H "Content-Type: application/json" -d "{
  \"customerName\":\"Guest Tester\",\"customerPhone\":\"+880 1712-345678\",
  \"shippingAddress\":\"House 1, Road 2, Dhanmondi, Dhaka\",\"district\":\"Dhaka\",
  \"deliveryArea\":\"inside_dhaka\",\"paymentMethod\":\"cash_on_delivery\",
  \"anonymousId\":\"anon-test-0123456789abc\",
  \"items\":[{\"bookId\":\"$BOOK\",\"quantity\":2}]}"

# 2. Invalid book → 400 "One or more books are no longer available."
#    (same payload, bookId:"nonexistent")
# 3. Excess quantity (e.g. 99 > stock) → 400 "<title> is not available in the requested quantity."
# 4. bkash WITHOUT transactionId → 400 "Transaction ID is required for Manual bKash."
# 5. Empty body {} → 400 {"ok":false,"message":"Required"}
# 6. Unknown deliveryArea (e.g. "unknown_area") → succeeds with fallback charge 120

# 7. Authenticated checkout (cookie from login above) → order gets customerId
curl -s -b $JAR -X POST $API/orders -H "Content-Type: application/json" -d "{
  \"customerName\":\"Test User\",\"customerPhone\":\"01912345678\",
  \"shippingAddress\":\"Flat 3B, Green Tower, Chattogram\",\"district\":\"Chattogram\",
  \"deliveryArea\":\"inside_chattogram\",\"paymentMethod\":\"bkash\",\"transactionId\":\"BKS-123\",
  \"items\":[{\"bookId\":\"$BOOK\",\"quantity\":1}]}"
```

### Database records to verify after checkout

```sql
-- Order: totals math, defaults, linkage
SELECT "orderNumber","customerId","customerPhone",subtotal,"discountTotal","deliveryCharge","grandTotal",
       "paymentMethod","paymentStatus","orderStatus","stockReduced","transactionId"
FROM "Order" ORDER BY "createdAt" DESC LIMIT 3;
-- expect: subtotal=Σ regularPrice×qty · discount=subtotal−Σ salePrice×qty · grand=saleTotal+charge
--         COD→paymentStatus=unpaid, bkash/nagad/rocket→pending · orderStatus=pending · stockReduced=false
--         guest→customerId NULL · logged-in→customerId set · phone normalized 01XXXXXXXXX

-- Items: snapshot + sale pricing
SELECT "bookTitleSnapshot",quantity,"unitPrice","totalPrice" FROM "OrderItem"
WHERE "orderId"=(SELECT id FROM "Order" ORDER BY "createdAt" DESC LIMIT 1);

-- Purchase events (guest needs valid anonymousId; customer needs personalizationConsent=true)
SELECT "eventType",weight,source,"customerId","anonymousId" FROM "CustomerBookEvent"
WHERE "eventType"='purchase' ORDER BY "createdAt" DESC LIMIT 5;   -- weight=8, source='checkout'

-- Stock must be UNCHANGED by checkout (admin confirm reduces it)
SELECT title,"stockQuantity" FROM "Book" WHERE id='<BOOK>';
```

## Recommendations (2E)

```bash
BOOK=<published-book-id> ; ANON="anon-test-0123456789abc"

# 1. No login, no anonymousId → popularity fallback, 8 books
curl -s $API/recommendations

# 2. Track an anonymous view (→ tracked:true; repeat within 30min → tracked:false dedupe)
curl -s -X POST $API/recommendations/events -H "Content-Type: application/json" \
  -d "{\"bookId\":\"$BOOK\",\"eventType\":\"view\",\"anonymousId\":\"$ANON\",\"source\":\"manual_test\"}"

# 3. Personalized via anonymousId (excludes the evented book)
curl -s "$API/recommendations?anonymousId=$ANON"

# 4. Logged-in (cookie jar from auth section; requires personalizationConsent=true)
curl -s -b $JAR -X POST $API/recommendations/events -H "Content-Type: application/json" \
  -d "{\"bookId\":\"$BOOK\",\"eventType\":\"add_to_cart\"}"
curl -s -b $JAR $API/recommendations

# 5. Cart-based (4 books, cart book excluded); empty/unknown bookIds → fallback
curl -s -X POST $API/recommendations/cart -H "Content-Type: application/json" -d "{\"bookIds\":[\"$BOOK\"]}"

# 6. Error shapes (must match old routes byte-for-byte)
curl -s -X POST $API/recommendations/cart   -H "Content-Type: application/json" -d '{"bookIds":"x"}'
#   → 400 {"ok":false,"message":"Invalid recommendation request."}
curl -s -X POST $API/recommendations/events -H "Content-Type: application/json" -d '{"bookId":"x","eventType":"bogus"}'
#   → 400 {"ok":false,"tracked":false}
```

```sql
-- Event verification: weights view=1, search_click=2, sample_open=3, add_to_cart=4, purchase=8
SELECT "eventType",weight,source,"customerId","anonymousId" FROM "CustomerBookEvent" ORDER BY "createdAt" DESC LIMIT 5;
```

## Phase 2F — Frontend retarget browser checklist

Run both servers (`npm run dev` at root; `npm run start:dev` in apps/api), then in a browser at `http://localhost:3000`:

1. **Register** at `/account/register` → lands on profile; header shows your name *(server action — unchanged path, session valid for both backends)*
2. **Login** at `/account/login` → same
3. **Account menu** (header): shows logged-in name on every page — now served by `GET :4000/auth/customer/me` (check DevTools → Network)
4. **Logout** from the header menu → calls `POST :4000/auth/customer/logout`, redirects home, menu shows Login again
5. **/account/profile** loads customer data; **profile update** + **password change** still work *(server actions — unchanged)*
6. **Guest checkout**: add a book → `/checkout` → submit COD → order-success page *(Network: `POST :4000/orders`)*
7. **Authenticated checkout**: login first, checkout → verify in DB the new order has `customerId`
8. **Checkout errors**: set a book's quantity above stock in cart → submit → inline error message shown (same UX)
9. **Recommendations**: homepage/“Recommended for you” and cart “You may also like” sections load *(Network: `:4000/recommendations`, `:4000/recommendations/cart`)*
10. **Event tracking**: click a product card → `POST :4000/recommendations/events` fires (consent banner accepted ⇒ anonymousId present)
11. **Compatibility routes intentionally still alive**: `curl -s localhost:3000/api/account/me`, `curl -s localhost:3000/api/health`, `curl -s "localhost:3000/api/recommendations?anonymousId=test_compat_1234567890"`, and `curl -s -X POST localhost:3000/api/recommendation-events -H "Content-Type: application/json" -d '{"bookId":"x","eventType":"view"}'` still respond while external verification is pending
12. **Admin untouched**: `/admin` login + book edit + upload still hit Next routes only

CORS preflight verified automatically (2026-06-11): `OPTIONS /orders` from origin `:3000` → 204 with `allow-origin: http://localhost:3000`, `allow-credentials: true`.

### Verified automated runs (2026-06-11)
**2D:** Guest COD (840/120/70/790 ✓), fallback charge 120 ✓, authenticated bkash (940/140/60/860, customerId + txn ✓), item snapshots ✓, unpaid/pending defaults ✓, 3 purchase events (1 anonymous + 2 customer) ✓, stock untouched ✓, all error paths byte-identical ✓.
**2E:** fallback 8 books ✓, anonymous view tracked + 30-min dedupe ✓, no-actor → tracked:false ✓, personalized via anonymousId/customer with evented-book exclusion ✓, cart recs exclude cart book ✓, empty/invalid cart → fallback 4 ✓, error bodies byte-identical ✓, BookCardData 16-field shape exact ✓, event weights (view 1, add_to_cart 4) in DB ✓. All test rows deleted afterwards.
