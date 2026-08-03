import { Router, type Router as ExpressRouter } from "express";
import { routeParam } from "../../core/request-values.js";
import { incidentRouter } from "../incidents/incident.routes.js";
import { reportingRouter } from "../reporting/reporting.routes.js";
import { savedViewRouter } from "../saved-views/saved-view.routes.js";
import { listWorkspaceMembers } from "../tenants/member.service.js";

export const workspaceRouter: ExpressRouter = Router();

workspaceRouter.get("/:workspaceId/members", async (request, response) => {
  response.json({
    data: await listWorkspaceMembers(request.auth!.id, routeParam(request.params.workspaceId)),
    meta: { serverTime: new Date().toISOString() }
  });
});

workspaceRouter.use("/:workspaceId/incidents", incidentRouter);
workspaceRouter.use("/:workspaceId/saved-views", savedViewRouter);
workspaceRouter.use("/:workspaceId", reportingRouter);
