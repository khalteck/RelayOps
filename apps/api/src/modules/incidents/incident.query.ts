import type { IncidentDto, IncidentFilters, TimelinePage } from "@relayops/types";
import { Types, type FilterQuery } from "mongoose";
import { AppError } from "../../core/errors.js";
import { IncidentModel, type IncidentDocument } from "../../models/incident.model.js";
import { TimelineModel } from "../../models/timeline.model.js";
import { requireWorkspaceAccess } from "../tenants/tenant.authorization.js";
import { incidentDto, incidentsDto, timelineEntriesDto } from "./incident.dto.js";

function escapedSearch(search: string): RegExp {
  return new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function listIncidents(
  userId: string,
  workspaceId: string,
  filters: IncidentFilters
): Promise<{ items: IncidentDto[]; total: number }> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId);
  const query: FilterQuery<IncidentDocument> = {
    organisationId: tenant.organisationId,
    workspaceId
  };
  if (filters.search) {
    const search = escapedSearch(filters.search);
    query.$or = [{ title: search }, { description: search }, { affectedService: search }];
  }
  if (filters.statuses.length) query.status = { $in: filters.statuses };
  if (filters.priorities.length) query.priority = { $in: filters.priorities };
  if (filters.severities.length) query.severity = { $in: filters.severities };
  if (filters.assignee === "me") query.assigneeId = userId;
  else if (filters.assignee === "unassigned") query.assigneeId = { $exists: false };
  else if (Types.ObjectId.isValid(filters.assignee)) query.assigneeId = filters.assignee;

  const direction = filters.sortDirection === "asc" ? 1 : -1;
  const [records, total] = await Promise.all([
    IncidentModel.find(query)
      .sort({ [filters.sortBy]: direction, _id: -1 })
      .skip((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize)
      .lean(),
    IncidentModel.countDocuments(query)
  ]);
  return { items: await incidentsDto(records), total };
}

export async function getIncident(
  userId: string,
  workspaceId: string,
  incidentId: string
): Promise<IncidentDto> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId);
  if (!Types.ObjectId.isValid(incidentId))
    throw new AppError(404, "NOT_FOUND", "Incident not found");
  const incident = await IncidentModel.findOne({
    _id: incidentId,
    organisationId: tenant.organisationId,
    workspaceId
  }).lean();
  if (!incident) throw new AppError(404, "NOT_FOUND", "Incident not found");
  return incidentDto(incident);
}

export async function listTimeline(
  userId: string,
  workspaceId: string,
  incidentId: string,
  cursor?: string,
  pageSize = 30
): Promise<TimelinePage> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId);
  if (!Types.ObjectId.isValid(incidentId))
    throw new AppError(404, "NOT_FOUND", "Incident not found");
  if (cursor && !Types.ObjectId.isValid(cursor)) {
    throw new AppError(400, "VALIDATION_ERROR", "Timeline cursor is invalid");
  }
  const incidentExists = await IncidentModel.exists({
    _id: incidentId,
    organisationId: tenant.organisationId,
    workspaceId
  });
  if (!incidentExists) throw new AppError(404, "NOT_FOUND", "Incident not found");

  const entries = await TimelineModel.find({
    organisationId: tenant.organisationId,
    workspaceId,
    incidentId,
    ...(cursor ? { _id: { $lt: cursor } } : {})
  })
    .sort({ _id: -1 })
    .limit(pageSize + 1)
    .lean();
  const hasMore = entries.length > pageSize;
  const page = entries.slice(0, pageSize);
  const last = page.at(-1);
  return {
    items: await timelineEntriesDto(page),
    ...(hasMore && last ? { nextCursor: String(last._id) } : {})
  };
}
