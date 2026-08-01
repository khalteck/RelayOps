import type { IncidentDto, TimelineEntryDto } from "@relayops/types";
import { IncidentModel } from "../../models/incident.model.js";
import { TimelineModel } from "../../models/timeline.model.js";
import { publishWorkspaceEvent } from "../realtime/realtime.publisher.js";
import { incidentDto, timelineEntryDto } from "./incident.dto.js";

export async function publishIncidentResult(
  incidentId: string,
  timelineId: string,
  event: "incident.created" | "incident.updated"
): Promise<{ incident: IncidentDto; timeline: TimelineEntryDto }> {
  const [storedIncident, storedTimeline] = await Promise.all([
    IncidentModel.findById(incidentId).lean(),
    TimelineModel.findById(timelineId).lean()
  ]);
  if (!storedIncident || !storedTimeline)
    throw new Error("Committed incident activity was not found");
  const [incident, timeline] = await Promise.all([
    incidentDto(storedIncident),
    timelineEntryDto(storedTimeline)
  ]);

  // Realtime delivery happens only after the transaction is committed and the
  // authoritative DTO has been reloaded from MongoDB.
  publishWorkspaceEvent(incident.workspaceId, event, incident);
  publishWorkspaceEvent(incident.workspaceId, "timeline.created", {
    ...timeline,
    revision: incident.revision
  });
  return { incident, timeline };
}
