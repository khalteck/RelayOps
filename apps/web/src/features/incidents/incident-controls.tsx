import {
  INCIDENT_PRIORITIES,
  INCIDENT_SEVERITIES,
  nextIncidentStatus,
  type IncidentDto,
  type Permission,
  type PersonSummary,
  type Role,
  type WorkspaceMember
} from "@relayops/types";
import { App, Button, Select, Space } from "antd";
import {
  useAssignIncident,
  useClaimIncident,
  useClassifyIncident,
  useTransitionIncident
} from "./incident.mutations";

function personFromMember(member: WorkspaceMember): PersonSummary {
  return { id: member.id, name: member.name, email: member.email };
}

export function IncidentControls({
  incident,
  currentUser,
  role,
  permissions,
  members
}: {
  incident: IncidentDto;
  currentUser: PersonSummary;
  role: Role;
  permissions: readonly string[];
  members: WorkspaceMember[];
}) {
  const { message } = App.useApp();
  const workspaceId = incident.workspaceId;
  const assign = useAssignIncident(workspaceId);
  const claim = useClaimIncident(workspaceId);
  const classify = useClassifyIncident(workspaceId);
  const transition = useTransitionIncident(workspaceId);
  const has = (permission: Permission) => permissions.includes(permission);
  const assignedToMe = incident.assignee?.id === currentUser.id;
  const canModify = has("incident:update:any") || (has("incident:update:assigned") && assignedToMe);
  const nextStatus = nextIncidentStatus(incident.status);
  const transitionTarget =
    nextStatus ??
    (incident.status === "resolved" && ["owner", "administrator"].includes(role)
      ? "investigating"
      : undefined);
  const reportError = (error: Error) => void message.error(error.message);

  return (
    <section className="incident-controls" aria-label="Incident controls">
      <div className="incident-control-grid">
        <label>
          <span>Priority</span>
          <Select
            value={incident.priority}
            disabled={!canModify}
            loading={classify.isPending}
            options={INCIDENT_PRIORITIES.map((value) => ({ value }))}
            onChange={(priority) =>
              classify.mutate(
                { incidentId: incident.id, changes: { priority } },
                { onError: reportError }
              )
            }
          />
        </label>
        <label>
          <span>Severity</span>
          <Select
            value={incident.severity}
            disabled={!canModify}
            loading={classify.isPending}
            options={INCIDENT_SEVERITIES.map((value) => ({ value }))}
            onChange={(severity) =>
              classify.mutate(
                { incidentId: incident.id, changes: { severity } },
                { onError: reportError }
              )
            }
          />
        </label>
      </div>
      <label>
        <span>Responder</span>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          value={incident.assignee?.id}
          disabled={!has("incident:assign")}
          loading={assign.isPending}
          placeholder="Unassigned"
          options={members
            .filter((member) => member.role !== "viewer")
            .map((member) => ({ value: member.id, label: `${member.name} · ${member.role}` }))}
          onChange={(memberId) => {
            const member = members.find((item) => item.id === memberId);
            assign.mutate(
              {
                incidentId: incident.id,
                assignee: member ? personFromMember(member) : null
              },
              { onError: reportError }
            );
          }}
        />
      </label>
      <Space wrap>
        {!incident.assignee && has("incident:claim") ? (
          <Button
            loading={claim.isPending}
            onClick={() =>
              claim.mutate(
                { incidentId: incident.id, actor: currentUser },
                { onError: reportError }
              )
            }
          >
            Claim incident
          </Button>
        ) : null}
        {transitionTarget && canModify ? (
          <Button
            type="primary"
            loading={transition.isPending}
            onClick={() =>
              transition.mutate(
                { incidentId: incident.id, status: transitionTarget },
                { onError: reportError }
              )
            }
          >
            {incident.status === "resolved" ? "Reopen incident" : `Move to ${transitionTarget}`}
          </Button>
        ) : null}
      </Space>
    </section>
  );
}
