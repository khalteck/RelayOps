import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { AppError } from "../core/errors.js";
import { CSRF_COOKIE } from "../modules/auth/auth.cookies.js";

export function requireCsrf(request: Request, _response: Response, next: NextFunction): void {
  const cookieToken = request.cookies[CSRF_COOKIE] as string | undefined;
  const headerToken = request.header("x-csrf-token");
  const origin = request.header("origin");

  if (!cookieToken || !headerToken || origin !== getEnv().WEB_ORIGIN) {
    throw new AppError(403, "FORBIDDEN", "CSRF verification failed");
  }

  const left = Buffer.from(cookieToken);
  const right = Buffer.from(headerToken);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new AppError(403, "FORBIDDEN", "CSRF verification failed");
  }
  next();
}
