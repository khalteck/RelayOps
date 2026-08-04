import { Router, type Router as ExpressRouter } from "express";
import {
  inviteMemberInputSchema,
  membershipStatusInputSchema,
  slaPolicySchema,
  tenantNameInputSchema,
  type InviteMemberInput
} from "@relayops/types";
import { z } from "zod";
import { requireCsrf } from "../../middleware/csrf.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createOrganisation,
  createWorkspace,
  listOrganisations,
  updateOrganisation,
  updateWorkspace
} from "./tenant.service.js";
import {
  inviteMember,
  listInvitations,
  listOrganisationMembers,
  resendInvitation
} from "./invitation.service.js";
import { changeMemberStatus, removeMember } from "./member-lifecycle.service.js";

const slaInput = z.object({ slaPolicy: slaPolicySchema });
export const tenantRouter: ExpressRouter = Router();

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

tenantRouter.get("/", async (request, response) => {
  response.json({
    data: await listOrganisations(request.auth!.id),
    meta: { serverTime: new Date().toISOString() }
  });
});

tenantRouter.get("/:organisationId/members", async (request, response) => {
  response.json({
    data: await listOrganisationMembers(
      request.auth!.id,
      routeParam(request.params.organisationId!)
    ),
    meta: { serverTime: new Date().toISOString() }
  });
});

tenantRouter.get("/:organisationId/invitations", async (request, response) => {
  response.json({
    data: await listInvitations(request.auth!.id, routeParam(request.params.organisationId!)),
    meta: { serverTime: new Date().toISOString() }
  });
});

tenantRouter.post(
  "/:organisationId/invitations",
  requireCsrf,
  validateBody(inviteMemberInputSchema),
  async (request, response) => {
    response.status(201).json({
      data: await inviteMember(
        request.auth!.id,
        routeParam(request.params.organisationId!),
        request.body as InviteMemberInput
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

tenantRouter.post(
  "/:organisationId/invitations/:invitationId/resend",
  requireCsrf,
  async (request, response) => {
    response.json({
      data: await resendInvitation(
        request.auth!.id,
        routeParam(request.params.organisationId!),
        routeParam(request.params.invitationId!)
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

tenantRouter.patch(
  "/:organisationId/members/:membershipId/status",
  requireCsrf,
  validateBody(membershipStatusInputSchema),
  async (request, response) => {
    response.json({
      data: await changeMemberStatus(
        request.auth!.id,
        routeParam(request.params.organisationId!),
        routeParam(request.params.membershipId!),
        request.body
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

tenantRouter.delete(
  "/:organisationId/members/:membershipId",
  requireCsrf,
  async (request, response) => {
    await removeMember(
      request.auth!.id,
      routeParam(request.params.organisationId!),
      routeParam(request.params.membershipId!)
    );
    response.status(204).send();
  }
);

tenantRouter.post(
  "/",
  requireCsrf,
  validateBody(tenantNameInputSchema),
  async (request, response) => {
    response.status(201).json({
      data: await createOrganisation(request.auth!.id, request.body.name),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

tenantRouter.patch(
  "/:organisationId",
  requireCsrf,
  validateBody(tenantNameInputSchema),
  async (request, response) => {
    await updateOrganisation(
      request.auth!.id,
      routeParam(request.params.organisationId!),
      request.body.name
    );
    response.status(204).send();
  }
);

tenantRouter.post(
  "/:organisationId/workspaces",
  requireCsrf,
  validateBody(tenantNameInputSchema),
  async (request, response) => {
    response.status(201).json({
      data: await createWorkspace(
        request.auth!.id,
        routeParam(request.params.organisationId!),
        request.body.name
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

tenantRouter.patch(
  "/workspaces/:workspaceId",
  requireCsrf,
  validateBody(tenantNameInputSchema),
  async (request, response) => {
    response.json({
      data: await updateWorkspace(request.auth!.id, routeParam(request.params.workspaceId!), {
        name: request.body.name
      }),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

tenantRouter.patch(
  "/workspaces/:workspaceId/sla",
  requireCsrf,
  validateBody(slaInput),
  async (request, response) => {
    response.json({
      data: await updateWorkspace(request.auth!.id, routeParam(request.params.workspaceId!), {
        slaPolicy: request.body.slaPolicy
      }),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);
