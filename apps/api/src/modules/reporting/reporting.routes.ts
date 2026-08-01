import { ANALYTICS_WINDOWS, auditFilterSchema, type AnalyticsWindow } from "@relayops/types";
import { Router, type Router as ExpressRouter } from "express";
import { queryNumber, queryText, routeParam } from "../../core/request-values.js";
import { listAuditEvents } from "./audit.service.js";
import { analyticsOverview } from "./analytics.service.js";

export const reportingRouter: ExpressRouter = Router({ mergeParams: true });

function workspaceId(params: unknown): string {
  return routeParam((params as { workspaceId?: string | string[] }).workspaceId);
}

reportingRouter.get("/analytics", async (request, response) => {
  const requested = queryNumber(request.query.days) ?? 30;
  const days: AnalyticsWindow = ANALYTICS_WINDOWS.includes(requested as AnalyticsWindow)
    ? (requested as AnalyticsWindow)
    : 30;
  response.json({
    data: await analyticsOverview(request.auth!.id, workspaceId(request.params), days),
    meta: { serverTime: new Date().toISOString() }
  });
});

reportingRouter.get("/audit-events", async (request, response) => {
  const filters = auditFilterSchema.parse({
    actorId: queryText(request.query.actorId) ?? "",
    action: queryText(request.query.action) ?? "",
    entityType: queryText(request.query.entityType) ?? "",
    from: queryText(request.query.from) ?? "",
    to: queryText(request.query.to) ?? "",
    page: Math.max(1, queryNumber(request.query.page) ?? 1),
    pageSize: Math.min(100, Math.max(10, queryNumber(request.query.pageSize) ?? 20))
  });
  const result = await listAuditEvents(request.auth!.id, workspaceId(request.params), filters);
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
