import { Router, type Router as ExpressRouter } from "express";
import { slaPolicySchema, tenantNameInputSchema } from "@relayops/types";
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
