import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type AnalyticsOverview,
  type AnalyticsWindow,
  type IncidentSeverity,
  type IncidentStatus
} from "@relayops/types";
import { Types } from "mongoose";
import { IncidentModel } from "../../models/incident.model.js";
import { requireWorkspaceAccess } from "../tenants/tenant.authorization.js";

interface CountResult<T extends string> {
  _id: T;
  count: number;
}

interface MetricsResult {
  incidents: number;
  open: number;
  acknowledged: number;
  resolved: number;
  acknowledgeDuration: number;
  resolveDuration: number;
  slaMeasured: number;
  slaCompliant: number;
}

export async function analyticsOverview(
  userId: string,
  workspaceId: string,
  rangeDays: AnalyticsWindow
): Promise<AnalyticsOverview> {
  const tenant = await requireWorkspaceAccess(userId, workspaceId, "analytics:read");
  const cutoff = new Date(Date.now() - rangeDays * 86_400_000);
  const match = {
    organisationId: new Types.ObjectId(tenant.organisationId),
    workspaceId: new Types.ObjectId(workspaceId),
    reportedAt: { $gte: cutoff }
  };
  const [metricsRows, statuses, severities, trendRows] = await Promise.all([
    IncidentModel.aggregate<MetricsResult>([
      { $match: match },
      {
        $group: {
          _id: null,
          incidents: { $sum: 1 },
          open: { $sum: { $cond: [{ $ne: ["$status", "resolved"] }, 1, 0] } },
          acknowledged: { $sum: { $cond: [{ $ifNull: ["$sla.acknowledgedAt", false] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $ifNull: ["$sla.resolvedAt", false] }, 1, 0] } },
          acknowledgeDuration: {
            $sum: {
              $cond: [
                { $ifNull: ["$sla.acknowledgedAt", false] },
                { $subtract: ["$sla.acknowledgedAt", "$reportedAt"] },
                0
              ]
            }
          },
          resolveDuration: {
            $sum: {
              $cond: [
                { $ifNull: ["$sla.resolvedAt", false] },
                { $subtract: ["$sla.resolvedAt", "$reportedAt"] },
                0
              ]
            }
          },
          slaMeasured: { $sum: { $cond: [{ $ifNull: ["$sla.resolvedAt", false] }, 1, 0] } },
          slaCompliant: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ["$sla.acknowledgedAt", "$sla.acknowledgeDueAt"] },
                    { $lte: ["$sla.resolvedAt", "$sla.resolveDueAt"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]),
    IncidentModel.aggregate<CountResult<IncidentStatus>>([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    IncidentModel.aggregate<CountResult<IncidentSeverity>>([
      { $match: match },
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]),
    IncidentModel.aggregate<{ _id: string; reported: number; resolved: number }>([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { date: "$reportedAt", format: "%Y-%m-%d", timezone: "UTC" } },
          reported: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $ifNull: ["$sla.resolvedAt", false] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);
  const metrics = metricsRows[0];
  const countFor = <T extends string>(rows: CountResult<T>[], name: T) =>
    rows.find((row) => row._id === name)?.count ?? 0;
  return {
    rangeDays,
    totals: {
      incidents: metrics?.incidents ?? 0,
      open: metrics?.open ?? 0,
      mttaMinutes: metrics?.acknowledged
        ? metrics.acknowledgeDuration / metrics.acknowledged / 60_000
        : null,
      mttrMinutes: metrics?.resolved ? metrics.resolveDuration / metrics.resolved / 60_000 : null,
      slaCompliancePercent: metrics?.slaMeasured
        ? (metrics.slaCompliant / metrics.slaMeasured) * 100
        : null
    },
    trend: trendRows.map((row) => ({
      date: row._id,
      reported: row.reported,
      resolved: row.resolved
    })),
    byStatus: INCIDENT_STATUSES.map((name) => ({ name, count: countFor(statuses, name) })),
    bySeverity: INCIDENT_SEVERITIES.map((name) => ({ name, count: countFor(severities, name) }))
  };
}
