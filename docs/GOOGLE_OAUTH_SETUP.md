# Google OAuth Setup (Phase 2C)

Google login for **customers only** (Admin auth untouched). Integrates with the existing `Customer` model via the new additive `CustomerAuthProvider` table — no generic User model, no schema rewrites.

## Architecture

```
Browser → GET  :8787/auth/customer/google            (sets 10-min CSRF state cookie, 302 → Google)
Google  → GET  :8787/auth/customer/google/callback   (state check → code exchange → link/create
                                                      customer → SAME DB CustomerSession cookie
                                                      as password login → 302 → frontend)
```

- **Session parity:** Google login creates the identical `asp_customer_session` DB-backed cookie that email/password login creates (Phase 2A). The Next.js app recognizes it immediately — `account-menu` shows the user as logged-in with **zero frontend retargeting**.
- **No tokens stored:** Google's access token is used in-process only and discarded; the id_token payload is read once. Nothing Google-related is exposed to the frontend.
- **Linking rules:** provider row exists → login · verified-email match → link to existing customer (data untouched) · no match → create Customer+Profile+Preferences. Unverified Google emails are refused (account-takeover guard). A customer already linked to a *different* Google account is refused.
- **`passwordHash`:** required by schema and the old Next login compares against it unconditionally — so Google-created customers get a **random unusable bcrypt hash** (password login fails generically until they set one). Making the column nullable was rejected as unsafe.

## Google Cloud Console setup

1. https://console.cloud.google.com/apis/credentials → create/select a project
2. *OAuth consent screen*: External · app name `Ayesha-Sharif Publication` · scopes: only `openid`, `email`, `profile` · add yourself as test user while in Testing mode
3. *Credentials → Create credentials → OAuth client ID → Web application*:

| Setting | Local development | Production |
|---|---|---|
| Authorized JavaScript origins | `http://localhost:3000`, `http://localhost:8787` | `https://yourdomain.com`, `https://api.yourdomain.com` |
| Authorized redirect URIs | `http://localhost:8787/auth/customer/google/callback` | `https://api.yourdomain.com/auth/customer/google/callback` |

4. Copy Client ID + Secret into `apps/api/.env` (never commit).

## Required env (`apps/api/.env`)

```
GOOGLE_CLIENT_ID="…apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="…"
GOOGLE_CALLBACK_URL="http://localhost:8787/auth/customer/google/callback"
FRONTEND_URL="http://localhost:3000"
NEXTAUTH_SECRET="same-value-as-the-next-app"   # session/ipHash parity
# already present: DATABASE_URL, API_PORT, FRONTEND_ORIGIN
```
Frontend (`.env` root): set `NEXT_PUBLIC_API_BASE_URL="http://localhost:8787"` and, if present, `NEXT_PUBLIC_API_URL="http://localhost:8787"`. The preferred variable wins over the legacy variable. The code fallback is still port 4000, so configure the Worker URL explicitly.
Without `GOOGLE_CLIENT_ID/SECRET` the start route returns **503** and everything else works normally.

## Manual test steps

1. **Console setup** as above; fill `apps/api/.env`; restart API (`npm run worker:dev`).
2. **Start:** visit `http://localhost:8787/auth/customer/google` → redirected to Google's account picker; inspect: `asp_oauth_state` cookie set (HttpOnly, 10 min, path-scoped).
3. **Callback (new customer):** pick a Google account whose email does NOT exist in the DB → you land on `http://localhost:3000/account/profile` logged in. Verify in DB: `Customer`, `CustomerProfile`, `CustomerPreference`, `CustomerAuthProvider(provider='google')` rows created.
4. **Existing-email linking:** register a password account with email X (via the site), logout, then Google-login with the same email X → same customer (orders/preferences intact), a provider row added, `passwordHash` unchanged — password login with the old password still works.
5. **Duplicate prevention:** repeat Google login → no new Customer row (`SELECT count(*) FROM "Customer" WHERE email='…'` stays 1).
6. **`/auth/customer/me`:** after Google login, `curl -b <cookie> http://localhost:8787/auth/customer/me` → `{ok:true, customer:{…}}`; the Next.js header account menu also shows the logged-in state (shared session).
7. **Logout:** `POST /auth/customer/logout` (or the site's logout) → me returns `customer:null`.
8. **Password regression:** email/password register + login still work (automated test T9 passed).
9. **From the UI:** `/account/login` now shows "Continue with Google" below the password form; with `?next=/checkout` the redirect is preserved (server-validated, `/admin` and `//…` blocked).

## Automated verification already performed

503 unconfigured · 302 with correct scopes/redirect_uri · state-mismatch → error redirect · `//evil.com` redirect stripped · new-customer creation (profile+prefs+provider) · repeat-login dedupe · existing-email link with name/hash preserved · unverified-email rejection · password-auth regression. All against the real local DB, test rows cleaned up.

## Risks / manual steps

1. **You must create the Google Cloud credentials** — nothing works until `GOOGLE_CLIENT_ID/SECRET` exist (route 503s gracefully).
2. **Consent screen in Testing mode** only allows listed test users; Publish for real users.
3. **Production cookies:** OAuth state + session cookies are `secure` only when `NODE_ENV=production` — ensure it's set, and the same-domain proxy plan applies (cookie domain must cover both apps or be proxied).
4. Old Next.js auth routes/actions remain live and untouched (cleanup is Phase 4).

## Worker development host consistency

Open the frontend at `http://localhost:3000` and use `http://localhost:8787`
for browser API calls and the OAuth callback. Do not mix `localhost` and
`127.0.0.1`: customer cookies are host-only and SameSite=Lax, and Next.js
server-rendered account pages must receive the session cookie too.

Set `GOOGLE_CALLBACK_URL=http://localhost:8787/auth/customer/google/callback`
in the active Worker environment and register that exact URI in Google Cloud
Console. Wrangler may source local values from `.dev.vars` or environment
files; verify the actual outgoing OAuth `redirect_uri` after restarting.
Changing an unused environment file is insufficient. Restart Next.js too,
since public API variables are included in its browser bundle.

A login response of 200 and a `/me` response of 200 do not establish success:
`/me` intentionally returns `{ "ok": true, "customer": null }` for guests.
Verify a non-null customer after login, reload, and navigation, then verify
logout. See [the September 2026 investigation](CUSTOMER_AUTH_DEBUG_2026-09-14.md)
for observed evidence and remaining live checks.