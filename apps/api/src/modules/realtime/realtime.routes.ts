import { Router, type Router as ExpressRouter } from "express";
import { requireCsrf } from "../../middleware/csrf.js";
import { authRateLimit } from "../../middleware/rate-limits.js";
import { signRealtimeTicket } from "../auth/auth.tokens.js";

export const realtimeRouter: ExpressRouter = Router();

realtimeRouter.post("/ticket", authRateLimit, requireCsrf, async (request, response) => {
  response.json({
    data: {
      ticket: await signRealtimeTicket(request.auth!.id),
      expiresInSeconds: 60
    },
    meta: { serverTime: new Date().toISOString() }
  });
});
