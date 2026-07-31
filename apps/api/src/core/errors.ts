import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "./logger.js";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function notFoundHandler(request: Request, _response: Response, next: NextFunction): void {
  next(new AppError(404, "NOT_FOUND", `No route matches ${request.method} ${request.path}`));
}

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction
): void {
  void _next;
  const normalized =
    error instanceof AppError
      ? error
      : error instanceof ZodError
        ? new AppError(400, "VALIDATION_ERROR", "Request validation failed", error.issues)
        : new AppError(500, "INTERNAL_ERROR", "An unexpected error occurred");

  if (normalized.statusCode >= 500) {
    logger.error({ err: error, requestId: request.id }, "Unhandled request error");
  }

  response.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details === undefined ? {} : { details: normalized.details }),
      requestId: request.id
    }
  });
}
