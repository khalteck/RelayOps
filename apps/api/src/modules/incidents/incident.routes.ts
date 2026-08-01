import {
  assignIncidentInputSchema,
  classifyIncidentInputSchema,
  commentInputSchema,
  createIncidentInputSchema,
  incidentFilterSchema,
  transitionIncidentInputSchema
} from "@relayops/types";
import { Router, type Router as ExpressRouter } from "express";
import { queryList, queryNumber, queryText, routeParam } from "../../core/request-values.js";
import { requireCsrf } from "../../middleware/csrf.js";
import { validateBody } from "../../middleware/validate.js";
import { commentOnIncident, transitionIncident } from "./incident.activity.js";
import {
  assignIncident,
  claimIncident,
  classifyIncident,
  createIncident
} from "./incident.command.js";
import { getIncident, listIncidents, listTimeline } from "./incident.query.js";

export const incidentRouter: ExpressRouter = Router({ mergeParams: true });

function workspaceId(params: Record<string, string | string[]>): string {
  return routeParam(params.workspaceId);
}

incidentRouter.get("/", async (request, response) => {
  const filters = incidentFilterSchema.parse({
    search: queryText(request.query.search),
    statuses: queryList(request.query.statuses),
    priorities: queryList(request.query.priorities),
    severities: queryList(request.query.severities),
    assignee: queryText(request.query.assignee),
    sortBy: queryText(request.query.sortBy),
    sortDirection: queryText(request.query.sortDirection),
    page: queryNumber(request.query.page),
    pageSize: queryNumber(request.query.pageSize)
  });
  const result = await listIncidents(request.auth!.id, workspaceId(request.params), filters);
  response.json({
    data: result.items,
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / filters.pageSize),
      serverTime: new Date().toISOString()
    }
  });
});

incidentRouter.post(
  "/",
  requireCsrf,
  validateBody(createIncidentInputSchema),
  async (request, response) => {
    response.status(201).json({
      data: await createIncident(
        request.auth!.id,
        workspaceId(request.params),
        request.body,
        String(request.id)
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

incidentRouter.get("/:incidentId", async (request, response) => {
  response.json({
    data: await getIncident(
      request.auth!.id,
      workspaceId(request.params),
      routeParam(request.params.incidentId)
    ),
    meta: { serverTime: new Date().toISOString() }
  });
});

incidentRouter.get("/:incidentId/timeline", async (request, response) => {
  const result = await listTimeline(
    request.auth!.id,
    workspaceId(request.params),
    routeParam(request.params.incidentId),
    queryText(request.query.cursor),
    Math.min(100, Math.max(10, queryNumber(request.query.pageSize) ?? 30))
  );
  response.json({
    data: result.items,
    meta: {
      ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
      serverTime: new Date().toISOString()
    }
  });
});

incidentRouter.patch(
  "/:incidentId/classification",
  requireCsrf,
  validateBody(classifyIncidentInputSchema),
  async (request, response) => {
    response.json({
      data: await classifyIncident(
        request.auth!.id,
        workspaceId(request.params),
        routeParam(request.params.incidentId),
        request.body,
        String(request.id)
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

incidentRouter.patch(
  "/:incidentId/assignment",
  requireCsrf,
  validateBody(assignIncidentInputSchema),
  async (request, response) => {
    response.json({
      data: await assignIncident(
        request.auth!.id,
        workspaceId(request.params),
        routeParam(request.params.incidentId),
        request.body.assigneeId,
        String(request.id)
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

incidentRouter.post("/:incidentId/claim", requireCsrf, async (request, response) => {
  response.json({
    data: await claimIncident(
      request.auth!.id,
      workspaceId(request.params),
      routeParam(request.params.incidentId),
      String(request.id)
    ),
    meta: { serverTime: new Date().toISOString() }
  });
});

incidentRouter.post(
  "/:incidentId/transitions",
  requireCsrf,
  validateBody(transitionIncidentInputSchema),
  async (request, response) => {
    response.json({
      data: await transitionIncident(
        request.auth!.id,
        workspaceId(request.params),
        routeParam(request.params.incidentId),
        request.body.status,
        String(request.id)
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

incidentRouter.post(
  "/:incidentId/comments",
  requireCsrf,
  validateBody(commentInputSchema),
  async (request, response) => {
    const result = await commentOnIncident(
      request.auth!.id,
      workspaceId(request.params),
      routeParam(request.params.incidentId),
      request.body.body,
      String(request.id)
    );
    response.status(201).json({ data: result, meta: { serverTime: new Date().toISOString() } });
  }
);
