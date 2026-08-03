import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "../../config/env.js";

const encoder = new TextEncoder();

interface RefreshClaims {
  userId: string;
  sessionId: string;
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ tokenType: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(encoder.encode(getEnv().ACCESS_TOKEN_SECRET));
}

export async function verifyAccessToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, encoder.encode(getEnv().ACCESS_TOKEN_SECRET));
  if (payload.tokenType !== "access" || !payload.sub) throw new Error("Invalid access token");
  return payload.sub;
}

export async function signRefreshToken(claims: RefreshClaims): Promise<string> {
  return (
    new SignJWT({ tokenType: "refresh", sessionId: claims.sessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.userId)
      // Rotation can occur within the same JWT timestamp second. A unique ID
      // guarantees the replacement token and its stored hash actually change.
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(encoder.encode(getEnv().REFRESH_TOKEN_SECRET))
  );
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  const { payload } = await jwtVerify(token, encoder.encode(getEnv().REFRESH_TOKEN_SECRET));
  if (payload.tokenType !== "refresh" || !payload.sub || typeof payload.sessionId !== "string") {
    throw new Error("Invalid refresh token");
  }
  return { userId: payload.sub, sessionId: payload.sessionId };
}

export async function signRealtimeTicket(userId: string): Promise<string> {
  return new SignJWT({ tokenType: "realtime" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(encoder.encode(getEnv().REALTIME_TICKET_SECRET));
}

export async function verifyRealtimeTicket(ticket: string): Promise<string> {
  const { payload } = await jwtVerify(ticket, encoder.encode(getEnv().REALTIME_TICKET_SECRET));
  if (payload.tokenType !== "realtime" || !payload.sub) throw new Error("Invalid realtime ticket");
  return payload.sub;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}
