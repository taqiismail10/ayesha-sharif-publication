import crypto from "crypto";
import { Controller, Get, Logger, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CustomerAuthService } from "./customer-auth.service";
import { GoogleOAuthService } from "./google-oauth.service";

const OAUTH_STATE_COOKIE = "asp_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/** Same rule as the Next app's isSafeAccountRedirect — blocks open redirects. */
function isSafeRedirect(value?: string | null): value is string {
  if (!value) return false;
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/admin")
  );
}

@Controller("auth/customer/google")
export class GoogleOAuthController {
  private readonly logger = new Logger(GoogleOAuthController.name);

  constructor(
    private readonly google: GoogleOAuthService,
    private readonly auth: CustomerAuthService,
  ) {}

  /**
   * GET /auth/customer/google?redirect=/some/path
   * Starts the OAuth flow: sets a short-lived CSRF state cookie and
   * redirects the browser to Google's consent screen.
   */
  @Get()
  start(
    @Query("redirect") redirect: string | undefined,
    @Res() res: Response,
  ) {
    this.google.assertConfigured();

    const state = crypto.randomBytes(24).toString("base64url");
    const redirectTo = isSafeRedirect(redirect) ? redirect : "";

    // state cookie: "<state>.<urlencoded redirect>" — state is base64url so
    // the first "." is an unambiguous separator.
    res.cookie(OAUTH_STATE_COOKIE, `${state}.${encodeURIComponent(redirectTo)}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: STATE_MAX_AGE_MS,
      path: "/auth/customer/google",
    });

    return res.redirect(this.google.buildAuthUrl(state));
  }

  /**
   * GET /auth/customer/google/callback?code=…&state=…
   * Verifies state, exchanges the code, links/creates the customer, creates
   * the SAME DB-backed CustomerSession used by email/password login, then
   * redirects back to the frontend. Errors redirect to the login page with a
   * generic error code — no details leak to the URL.
   */
  @Get("callback")
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") oauthError: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontend = this.google.frontendUrl();
    const fail = () =>
      res.redirect(`${frontend}/account/login?error=google_login_failed`);

    // Always consume the state cookie, success or fail.
    const stateCookie = (req.cookies as Record<string, string | undefined>)[
      OAUTH_STATE_COOKIE
    ];
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/auth/customer/google" });

    try {
      this.google.assertConfigured();

      if (oauthError || !code || !state || !stateCookie) return fail();

      const separator = stateCookie.indexOf(".");
      if (separator === -1) return fail();
      const expectedState = stateCookie.slice(0, separator);
      const redirectTo = decodeURIComponent(stateCookie.slice(separator + 1));

      // CSRF check — state from Google must match our cookie exactly.
      if (
        expectedState.length !== state.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedState), Buffer.from(state))
      ) {
        return fail();
      }

      const profile = await this.google.exchangeCodeForProfile(code);
      const customer = await this.google.loginOrLinkCustomer(profile);
      await this.auth.createSession(req, res, customer.id);

      const target = isSafeRedirect(redirectTo)
        ? redirectTo
        : "/account/profile";
      return res.redirect(`${frontend}${target}`);
    } catch (caught) {
      this.logger.warn(
        `Google callback failed: ${caught instanceof Error ? caught.message : "unknown"}`,
      );
      return fail();
    }
  }
}
