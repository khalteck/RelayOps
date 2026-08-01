import { savedViewInputSchema } from "@relayops/types";
import { Router, type Router as ExpressRouter } from "express";
import { routeParam } from "../../core/request-values.js";
import { requireCsrf } from "../../middleware/csrf.js";
import { validateBody } from "../../middleware/validate.js";
import { deleteSavedView, listSavedViews, saveView } from "./saved-view.service.js";

export const savedViewRouter: ExpressRouter = Router({ mergeParams: true });

function workspaceId(params: unknown): string {
  return routeParam((params as { workspaceId?: string | string[] }).workspaceId);
}

savedViewRouter.get("/", async (request, response) => {
  response.json({
    data: await listSavedViews(request.auth!.id, workspaceId(request.params)),
    meta: { serverTime: new Date().toISOString() }
  });
});

savedViewRouter.post(
  "/",
  requireCsrf,
  validateBody(savedViewInputSchema),
  async (request, response) => {
    response.status(201).json({
      data: await saveView(request.auth!.id, workspaceId(request.params), request.body),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

savedViewRouter.put(
  "/:viewId",
  requireCsrf,
  validateBody(savedViewInputSchema),
  async (request, response) => {
    response.json({
      data: await saveView(
        request.auth!.id,
        workspaceId(request.params),
        request.body,
        routeParam(request.params.viewId)
      ),
      meta: { serverTime: new Date().toISOString() }
    });
  }
);

savedViewRouter.delete("/:viewId", requireCsrf, async (request, response) => {
  await deleteSavedView(
    request.auth!.id,
    workspaceId(request.params),
    routeParam(request.params.viewId)
  );
  response.status(204).send();
});
