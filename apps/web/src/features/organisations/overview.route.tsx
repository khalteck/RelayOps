import {
  ApartmentOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { PageHeader } from "@relayops/ui";
import { Card, Col, Row, Tag } from "antd";
import { useOutletContext } from "react-router-dom";
import type { TenantRouteContext } from "./tenant-context";

const foundations = [
  {
    icon: <SafetyCertificateOutlined />,
    title: "Protected by design",
    description:
      "Backend-enforced tenant scope and role capabilities guard every protected request."
  },
  {
    icon: <ClockCircleOutlined />,
    title: "SLA policy ready",
    description:
      "Priority targets are configured now and snapshotted when incident workflows begin."
  },
  {
    icon: <TeamOutlined />,
    title: "Role-aware workspace",
    description: "Navigation and available actions reflect the active organisation membership."
  }
];

export function Component() {
  const { organisation, workspace } = useOutletContext<TenantRouteContext>();

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${organisation.name} / ${workspace.name}`}
        title="Operations overview"
        description="Your Stage 1 foundation is connected, protected, and ready for incident workflows."
        actions={<Tag color="green">Workspace active</Tag>}
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
              You are working as <strong>{organisation.role}</strong>. Tenant identity is resolved
              from the URL and server membership, never duplicated into client state.
            </p>
          </div>
        </div>
        <div className="sla-mini">
          <span>P1 acknowledgement</span>
          <strong>{workspace.slaPolicy.P1.acknowledgeMinutes} min</strong>
          <small>Workspace policy</small>
        </div>
      </Card>
      <Row gutter={[16, 16]} className="foundation-grid">
        {foundations.map((item) => (
          <Col xs={24} md={8} key={item.title}>
            <Card className="foundation-card">
              <span className="foundation-card__icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Card>
          </Col>
        ))}
      </Row>
      <Card className="stage-card">
        <div>
          <p className="eyebrow">Stage 2 preview</p>
          <h3>Incident workflows come next</h3>
          <p>
            Creation, assignment, timelines, saved views, realtime events, analytics, and audit
            screens will build on this verified foundation after the Stage 1 review.
          </p>
        </div>
        <div className="stage-card__line" aria-hidden="true">
          <i className="is-done" />
          <span />
          <i />
          <span />
          <i />
        </div>
      </Card>
    </div>
  );
}
