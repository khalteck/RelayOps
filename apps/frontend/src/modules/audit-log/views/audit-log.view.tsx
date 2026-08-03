import type { AuditEventDto, AuditFilters } from "@relayops/types";
import { DataTable, FilterBar, PageHeader } from "@relayops/ui";
import { EyeOutlined } from "@ant-design/icons";
import { Button, Descriptions, Drawer, Input, Select, Space, Tag, type TableProps } from "antd";
import { useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { CsvExportButton } from "@/components/csv-export-button";
import type { CsvColumn } from "@/helpers/csv";
import { useWorkspaceMembers } from "@/modules/incidents";
import type { TenantRouteContext } from "@/types/tenant-route-context";
import { fetchAuditEvents, useAuditEvents } from "../operations/audit.queries";

const actions = [
  "incident.created",
  "incident.assigned",
  "incident.claimed",
  "incident.transitioned",
  "incident.reopened",
  "incident.classified",
  "incident.sla_recalculated",
  "incident.commented",
  "member.invited",
  "member.invitation_accepted"
];

const auditCsvColumns: CsvColumn<AuditEventDto>[] = [
  { header: "Timestamp", value: (event) => event.createdAt },
  { header: "Actor", value: (event) => event.actor.name },
  { header: "Actor email", value: (event) => event.actor.email },
  { header: "Action", value: (event) => event.action },
  { header: "Entity type", value: (event) => event.entityType },
  { header: "Entity ID", value: (event) => event.entityId },
  { header: "Request ID", value: (event) => event.requestId },
  { header: "Metadata", value: (event) => (event.metadata ? JSON.stringify(event.metadata) : "") }
];

function boundedNumber(value: string | null, fallback: number, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : fallback;
}

export function Component() {
  const { organisation, workspace } = useOutletContext<TenantRouteContext>();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<AuditEventDto | null>(null);
  const filters = useMemo<AuditFilters>(
    () => ({
      actorId: params.get("actorId") ?? "",
      action: params.get("action") ?? "",
      entityType: params.get("entityType") ?? "",
      from: params.get("from") ?? "",
      to: params.get("to") ?? "",
      page: boundedNumber(params.get("page"), 1, 1, 100_000),
      pageSize: boundedNumber(params.get("pageSize"), 20, 10, 100)
    }),
    [params]
  );
  const audit = useAuditEvents(workspace.id, filters);
  const members = useWorkspaceMembers(workspace.id);
  const update = (changes: Partial<AuditFilters>) => {
    const next = { ...filters, ...changes };
    const values = new URLSearchParams();
    for (const key of ["actorId", "action", "entityType", "from", "to"] as const) {
      if (next[key]) values.set(key, next[key]);
    }
    if (next.page !== 1) values.set("page", String(next.page));
    if (next.pageSize !== 20) values.set("pageSize", String(next.pageSize));
    setParams(values);
  };
  const columns: TableProps<AuditEventDto>["columns"] = [
    {
      title: "Time",
      dataIndex: "createdAt",
      width: 190,
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      title: "Actor",
      dataIndex: ["actor", "name"],
      width: 180
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 210,
      render: (value: string) => <Tag>{value.replace("incident.", "")}</Tag>
    },
    {
      title: "Entity",
      key: "entity",
      width: 180,
      render: (_value, event) => `${event.entityType} · ${event.entityId.slice(-6).toUpperCase()}`
    },
    {
      title: "Request ID",
      dataIndex: "requestId",
      ellipsis: true,
      render: (value?: string) => value ?? "—"
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_value, event) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          aria-label={`View ${event.action} audit event`}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            setSelected(event);
          }}
        />
      )
    }
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${organisation.name} / ${workspace.name}`}
        title="Audit log"
        description="An immutable record of operational changes in this workspace."
        actions={
          <CsvExportButton
            columns={auditCsvColumns}
            total={audit.data?.meta?.total ?? 0}
            filename={`relayops-${workspace.slug}-audit-log`}
            loadRows={(limit) =>
              fetchAuditEvents(workspace.id, { ...filters, page: 1, pageSize: limit }).then(
                (result) => result.data
              )
            }
          />
        }
      />
      <FilterBar
        primary={
          <>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={filters.actorId || undefined}
              placeholder="Actor"
              aria-label="Filter audit log by actor"
              className="filter-select"
              options={(members.data ?? []).map((member) => ({
                value: member.id,
                label: member.name
              }))}
              onChange={(actorId) => update({ actorId: actorId ?? "", page: 1 })}
            />
            <Select
              allowClear
              value={filters.action || undefined}
              placeholder="Action"
              aria-label="Filter audit log by action"
              className="filter-select"
              options={actions.map((action) => ({ value: action, label: action }))}
              onChange={(action) => update({ action: action ?? "", page: 1 })}
            />
            <Input
              value={filters.entityType}
              placeholder="Entity type"
              aria-label="Filter audit log by entity type"
              className="filter-select"
              onChange={(event) => update({ entityType: event.target.value, page: 1 })}
            />
            <Input
              type="date"
              value={filters.from}
              aria-label="Audit events from date"
              className="date-filter"
              onChange={(event) => update({ from: event.target.value, page: 1 })}
            />
            <Input
              type="date"
              value={filters.to}
              aria-label="Audit events to date"
              className="date-filter"
              onChange={(event) => update({ to: event.target.value, page: 1 })}
            />
          </>
        }
        secondary={
          <Space>
            <span>{audit.data?.meta?.total ?? 0} recorded events</span>
          </Space>
        }
      />
      <DataTable
        ariaLabel="Workspace audit events"
        columns={columns}
        data={audit.data?.data ?? []}
        rowKey="id"
        loading={audit.isPending}
        error={audit.error}
        total={audit.data?.meta?.total ?? 0}
        page={filters.page}
        pageSize={filters.pageSize}
        emptyDescription="No audit events match these filters."
        totalLabel="events"
        onRetry={() => void audit.refetch()}
        onPageChange={(page, pageSize) => update({ page, pageSize })}
        onRowOpen={setSelected}
      />
      <Drawer
        title="Audit event details"
        width="min(500px, 100vw)"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="audit-detail">
            <Tag>{selected.action}</Tag>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Occurred">
                {new Date(selected.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Actor">
                {selected.actor.name} · {selected.actor.email}
              </Descriptions.Item>
              <Descriptions.Item label="Entity">
                {selected.entityType} · {selected.entityId}
              </Descriptions.Item>
              <Descriptions.Item label="Request ID">
                {selected.requestId ?? "Not recorded"}
              </Descriptions.Item>
            </Descriptions>
            <div>
              <h3>Change metadata</h3>
              {selected.metadata ? (
                <pre>{JSON.stringify(selected.metadata, null, 2)}</pre>
              ) : (
                <p>No additional metadata was recorded.</p>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
