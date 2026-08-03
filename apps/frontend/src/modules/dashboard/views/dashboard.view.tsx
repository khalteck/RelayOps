import { ApartmentOutlined } from "@ant-design/icons";
import { PageHeader } from "@relayops/ui";
import { Card, Tag } from "antd";
import { useOutletContext } from "react-router-dom";
import type { TenantRouteContext } from "@/types/tenant-route-context";
import { AnalyticsPanels } from "../components/analytics-panels";

export function Component() {
  const { organisation, workspace } = useOutletContext<TenantRouteContext>();
  return (
    <div className="page dashboard-page reporting-page">
      <PageHeader
        eyebrow={`${organisation.name} / ${workspace.name}`}
        title="Dashboard"
        description="A focused view of current operating context and incident performance."
        actions={<Tag className="workspace-active-tag">Workspace active</Tag>}
      />
      <Card className="welcome-panel">
        <div className="welcome-panel__copy">
          <span className="welcome-panel__icon">
            <ApartmentOutlined />
          </span>
          <div>
            <p className="eyebrow">Current operating context</p>
            <h2>{workspace.name}</h2>
            <p>
              You are working as <strong>{organisation.role}</strong> with live workspace updates.
            </p>
          </div>
        </div>
        <div className="sla-mini">
          <span>P1 acknowledgement</span>
          <strong>{workspace.slaPolicy.P1.acknowledgeMinutes} min</strong>
          <small>Workspace policy</small>
        </div>
      </Card>
      <AnalyticsPanels organisation={organisation} workspace={workspace} />
    </div>
  );
}
