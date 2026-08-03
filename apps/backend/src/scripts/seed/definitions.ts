import type { Role } from "@relayops/types";

export interface DemoUserDefinition {
  role: Role;
  name: string;
  email: string;
}

export const DEMO_USERS: DemoUserDefinition[] = [
  { role: "owner", name: "Olivia Owner", email: "owner@relayops.demo" },
  { role: "administrator", name: "Avery Admin", email: "admin@relayops.demo" },
  { role: "responder", name: "Riley Responder", email: "responder@relayops.demo" },
  { role: "viewer", name: "Victor Viewer", email: "viewer@relayops.demo" }
];

export const DEMO_TENANTS = [
  {
    name: "Relay Labs",
    slug: "relay-labs-demo",
    workspaces: [
      { name: "Platform", slug: "platform" },
      { name: "Reliability", slug: "reliability" }
    ]
  },
  {
    name: "Northstar Commerce",
    slug: "northstar-demo",
    workspaces: [{ name: "Checkout", slug: "checkout" }]
  }
] as const;

export const DEMO_SERVICES = [
  "Platform API",
  "Checkout API",
  "Event Gateway",
  "Search Indexer",
  "Identity Service",
  "Notification Worker"
] as const;

export const DEMO_INCIDENT_SUMMARIES = [
  "Elevated request latency",
  "Error rate above budget",
  "Delayed background processing",
  "Regional dependency degradation",
  "Queue depth increasing",
  "Intermittent authorization failures"
] as const;
