import { PlusOutlined } from "@ant-design/icons";
import type { IncidentDto, IncidentFilters, PersonSummary, SavedViewDto } from "@relayops/types";
import { PageHeader } from "@relayops/ui";
import { Button, Grid, Space, Tag } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useSession } from "../auth/auth.api";
import type { TenantRouteContext } from "../organisations/tenant-context";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { useServerClock } from "../../hooks/use-server-clock";
import { CreateIncidentDrawer } from "./create-incident-drawer";
import { INCIDENT_COLUMNS, readVisibleColumns, type IncidentColumnKey } from "./incident-columns";
import { IncidentDetailDrawer } from "./incident-detail-drawer";
import { IncidentFilterBar } from "./incident-filter-bar";
import { readIncidentFilters, writeIncidentFilters } from "./incident-filters";
import { IncidentTable } from "./incident-table";
import { useIncidents, useWorkspaceMembers } from "./incidents.queries";
import { useSavedViews } from "./saved-views.api";

export function Component() {
  const { organisation, workspace } = useOutletContext<TenantRouteContext>();
  const session = useSession();
  const screens = Grid.useBreakpoint();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readIncidentFilters(params), [params]);
  const [search, setSearch] = useState(filters.search);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const lastOpened = useRef<string | null>(null);
  const incidents = useIncidents(workspace.id, filters);
  const members = useWorkspaceMembers(workspace.id);
  const savedViews = useSavedViews(workspace.id);
  const serverTime = useServerClock(incidents.data?.meta?.serverTime);
  const incidentId = params.get("incident");
  const activeViewId = params.get("view");
  const visibleColumns = readVisibleColumns(params.get("columns"));

  const updateFilters = useCallback(
    (changes: Partial<IncidentFilters>) => {
      setParams(writeIncidentFilters(params, { ...filters, ...changes }));
    },
    [filters, params, setParams]
  );

  useEffect(() => setSearch(filters.search), [filters.search]);
  useEffect(() => {
    if (debouncedSearch !== filters.search) updateFilters({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch, filters.search, updateFilters]);

  const openIncidentId = (id: string) => {
    lastOpened.current = id;
    const next = new URLSearchParams(params);
    next.set("incident", id);
    setParams(next);
  };

  const openIncident = (incident: IncidentDto) => openIncidentId(incident.id);

  const closeIncident = () => {
    const next = new URLSearchParams(params);
    next.delete("incident");
    setParams(next);
    const rowId = lastOpened.current;
    window.requestAnimationFrame(() => {
      if (rowId) document.querySelector<HTMLElement>(`[data-incident-row="${rowId}"]`)?.focus();
    });
  };

  const applyView = (view: SavedViewDto | null) => {
    if (!view) {
      const next = new URLSearchParams(params);
      next.delete("view");
      setParams(next);
      return;
    }
    const nextFilters: IncidentFilters = { ...view.definition.filters, page: 1 };
    const next = writeIncidentFilters(params, nextFilters);
    next.set("view", view.id);
    const columns = view.definition.visibleColumns.filter((column): column is IncidentColumnKey =>
      INCIDENT_COLUMNS.includes(column as IncidentColumnKey)
    );
    if (columns.length && columns.length !== INCIDENT_COLUMNS.length) {
      next.set("columns", columns.join(","));
    } else {
      next.delete("columns");
    }
    setParams(next);
  };

  const updateColumns = (columns: IncidentColumnKey[]) => {
    const next = new URLSearchParams(params);
    if (columns.length === INCIDENT_COLUMNS.length) next.delete("columns");
    else next.set("columns", columns.join(","));
    setParams(next);
  };

  const user: PersonSummary = session.data?.user ?? { id: "", name: "Current user", email: "" };
  const canCreate = organisation.permissions.includes("incident:create");

  return (
    <div className="page incident-page">
      <PageHeader
        eyebrow={`${organisation.name} / ${workspace.name}`}
        title="Incidents"
        description="Coordinate ownership, response progress, and service-level commitments."
        actions={
          <Space>
            {incidents.isFetching && !incidents.isPending ? <Tag>Refreshing</Tag> : null}
            {canCreate ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                Report incident
              </Button>
            ) : null}
          </Space>
        }
      />
      <IncidentFilterBar
        workspaceId={workspace.id}
        filters={filters}
        search={search}
        members={members.data ?? []}
        views={savedViews.data ?? []}
        activeViewId={activeViewId}
        visibleColumns={visibleColumns}
        onSearch={setSearch}
        onChange={updateFilters}
        onApplyView={applyView}
        onColumnsChange={updateColumns}
      />
      <IncidentTable
        incidents={incidents.data?.data ?? []}
        filters={filters}
        serverTime={serverTime}
        total={incidents.data?.meta?.total ?? 0}
        loading={incidents.isPending}
        error={incidents.error}
        onChange={updateFilters}
        onOpen={openIncident}
        onRetry={() => void incidents.refetch()}
        visibleColumns={visibleColumns}
      />
      <CreateIncidentDrawer
        workspaceId={workspace.id}
        open={createOpen}
        members={members.data ?? []}
        canAssign={organisation.permissions.includes("incident:assign")}
        onClose={() => setCreateOpen(false)}
        onCreated={(createdId) => {
          setCreateOpen(false);
          openIncidentId(createdId);
        }}
      />
      <IncidentDetailDrawer
        workspaceId={workspace.id}
        incidentId={incidentId}
        currentUser={user}
        role={organisation.role}
        permissions={organisation.permissions}
        members={members.data ?? []}
        mobile={!screens.sm}
        onClose={closeIncident}
      />
    </div>
  );
}
