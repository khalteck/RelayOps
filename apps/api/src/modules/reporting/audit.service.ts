import type { AuditEventDto, AuditFilters, PersonSummary } from "@relayops/types";
import { Types, type FilterQuery } from "mongoose";
import { AuditEventModel, type AuditEventDocument } from "../../models/audit-event.model.js";
import { UserModel } from "../../models/user.model.js";
import { requireWorkspaceAccess } from "../tenants/tenant.authorization.js";

export async function listAuditEvents(
  userId: string,
  workspaceId: string,
  filters: AuditFilters
): Promise<{ items: AuditEventDto[]; total: number }> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId, "audit:read");
  const query: FilterQuery<AuditEventDocument> = {
    organisationId: tenant.organisationId,
    workspaceId
  };
  if (Types.ObjectId.isValid(filters.actorId)) query.actorId = filters.actorId;
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.from || filters.to) {
    query.createdAt = {
      ...(filters.from ? { $gte: new Date(filters.from) } : {}),
      ...(filters.to ? { $lte: new Date(`${filters.to}T23:59:59.999Z`) } : {})
    };
  }
  const [events, total] = await Promise.all([
    AuditEventModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize)
      .lean(),
    AuditEventModel.countDocuments(query)
  ]);
  const users = await UserModel.find({ _id: { $in: events.map((event) => event.actorId) } })
    .select("name email")
    .lean();
  const people = new Map<string, PersonSummary>(
    users.map((user) => [
      String(user._id),
      { id: String(user._id), name: user.name, email: user.email }
    ])
  );
  return {
    total,
    items: events.flatMap((event) => {
      const actor = people.get(String(event.actorId));
      if (!actor) return [];
      return [
        {
          id: String(event._id),
          organisationId: String(event.organisationId),
          ...(event.workspaceId ? { workspaceId: String(event.workspaceId) } : {}),
          actor,
          action: event.action,
          entityType: event.entityType,
          entityId: String(event.entityId),
          ...(event.metadata ? { metadata: event.metadata } : {}),
          ...(event.requestId ? { requestId: event.requestId } : {}),
          createdAt: event.createdAt.toISOString()
        }
      ];
    })
  };
}
