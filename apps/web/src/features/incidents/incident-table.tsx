import type { IncidentDto, IncidentFilters, IncidentSortField } from "@relayops/types";
import { DataTable } from "@relayops/ui";
import type { TableProps } from "antd";
import { Avatar, Space, Tag, Tooltip } from "antd";
import { PriorityBadge, SeverityBadge, StatusBadge } from "./incident-badges";
import type { IncidentColumnKey } from "./incident-columns";
import { formatRemaining, incidentSlaState } from "./sla-state";

export function IncidentTable({
  incidents,
  filters,
  serverTime,
  total,
  loading,
  error,
  onChange,
  onOpen,
  onRetry,
  visibleColumns
}: {
  incidents: IncidentDto[];
  filters: IncidentFilters;
  serverTime: string;
  total: number;
  loading: boolean;
  error: Error | null;
  onChange: (changes: Partial<IncidentFilters>) => void;
  onOpen: (incident: IncidentDto) => void;
  onRetry: () => void;
  visibleColumns: IncidentColumnKey[];
}) {
  const sortOrder = (field: IncidentSortField): "ascend" | "descend" | null =>
    filters.sortBy === field ? (filters.sortDirection === "asc" ? "ascend" : "descend") : null;
  const allColumns: NonNullable<TableProps<IncidentDto>["columns"]> = [
    {
      title: "Incident",
      dataIndex: "title",
      key: "title",
      sorter: true,
      sortOrder: sortOrder("createdAt"),
      width: 320,
      render: (_value, incident) => (
        <div className="incident-title-cell">
          <strong>{incident.title}</strong>
          <span>
            {incident.affectedService} · INC-{incident.id.slice(-6).toUpperCase()}
          </span>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      sortOrder: sortOrder("status"),
      width: 150,
      render: (status: IncidentDto["status"]) => <StatusBadge status={status} />
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      sorter: true,
      sortOrder: sortOrder("priority"),
      width: 100,
      render: (priority: IncidentDto["priority"]) => <PriorityBadge priority={priority} />
    },
    {
      title: "Impact",
      dataIndex: "severity",
      key: "severity",
      sorter: true,
      sortOrder: sortOrder("severity"),
      width: 100,
      render: (severity: IncidentDto["severity"]) => <SeverityBadge severity={severity} />
    },
    {
      title: "Responder",
      dataIndex: "assignee",
      key: "assignee",
      width: 170,
      render: (_value, incident) =>
        incident.assignee ? (
          <Space size={7}>
            <Avatar size={24}>{incident.assignee.name.slice(0, 1)}</Avatar>
            <span>{incident.assignee.name}</span>
          </Space>
        ) : (
          <Tag>Unassigned</Tag>
        )
    },
    {
      title: "SLA",
      key: "sla",
      width: 160,
      render: (_value, incident) => {
        const sla = incidentSlaState(incident, serverTime);
        return (
          <Tooltip title={`${sla.label}. Due ${new Date(sla.deadline).toLocaleString()}`}>
            <span className={`sla-inline sla-inline--${sla.state}`}>
              <i /> {formatRemaining(sla.remainingMs)}
            </span>
          </Tooltip>
        );
      }
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: true,
      sortOrder: sortOrder("updatedAt"),
      width: 150,
      render: (value: string) =>
        new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    }
  ];
  const columns = allColumns.filter((column) =>
    visibleColumns.includes(String(column.key) as IncidentColumnKey)
  );

  const tableChange: TableProps<IncidentDto>["onChange"] = (_pagination, _filters, sorter) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter;
    if (!active?.columnKey || !active.order) return;
    onChange({
      sortBy: (active.columnKey === "title"
        ? "createdAt"
        : String(active.columnKey)) as IncidentSortField,
      sortDirection: active.order === "ascend" ? "asc" : "desc",
      page: 1
    });
  };

  return (
    <DataTable
      ariaLabel="Workspace incidents"
      columns={columns}
      data={incidents}
      rowKey="id"
      loading={loading}
      error={error}
      total={total}
      page={filters.page}
      pageSize={filters.pageSize}
      emptyTitle="No incidents match this view"
      emptyDescription="Adjust the filters or report the workspace’s first incident."
      totalLabel="incidents"
      onRetry={onRetry}
      onChange={tableChange}
      onPageChange={(page, pageSize) => onChange({ page, pageSize })}
      onRowOpen={onOpen}
      rowTestId={(incident) => incident.id}
    />
  );
}
