import { NotificationModel } from "../../models/notification.model.js";
import { IncidentModel } from "../../models/incident.model.js";
import type { SeedContext } from "./tenants.js";

export async function seedDemoNotifications(context: SeedContext): Promise<void> {
  const ownerId = context.users.get("owner@relayops.demo");
  const responderId = context.users.get("responder@relayops.demo");
  const workspace = context.workspaces[0];
  if (!ownerId || !responderId || !workspace) return;
  const incidents = await IncidentModel.find({ workspaceId: workspace.workspaceId })
    .sort({ reportedAt: -1 })
    .limit(2)
    .lean();
  const definitions = [
    {
      userId: ownerId,
      kind: "incident_updated" as const,
      title: "P1 incident needs acknowledgement",
      incident: incidents[0]
    },
    {
      userId: responderId,
      kind: "incident_assigned" as const,
      title: "Incident assigned to you",
      incident: incidents[1]
    }
  ];
  for (const definition of definitions) {
    if (!definition.incident) continue;
    await NotificationModel.findOneAndUpdate(
      { userId: definition.userId, title: definition.title },
      {
        $set: {
          userId: definition.userId,
          kind: definition.kind,
          title: definition.title,
          message: definition.incident.title,
          organisationId: workspace.organisationId,
          workspaceId: workspace.workspaceId,
          resourcePath: `/app/${workspace.organisationSlug}/${workspace.workspaceSlug}/incidents?incident=${String(definition.incident._id)}`
        },
        $unset: { readAt: 1 }
      },
      { upsert: true, new: true }
    );
  }
}
