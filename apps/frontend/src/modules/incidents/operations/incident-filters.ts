import {
  INCIDENT_PRIORITIES,
  INCIDENT_SEVERITIES,
  INCIDENT_SORT_FIELDS,
  INCIDENT_STATUSES,
  incidentFilterSchema,
  type IncidentFilters
} from "@relayops/types";

function allowedList<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  return value.split(",").filter((item): item is T => allowed.includes(item as T));
}

function boundedNumber(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : fallback;
}

export function readIncidentFilters(params: URLSearchParams): IncidentFilters {
  return incidentFilterSchema.parse({
    search: params.get("search") ?? "",
    statuses: allowedList(params.get("statuses"), INCIDENT_STATUSES),
    priorities: allowedList(params.get("priorities"), INCIDENT_PRIORITIES),
    severities: allowedList(params.get("severities"), INCIDENT_SEVERITIES),
    assignee: params.get("assignee") ?? "",
    sortBy: INCIDENT_SORT_FIELDS.includes(params.get("sortBy") as never)
      ? params.get("sortBy")
      : "createdAt",
    sortDirection: params.get("direction") === "asc" ? "asc" : "desc",
    page: boundedNumber(params.get("page"), 1, 1, 100_000),
    pageSize: boundedNumber(params.get("pageSize"), 20, 10, 100)
  });
}

export function normalizeIncidentFilters(filters: IncidentFilters): IncidentFilters {
  return {
    ...filters,
    search: filters.search.trim(),
    statuses: [...filters.statuses].sort(),
    priorities: [...filters.priorities].sort(),
    severities: [...filters.severities].sort()
  };
}

export function writeIncidentFilters(
  current: URLSearchParams,
  filters: IncidentFilters
): URLSearchParams {
  const next = new URLSearchParams();
  const normalized = normalizeIncidentFilters(filters);
  if (normalized.search) next.set("search", normalized.search);
  if (normalized.statuses.length) next.set("statuses", normalized.statuses.join(","));
  if (normalized.priorities.length) next.set("priorities", normalized.priorities.join(","));
  if (normalized.severities.length) next.set("severities", normalized.severities.join(","));
  if (normalized.assignee) next.set("assignee", normalized.assignee);
  if (normalized.sortBy !== "createdAt") next.set("sortBy", normalized.sortBy);
  if (normalized.sortDirection !== "desc") next.set("direction", normalized.sortDirection);
  if (normalized.page !== 1) next.set("page", String(normalized.page));
  if (normalized.pageSize !== 20) next.set("pageSize", String(normalized.pageSize));
  for (const preserved of ["incident", "view", "columns"]) {
    const value = current.get(preserved);
    if (value) next.set(preserved, value);
  }
  return next;
}

export function incidentFiltersQuery(filters: IncidentFilters): string {
  const params = writeIncidentFilters(new URLSearchParams(), filters);
  return params.toString();
}

export function incidentApiQuery(filters: IncidentFilters): string {
  const normalized = normalizeIncidentFilters(filters);
  const params = new URLSearchParams({
    page: String(normalized.page),
    pageSize: String(normalized.pageSize),
    sortBy: normalized.sortBy,
    sortDirection: normalized.sortDirection
  });
  if (normalized.search) params.set("search", normalized.search);
  if (normalized.statuses.length) params.set("statuses", normalized.statuses.join(","));
  if (normalized.priorities.length) params.set("priorities", normalized.priorities.join(","));
  if (normalized.severities.length) params.set("severities", normalized.severities.join(","));
  if (normalized.assignee) params.set("assignee", normalized.assignee);
  return params.toString();
}
