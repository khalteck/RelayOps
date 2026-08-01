import { ArrowRightOutlined } from "@ant-design/icons";
import {
  ANALYTICS_WINDOWS,
  type AnalyticsWindow,
  type OrganisationSummary,
  type WorkspaceSummary
} from "@relayops/types";
import { AsyncState } from "@relayops/ui";
import { Button, Card, Empty, Segmented, Space } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useAnalytics } from "./analytics.api";

function metric(value: number | null, suffix = ""): string {
  return value === null ? "—" : `${Math.round(value)}${suffix}`;
}

function ChartEmpty({ description }: { description: string }) {
  return (
    <div className="chart-empty">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </div>
  );
}

export function AnalyticsPanels({
  organisation,
  workspace
}: {
  organisation: OrganisationSummary;
  workspace: WorkspaceSummary;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const rawDays = Number(params.get("days") ?? 30);
  const days: AnalyticsWindow = ANALYTICS_WINDOWS.includes(rawDays as AnalyticsWindow)
    ? (rawDays as AnalyticsWindow)
    : 30;
  const analytics = useAnalytics(workspace.id, days);
  const openIncidents = (key: "statuses" | "severities", value: string) => {
    void navigate(
      `/app/${organisation.slug}/${workspace.slug}/incidents?${new URLSearchParams({ [key]: value })}`
    );
  };

  return (
    <section aria-labelledby="analytics-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operational performance</p>
          <h2 id="analytics-heading">Incident analytics</h2>
        </div>
        <Segmented
          aria-label="Analytics date range"
          value={days}
          options={ANALYTICS_WINDOWS.map((value) => ({ value, label: `${value} days` }))}
          onChange={(value) => {
            const next = new URLSearchParams(params);
            next.set("days", String(value));
            setParams(next, { replace: true });
          }}
        />
      </div>
      <AsyncState
        loading={analytics.isPending}
        error={analytics.error}
        onRetry={() => void analytics.refetch()}
      >
        {analytics.data ? (
          <>
            <div className="metric-grid">
              {[
                ["Incidents", analytics.data.totals.incidents],
                ["Currently open", analytics.data.totals.open],
                ["Mean time to acknowledge", metric(analytics.data.totals.mttaMinutes, " min")],
                ["Mean time to resolve", metric(analytics.data.totals.mttrMinutes, " min")],
                ["SLA compliance", metric(analytics.data.totals.slaCompliancePercent, "%")]
              ].map(([label, value]) => (
                <Card className="metric-card" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </Card>
              ))}
            </div>
            <Card title="Incident trend" className="chart-card">
              {analytics.data.trend.length ? (
                <div
                  className="chart-frame"
                  role="img"
                  aria-label="Reported and resolved incident trend"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.data.trend} margin={{ left: -16, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="reported" stroke="#5b50df" strokeWidth={2} />
                      <Line type="monotone" dataKey="resolved" stroke="#14785f" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty description="No incident activity in this date range." />
              )}
            </Card>
            <div className="chart-grid">
              <DistributionChart
                title="Status distribution"
                data={analytics.data.byStatus}
                variant="horizontal"
                emptyDescription="No status data in this date range."
                onOpen={(value) => openIncidents("statuses", value)}
              />
              <DistributionChart
                title="Severity distribution"
                data={analytics.data.bySeverity}
                variant="vertical"
                emptyDescription="No severity data in this date range."
                onOpen={(value) => openIncidents("severities", value)}
              />
            </div>
          </>
        ) : null}
      </AsyncState>
    </section>
  );
}

function DistributionChart({
  title,
  data,
  variant,
  emptyDescription,
  onOpen
}: {
  title: string;
  data: Array<{ name: string; count: number }>;
  variant: "horizontal" | "vertical";
  emptyDescription: string;
  onOpen: (value: string) => void;
}) {
  const hasData = data.some((item) => item.count > 0);
  return (
    <Card title={title} className="chart-card">
      {hasData ? (
        <div className="chart-frame" role="img" aria-label={`Incidents grouped by ${title}`}>
          <ResponsiveContainer width="100%" height="100%">
            {variant === "horizontal" ? (
              <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={86} />
                <Tooltip />
                <Bar dataKey="count" fill="#5b50df" radius={[0, 5, 5, 0]} />
              </BarChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef6b72" radius={[5, 5, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty description={emptyDescription} />
      )}
      {hasData ? (
        <Space wrap size={[2, 2]}>
          {data
            .filter((item) => item.count > 0)
            .map((item) => (
              <Button
                key={item.name}
                type="link"
                size="small"
                icon={<ArrowRightOutlined />}
                onClick={() => onOpen(item.name)}
              >
                {item.name} ({item.count})
              </Button>
            ))}
        </Space>
      ) : null}
    </Card>
  );
}
