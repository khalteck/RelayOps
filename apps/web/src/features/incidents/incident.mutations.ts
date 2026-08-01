import type {
  ApiResponse,
  ClassifyIncidentInput,
  CreateIncidentInput,
  IncidentDto,
  IncidentStatus,
  PersonSummary,
  TimelineEntryDto
} from "@relayops/types";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { queryKeys } from "../../app/query-keys";
import { apiRequest } from "../../services/api-client";
import {
  reconcileIncident,
  restoreIncidentCache,
  snapshotIncidentCache,
  updateIncidentCache
} from "./incident-cache";

function optimisticRevision(incident: IncidentDto): IncidentDto {
  return { ...incident, revision: incident.revision + 1, updatedAt: new Date().toISOString() };
}

export function useCreateIncident(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIncidentInput) =>
      apiRequest<IncidentDto>(`/api/v1/workspaces/${workspaceId}/incidents`, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    onSuccess: async ({ data }) => {
      client.setQueryData(queryKeys.incidents.detail(workspaceId, data.id), { data });
      await client.invalidateQueries({ queryKey: queryKeys.incidents.lists(workspaceId) });
    }
  });
}

export function useAssignIncident(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      incidentId,
      assignee
    }: {
      incidentId: string;
      assignee: PersonSummary | null;
    }) =>
      apiRequest<IncidentDto>(
        `/api/v1/workspaces/${workspaceId}/incidents/${incidentId}/assignment`,
        { method: "PATCH", body: JSON.stringify({ assigneeId: assignee?.id ?? null }) }
      ),
    onMutate: async ({ incidentId, assignee }) => {
      const snapshot = await snapshotIncidentCache(client, workspaceId, incidentId);
      updateIncidentCache(client, workspaceId, incidentId, (incident) => ({
        ...optimisticRevision(incident),
        assignee
      }));
      return snapshot;
    },
    onError: (_error, _variables, snapshot) => restoreIncidentCache(client, snapshot),
    onSuccess: ({ data }) => reconcileIncident(client, workspaceId, data),
    onSettled: async () =>
      client.invalidateQueries({ queryKey: queryKeys.incidents.lists(workspaceId) })
  });
}

export function useClaimIncident(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId }: { incidentId: string; actor: PersonSummary }) =>
      apiRequest<IncidentDto>(`/api/v1/workspaces/${workspaceId}/incidents/${incidentId}/claim`, {
        method: "POST"
      }),
    onMutate: async ({ incidentId, actor }) => {
      const snapshot = await snapshotIncidentCache(client, workspaceId, incidentId);
      updateIncidentCache(client, workspaceId, incidentId, (incident) => ({
        ...optimisticRevision(incident),
        assignee: actor
      }));
      return snapshot;
    },
    onError: (_error, _variables, snapshot) => restoreIncidentCache(client, snapshot),
    onSuccess: ({ data }) => reconcileIncident(client, workspaceId, data),
    onSettled: async () =>
      client.invalidateQueries({ queryKey: queryKeys.incidents.lists(workspaceId) })
  });
}

export function useTransitionIncident(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, status }: { incidentId: string; status: IncidentStatus }) =>
      apiRequest<IncidentDto>(
        `/api/v1/workspaces/${workspaceId}/incidents/${incidentId}/transitions`,
        { method: "POST", body: JSON.stringify({ status }) }
      ),
    onMutate: async ({ incidentId, status }) => {
      const snapshot = await snapshotIncidentCache(client, workspaceId, incidentId);
      updateIncidentCache(client, workspaceId, incidentId, (incident) => {
        const now = new Date().toISOString();
        return {
          ...optimisticRevision(incident),
          status,
          sla: {
            ...incident.sla,
            ...(status === "acknowledged" && !incident.sla.acknowledgedAt
              ? { acknowledgedAt: now }
              : {}),
            ...(status === "resolved" && !incident.sla.resolvedAt ? { resolvedAt: now } : {})
          }
        };
      });
      return snapshot;
    },
    onError: (_error, _variables, snapshot) => restoreIncidentCache(client, snapshot),
    onSuccess: ({ data }) => reconcileIncident(client, workspaceId, data),
    onSettled: async (_data, _error, variables) => {
      await client.invalidateQueries({ queryKey: queryKeys.incidents.lists(workspaceId) });
      await client.invalidateQueries({
        queryKey: queryKeys.incidents.timeline(workspaceId, variables.incidentId)
      });
    }
  });
}

export function useClassifyIncident(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, changes }: { incidentId: string; changes: ClassifyIncidentInput }) =>
      apiRequest<IncidentDto>(
        `/api/v1/workspaces/${workspaceId}/incidents/${incidentId}/classification`,
        { method: "PATCH", body: JSON.stringify(changes) }
      ),
    onMutate: async ({ incidentId, changes }) => {
      const snapshot = await snapshotIncidentCache(client, workspaceId, incidentId);
      updateIncidentCache(client, workspaceId, incidentId, (incident) => ({
        ...optimisticRevision(incident),
        ...(changes.priority ? { priority: changes.priority } : {}),
        ...(changes.severity ? { severity: changes.severity } : {})
      }));
      return snapshot;
    },
    onError: (_error, _variables, snapshot) => restoreIncidentCache(client, snapshot),
    onSuccess: ({ data }) => reconcileIncident(client, workspaceId, data),
    onSettled: async () =>
      client.invalidateQueries({ queryKey: queryKeys.incidents.lists(workspaceId) })
  });
}

type TimelineCache = InfiniteData<ApiResponse<TimelineEntryDto[]>, string | undefined>;

export function useCommentOnIncident(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      incidentId,
      body
    }: {
      incidentId: string;
      body: string;
      actor: PersonSummary;
    }) =>
      apiRequest<{ incident: IncidentDto; timeline: TimelineEntryDto }>(
        `/api/v1/workspaces/${workspaceId}/incidents/${incidentId}/comments`,
        { method: "POST", body: JSON.stringify({ body }) }
      ),
    onMutate: async ({ incidentId, body, actor }) => {
      const snapshot = await snapshotIncidentCache(client, workspaceId, incidentId);
      const timelineKey = queryKeys.incidents.timeline(workspaceId, incidentId);
      await client.cancelQueries({ queryKey: timelineKey });
      const timeline = client.getQueryData<TimelineCache>(timelineKey);
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const entry: TimelineEntryDto = {
        id: optimisticId,
        incidentId,
        actor,
        kind: "comment",
        body,
        createdAt: new Date().toISOString()
      };
      client.setQueryData<TimelineCache>(timelineKey, (current) => {
        if (!current?.pages[0]) {
          return {
            pages: [{ data: [entry], meta: { serverTime: entry.createdAt } }],
            pageParams: [undefined]
          };
        }
        const [first, ...rest] = current.pages;
        return { ...current, pages: [{ ...first, data: [entry, ...first.data] }, ...rest] };
      });
      updateIncidentCache(client, workspaceId, incidentId, optimisticRevision);
      return { snapshot, timeline, optimisticId };
    },
    onError: (_error, variables, context) => {
      restoreIncidentCache(client, context?.snapshot);
      client.setQueryData(
        queryKeys.incidents.timeline(workspaceId, variables.incidentId),
        context?.timeline
      );
    },
    onSuccess: ({ data }, variables, context) => {
      reconcileIncident(client, workspaceId, data.incident);
      client.setQueryData<TimelineCache>(
        queryKeys.incidents.timeline(workspaceId, variables.incidentId),
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page, index) => ({
                  ...page,
                  data: [
                    ...(index === 0 ? [data.timeline] : []),
                    ...page.data.filter(
                      (entry) => entry.id !== context?.optimisticId && entry.id !== data.timeline.id
                    )
                  ]
                }))
              }
            : current
      );
    }
  });
}
