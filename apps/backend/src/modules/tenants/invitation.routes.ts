import { acceptInvitationInputSchema, type AcceptInvitationInput } from "@relayops/types";
import { Router, type Router as ExpressRouter } from "express";
import { routeParam } from "../../core/request-values.js";
import { authRateLimit } from "../../middleware/rate-limits.js";
import { validateBody } from "../../middleware/validate.js";
import { acceptInvitation, invitationPreview } from "./invitation.service.js";

export const invitationRouter: ExpressRouter = Router();

invitationRouter.get("/:token", authRateLimit, async (request, response) => {
  response.json({
    data: await invitationPreview(routeParam(request.params.token)),
    meta: { serverTime: new Date().toISOString() }
  });
});

invitationRouter.post(
  "/:token/accept",
  authRateLimit,
  validateBody(acceptInvitationInputSchema),
  async (request, response) => {
    response.json({
      data: await acceptInvitation(
        routeParam(request.params.token),
        request.body as AcceptInvitationInput,
        String(request.id)
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);
