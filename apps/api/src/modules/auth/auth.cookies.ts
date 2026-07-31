import type { CookieOptions, Response } from "express";
import { getEnv } from "../../config/env.js";

export const ACCESS_COOKIE = "relayops_access";
export const REFRESH_COOKIE = "relayops_refresh";
export const CSRF_COOKIE = "relayops_csrf";

function baseCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  };
}

export function setSessionCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
  csrfToken: string
): void {
  response.cookie(ACCESS_COOKIE, accessToken, { ...baseCookie(), maxAge: 15 * 60 * 1000 });
  response.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookie(),
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  response.cookie(CSRF_COOKIE, csrfToken, {
    ...baseCookie(),
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearSessionCookies(response: Response): void {
  response.clearCookie(ACCESS_COOKIE, baseCookie());
  response.clearCookie(REFRESH_COOKIE, baseCookie());
  response.clearCookie(CSRF_COOKIE, { ...baseCookie(), httpOnly: false });
}
