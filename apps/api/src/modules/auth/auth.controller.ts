import type { Request, Response } from "express";
import type {
  LoginInput,
  RegisterInput,
  SessionPayload,
  UpdateProfileInput
} from "@relayops/types";
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies
} from "./auth.cookies.js";
import {
  login,
  register,
  revokeRefreshToken,
  rotateRefreshToken,
  updateProfile
} from "./auth.service.js";
import { createCsrfToken } from "./auth.tokens.js";

function fingerprint(request: Request): { userAgent?: string; ipAddress?: string } {
  const result: { userAgent?: string; ipAddress?: string } = {};
  const userAgent = request.get("user-agent");
  if (userAgent) result.userAgent = userAgent;
  if (request.ip) result.ipAddress = request.ip;
  return result;
}

function sendAuthResponse(
  response: Response,
  result: Awaited<ReturnType<typeof login>>,
  status = 200
): void {
  const csrfToken = createCsrfToken();
  setSessionCookies(response, result.accessToken, result.refreshToken, csrfToken);
  response.status(status).json({
    data: { user: result.user, csrfToken } satisfies SessionPayload,
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function registerController(request: Request, response: Response): Promise<void> {
  const result = await register(request.body as RegisterInput, fingerprint(request));
  sendAuthResponse(response, result, 201);
}

export async function loginController(request: Request, response: Response): Promise<void> {
  const result = await login(request.body as LoginInput, fingerprint(request));
  sendAuthResponse(response, result);
}

export async function refreshController(request: Request, response: Response): Promise<void> {
  const refreshToken = request.cookies[REFRESH_COOKIE] as string | undefined;
  if (!refreshToken) {
    clearSessionCookies(response);
    response.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Refresh session is missing",
        requestId: request.id
      }
    });
    return;
  }
  const result = await rotateRefreshToken(refreshToken);
  sendAuthResponse(response, result);
}

export async function sessionController(request: Request, response: Response): Promise<void> {
  const csrfToken = (request.cookies[CSRF_COOKIE] as string | undefined) ?? createCsrfToken();
  if (!request.cookies[CSRF_COOKIE]) {
    response.cookie(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }
  response.json({
    data: { user: request.auth, csrfToken },
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function logoutController(request: Request, response: Response): Promise<void> {
  await revokeRefreshToken(request.cookies[REFRESH_COOKIE] as string | undefined);
  clearSessionCookies(response);
  response.status(204).send();
}

export async function updateProfileController(request: Request, response: Response): Promise<void> {
  response.json({
    data: await updateProfile(request.auth!.id, request.body as UpdateProfileInput),
    meta: { serverTime: new Date().toISOString() }
  });
}

export function accessCookieName(): string {
  return ACCESS_COOKIE;
}
