import { Router, type Router as ExpressRouter } from "express";
import { routeParam } from "../../core/request-values.js";
import { requireCsrf } from "../../middleware/csrf.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "./notification.service.js";

export const notificationRouter: ExpressRouter = Router();

notificationRouter.get("/", async (request, response) => {
  const requested = Number(request.query.limit ?? 20);
  const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 50) : 20;
  response.json({
    data: await listNotifications(request.auth!.id, limit),
    meta: { serverTime: new Date().toISOString() }
  });
});

notificationRouter.patch("/:notificationId/read", requireCsrf, async (request, response) => {
  const notification = await markNotificationRead(
    request.auth!.id,
    routeParam(request.params.notificationId)
  );
  if (!notification) {
    response.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Notification was not found",
        requestId: request.id
      }
    });
    return;
  }
  response.json({ data: notification, meta: { serverTime: new Date().toISOString() } });
});

notificationRouter.post("/read-all", requireCsrf, async (request, response) => {
  await markAllNotificationsRead(request.auth!.id);
  response.status(204).send();
});
