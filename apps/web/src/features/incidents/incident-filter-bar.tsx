import { SearchOutlined } from "@ant-design/icons";
import {
  INCIDENT_PRIORITIES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  incidentStatusLabels,
  type IncidentFilters,
  type SavedViewDto,
  type WorkspaceMember
} from "@relayops/types";
import { FilterBar } from "@relayops/ui";
import { Button, Input, Select, Space } from "antd";
import { INCIDENT_COLUMNS, incidentColumnLabels, type IncidentColumnKey } from "./incident-columns";
import { SavedViewMenu } from "./saved-view-menu";

export function IncidentFilterBar({
  workspaceId,
  filters,
  search,
  members,
  views,
  activeViewId,
  visibleColumns,
  onSearch,
  onChange,
  onApplyView,
  onColumnsChange
}: {
  workspaceId: string;
  filters: IncidentFilters;
  search: string;
  members: WorkspaceMember[];
  views: SavedViewDto[];
  activeViewId: string | null;
  visibleColumns: IncidentColumnKey[];
  onSearch: (search: string) => void;
  onChange: (changes: Partial<IncidentFilters>) => void;
  onApplyView: (view: SavedViewDto | null) => void;
  onColumnsChange: (columns: IncidentColumnKey[]) => void;
}) {
  const hasFilters = Boolean(
    filters.search ||
    filters.statuses.length ||
    filters.priorities.length ||
    filters.severities.length ||
    filters.assignee
  );

  return (
    <FilterBar
      primary={
        <>
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Search title, service or description"
            aria-label="Search incidents"
            className="incident-search"
            onChange={(event) => onSearch(event.target.value)}
          />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            value={filters.statuses}
            placeholder="Status"
            aria-label="Filter by status"
            className="filter-select"
            options={INCIDENT_STATUSES.map((status) => ({
              value: status,
              label: incidentStatusLabels[status]
            }))}
            onChange={(statuses) => onChange({ statuses, page: 1 })}
          />
          <Select
            mode="multiple"
            allowClear
            value={filters.priorities}
            placeholder="Priority"
            aria-label="Filter by priority"
            className="filter-select filter-select--small"
            options={INCIDENT_PRIORITIES.map((priority) => ({ value: priority, label: priority }))}
            onChange={(priorities) => onChange({ priorities, page: 1 })}
          />
          <Select
            mode="multiple"
            allowClear
            value={filters.severities}
            placeholder="Severity"
            aria-label="Filter by severity"
            className="filter-select filter-select--small"
            options={INCIDENT_SEVERITIES.map((severity) => ({ value: severity, label: severity }))}
            onChange={(severities) => onChange({ severities, page: 1 })}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={filters.assignee || undefined}
            placeholder="Assignee"
            aria-label="Filter by assignee"
            className="filter-select"
            options={[
              { value: "me", label: "Assigned to me" },
              { value: "unassigned", label: "Unassigned" },
              ...members.map((member) => ({ value: member.id, label: member.name }))
            ]}
            onChange={(assignee) => onChange({ assignee: assignee ?? "", page: 1 })}
          />
        </>
      }
      secondary={
        <Space wrap>
          {hasFilters ? (
            <Button
              type="link"
              onClick={() =>
                onChange({
                  search: "",
                  statuses: [],
                  priorities: [],
                  severities: [],
                  assignee: "",
                  page: 1
                })
              }
            >
              Clear filters
            </Button>
          ) : null}
          <SavedViewMenu
            workspaceId={workspaceId}
            views={views}
            activeViewId={activeViewId}
            filters={filters}
            visibleColumns={visibleColumns}
            onApply={onApplyView}
          />
          <Select
            mode="multiple"
            maxTagCount={0}
            value={visibleColumns}
            placeholder="Columns"
            aria-label="Visible incident columns"
            className="column-select"
            options={INCIDENT_COLUMNS.map((column) => ({
              value: column,
              label: incidentColumnLabels[column]
            }))}
            onChange={(columns) => onColumnsChange(columns.length ? columns : ["title"])}
          />
        </Space>
      }
    />
  );
}
