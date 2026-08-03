import type { IncidentDto, NotificationDto, NotificationKind } from "@relayops/types";
import { NotificationModel, type NotificationDocument } from "../../models/notification.model.js";
import { OrganisationModel } from "../../models/organisation.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { publishUserEvent } from "../realtime/realtime.publisher.js";

export function notificationDto(
  notification: NotificationDocument & { _id: unknown }
): NotificationDto {
  return {
    id: String(notification._id),
    kind: notification.kind,
    title: notification.title,
    message: notification.message,
    ...(notification.organisationId ? { organisationId: String(notification.organisationId) } : {}),
    ...(notification.workspaceId ? { workspaceId: String(notification.workspaceId) } : {}),
    ...(notification.resourcePath ? { resourcePath: notification.resourcePath } : {}),
    ...(notification.readAt ? { readAt: notification.readAt.toISOString() } : {}),
    createdAt: notification.createdAt.toISOString()
  };
}

export async function createNotification(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  message: string;
  organisationId?: string;
  workspaceId?: string;
  resourcePath?: string;
}): Promise<NotificationDto> {
  const notification = await NotificationModel.create(input);
  const dto = notificationDto(notification);
  publishUserEvent(input.userId, "notification.created", dto);
  return dto;
}

export async function listNotifications(userId: string, limit: number) {
  const [items, unreadCount] = await Promise.all([
    NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
    NotificationModel.countDocuments({ userId, readAt: { $exists: false } })
  ]);
  return { items: items.map(notificationDto), unreadCount };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  return notification ? notificationDto(notification) : null;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await NotificationModel.updateMany(
    { userId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } }
  );
}

export async function notifyIncidentParticipants(
  incident: IncidentDto,
  actorId: string,
  kind: Exclude<NotificationKind, "membership_added">,
  recipients?: string[]
): Promise<void> {
  const recipientIds = new Set(
    (recipients ?? [incident.reporter.id, incident.assignee?.id ?? ""]).filter(
      (id) => id && id !== actorId
    )
  );
  if (!recipientIds.size) return;
  const [organisation, workspace] = await Promise.all([
    OrganisationModel.findById(incident.organisationId).select("slug").lean(),
    WorkspaceModel.findById(incident.workspaceId).select("slug").lean()
  ]);
  const resourcePath =
    organisation && workspace
      ? `/app/${organisation.slug}/${workspace.slug}/incidents?incident=${incident.id}`
      : undefined;
  const titles: Record<typeof kind, string> = {
    incident_assigned: "Incident assigned to you",
    incident_updated: "Incident status updated",
    incident_commented: "New incident comment"
  };
  await Promise.all(
    [...recipientIds].map((userId) =>
      createNotification({
        userId,
        kind,
        title: titles[kind],
        message: `${incident.title} is now ${incident.status.replaceAll("_", " ")}.`,
        organisationId: incident.organisationId,
        workspaceId: incident.workspaceId,
        ...(resourcePath ? { resourcePath } : {})
      })
    )
  );
}
