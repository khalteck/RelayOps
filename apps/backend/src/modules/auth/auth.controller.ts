import type { Request, Response } from "express";
import type {
  LoginInput,
  OwnerOnboardingInput,
  InvitedOnboardingInput,
  RegisterStartInput,
  RegisterInput,
  SessionPayload,
  UpdateProfileInput,
  VerifyRegistrationInput
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
  updateProfile,
  updatePreferences,
  issueSession
} from "./auth.service.js";
import { createCsrfToken } from "./auth.tokens.js";
import {
  completeInvitedOnboarding,
  completeOwnerOnboarding,
  onboardingState
} from "./onboarding.service.js";
import {
  resendRegistration,
  startRegistration,
  verifyRegistration
} from "./registration.service.js";

function fingerprint(request: Request): { userAgent?: string; ipAddress?: string } {
  const result: { userAgent?: string; ipAddress?: string } = {};
  const userAgent = request.get("user-agent");
  if (userAgent) result.userAgent = userAgent;
  if (request.ip) result.ipAddress = request.ip;
  return result;
}

async function sendAuthResponse(
  response: Response,
  result: Awaited<ReturnType<typeof login>>,
  status = 200
): Promise<void> {
  const csrfToken = createCsrfToken();
  setSessionCookies(response, result.accessToken, result.refreshToken, csrfToken);
  response.status(status).json({
    data: {
      user: result.user,
      csrfToken,
      onboarding: await onboardingState(result.user.id)
    } satisfies SessionPayload,
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function registerController(request: Request, response: Response): Promise<void> {
  const result = await register(request.body as RegisterInput, fingerprint(request));
  await sendAuthResponse(response, result, 201);
}

export async function startRegistrationController(
  request: Request,
  response: Response
): Promise<void> {
  response.status(202).json({
    data: await startRegistration(request.body as RegisterStartInput, request.ip),
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function resendRegistrationController(
  request: Request,
  response: Response
): Promise<void> {
  response.json({
    data: await resendRegistration(request.body.challengeId as string),
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function verifyRegistrationController(
  request: Request,
  response: Response
): Promise<void> {
  const user = await verifyRegistration(request.body as VerifyRegistrationInput);
  await sendAuthResponse(response, await issueSession(user, fingerprint(request)), 201);
}

export async function loginController(request: Request, response: Response): Promise<void> {
  const result = await login(request.body as LoginInput, fingerprint(request));
  await sendAuthResponse(response, result);
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
  await sendAuthResponse(response, result);
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
    data: { user: request.auth, csrfToken, onboarding: await onboardingState(request.auth!.id) },
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function ownerOnboardingController(
  request: Request,
  response: Response
): Promise<void> {
  response.status(201).json({
    data: await completeOwnerOnboarding(request.auth!.id, request.body as OwnerOnboardingInput),
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function invitedOnboardingController(
  request: Request,
  response: Response
): Promise<void> {
  response.json({
    data: await completeInvitedOnboarding(
      request.auth!.id,
      String(request.params.membershipId),
      request.body as InvitedOnboardingInput
    ),
    meta: { serverTime: new Date().toISOString() }
  });
}

export async function updatePreferencesController(
  request: Request,
  response: Response
): Promise<void> {
  response.json({
    data: await updatePreferences(request.auth!.id, request.body),
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
