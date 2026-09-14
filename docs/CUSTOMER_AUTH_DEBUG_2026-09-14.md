# Customer authentication investigation — 2026-09-14

## Confirmed observations

- Live frontend: `http://localhost:3000/account/login`.
- Rendered Google link: `http://127.0.0.1:8787/auth/customer/google`.
- Live Google start response: 302 to Google's authorization endpoint, with
  `redirect_uri=http://localhost:4000/auth/customer/google/callback`.
- The OAuth state cookie is HttpOnly, SameSite=Lax, scoped to
  `/auth/customer/google`, with a 600-second lifetime. Its value was redacted.
- Live guest `/auth/customer/me`: `{ "ok": true, "customer": null }`.
- Browser submission of invalid test credentials: 401, visible
  `Invalid email/phone or password.` message, remains on login page.

## Cookie reproduction

Using Playwright in fresh isolated browser contexts, load the real frontend
at localhost:3000 and intercept only a synthetic API endpoint. Return a 200
response with credentialed CORS for localhost:3000 and a synthetic HttpOnly,
SameSite=Lax, Path=/ cookie. Fetch with `credentials: "include"`.

| Synthetic response host | Fetch status | Cookie stored | Cookie available to frontend host |
| --- | --- | --- | --- |
| 127.0.0.1:8787 | 200 | No | No |
| localhost:8787 | 200 | Yes | Yes |

This reproduces the browser cookie integration defect independently of D1.
It is not a successful customer-login test. No customer records were created.

## Required configuration correction

The attached task explicitly prohibits editing `.env` files. No environment
files were changed. Apply these values in the effective environments:

| Location | Variable | Required value |
| --- | --- | --- |
| Next.js | NEXT_PUBLIC_API_BASE_URL | http://localhost:8787 |
| Next.js, if retained | NEXT_PUBLIC_API_URL | http://localhost:8787 |
| Worker | GOOGLE_CALLBACK_URL | http://localhost:8787/auth/customer/google/callback |
| Worker | FRONTEND_ORIGIN | http://localhost:3000 |
| Worker | FRONTEND_URL | http://localhost:3000 |

Register the same callback URI in Google Cloud Console. Restart both development
servers, using `npm run worker:dev` for the API. Keep the browser on localhost.
Do not weaken SameSite or HttpOnly to compensate for mixed loopback hosts.

## Code trace

- Password login checks credentials, active status and email verification,
  persists a CustomerSession, then sets the cookie and returns the customer.
- Session creation and lookup share SHA-256 token hashing and the Prisma D1
  service bound by the Worker. Actual test-account persistence is unverified.
- The shared browser API client already includes credentials.
- Next.js protected account pages require the cookie on the frontend host
  and forward it to NestJS. A cookie isolated to another host cannot do that.
- OTP signup stores the customer/password before sending the OTP; verification
  verifies the email and instructs the user to sign in. It does not create a
  login session. A separate local provider record is not required by login.
- Google callback checks state, resolves the provider/customer, creates the same
  session, and redirects to the frontend. Current initiation sends users to the
  wrong callback port and puts state on a different host from the callback.
- Worker responses pass through `httpServerHandler`; the live OAuth initiation
  preserves Set-Cookie. Multiple callback cookies remain untested.

## Remaining verification

Real successful password login, session/database inspection for a designated
test account, reload/navigation persistence, logout, OTP email/verification,
and interactive Google authentication still need verification after configuration
correction. Google Console settings were not inspected. No remote database
queries or writes were performed. SMTP warnings and unrelated admin 401s were
not changed. No application-code fix is claimed.
