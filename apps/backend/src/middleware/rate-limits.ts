import { rateLimit } from "express-rate-limit";
import { getEnv } from "../config/env.js";

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (request, response) => {
    response.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        requestId: request.id
      }
    });
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: getEnv().AUTH_RATE_LIMIT,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (request, response) => {
    response.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many authentication attempts. Please try again later.",
        requestId: request.id
      }
    });
  }
});
