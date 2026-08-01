import { ClockCircleOutlined } from "@ant-design/icons";
import type { Permission, PersonSummary, Role, WorkspaceMember } from "@relayops/types";
import { AsyncState } from "@relayops/ui";
import { Descriptions, Drawer, Progress, Space, Tag } from "antd";
import { useServerClock } from "../../hooks/use-server-clock";
import { IncidentControls } from "./incident-controls";
import { PriorityBadge, SeverityBadge, StatusBadge } from "./incident-badges";
import { IncidentTimeline } from "./incident-timeline";
import { useIncident } from "./incidents.queries";
import { formatRemaining, incidentSlaState } from "./sla-state";

export function IncidentDetailDrawer({
  workspaceId,
  incidentId,
  currentUser,
  role,
  permissions,
  members,
  mobile,
  onClose
}: {
  workspaceId: string;
  incidentId: string | null;
  currentUser: PersonSummary;
  role: Role;
  permissions: readonly string[];
  members: WorkspaceMember[];
  mobile: boolean;
  onClose: () => void;
}) {
  const query = useIncident(workspaceId, incidentId);
  const serverNow = useServerClock(query.data?.meta?.serverTime);
  const incident = query.data?.data;
  const canComment = Boolean(
    incident &&
    (permissions.includes("incident:comment:any" satisfies Permission) ||
      (permissions.includes("incident:comment:assigned" satisfies Permission) &&
        incident.assignee?.id === currentUser.id))
  );
  const sla = incident ? incidentSlaState(incident, serverNow) : null;
  const slaPercent = incident
    ? Math.max(
        0,
        Math.min(
          100,
          (sla!.remainingMs /
            ((sla!.phase === "acknowledge"
              ? incident.sla.acknowledgeTargetMinutes
              : incident.sla.resolveTargetMinutes) *
              60_000)) *
            100
        )
      )
    : 0;

  return (
    <Drawer
      title={incident ? `INC-${incident.id.slice(-6).toUpperCase()}` : "Incident details"}
      width={mobile ? "100%" : 720}
      open={Boolean(incidentId)}
      onClose={onClose}
      destroyOnHidden
      className="incident-drawer"
    >
      <AsyncState
        loading={query.isPending}
        error={query.error}
        empty={!incident}
        emptyDescription="This incident is unavailable."
        onRetry={() => void query.refetch()}
      >
        {incident && sla ? (
          <div className="incident-detail">
            <header className="incident-detail__header">
              <Space wrap>
                <StatusBadge status={incident.status} />
                <PriorityBadge priority={incident.priority} />
                <SeverityBadge severity={incident.severity} />
              </Space>
              <h2>{incident.title}</h2>
              <p>{incident.description}</p>
            </header>
            <section className={`sla-card sla-card--${sla.state}`} aria-live="polite">
              <div>
                <span>
                  <ClockCircleOutlined /> {sla.label}
                </span>
                <strong>{formatRemaining(sla.remainingMs)}</strong>
                <small>Due {new Date(sla.deadline).toLocaleString()}</small>
              </div>
              <Progress
                type="circle"
                size={58}
                percent={Math.round(slaPercent)}
                status={sla.state === "breached" ? "exception" : "normal"}
                format={() => (sla.state === "breached" ? "!" : `${Math.round(slaPercent)}%`)}
              />
            </section>
            <Descriptions column={mobile ? 1 : 2} size="small" className="incident-facts">
              <Descriptions.Item label="Affected service">
                {incident.affectedService}
              </Descriptions.Item>
              <Descriptions.Item label="Responder">
                {incident.assignee?.name ?? <Tag>Unassigned</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Reporter">{incident.reporter.name}</Descriptions.Item>
              <Descriptions.Item label="Reported">
                {new Date(incident.reportedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
            <IncidentControls
              incident={incident}
              currentUser={currentUser}
              role={role}
              permissions={permissions}
              members={members}
            />
            <IncidentTimeline
              incident={incident}
              currentUser={currentUser}
              canComment={canComment}
            />
          </div>
        ) : null}
      </AsyncState>
    </Drawer>
  );
}
