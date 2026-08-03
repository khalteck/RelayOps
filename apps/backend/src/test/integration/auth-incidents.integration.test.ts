import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

interface RegisteredAccount {
  agent: ReturnType<typeof request.agent>;
  csrfToken: string;
  organisationId: string;
  workspaceId: string;
  registrationCookies: string;
}

let app: Express;

beforeAll(async () => {
  const { createApp } = await import("../../app.js");
  app = createApp();
});

async function registerAccount(suffix: string): Promise<RegisteredAccount> {
  const agent = request.agent(app);
  const registration = await agent.post("/api/v1/auth/register").send({
    name: `Owner ${suffix}`,
    email: `owner-${suffix}@example.com`,
    password: "A-secure-test-password!",
    organisationName: `Organisation ${suffix}`,
    workspaceName: `Workspace ${suffix}`
  });
  expect(registration.status).toBe(201);
  const organisations = await agent.get("/api/v1/organisations");
  const organisation = organisations.body.data[0];
  return {
    agent,
    csrfToken: registration.body.data.csrfToken,
    organisationId: organisation.id,
    workspaceId: organisation.workspaces[0].id,
    registrationCookies: String(registration.headers["set-cookie"])
  };
}

function cookieValue(cookies: string, name: string): string {
  const value = cookies.match(new RegExp(`${name}=([^;]+)`))?.[1];
  if (!value) throw new Error(`Expected ${name} cookie`);
  return value;
}

describe("authentication and incident integration", () => {
  it("revokes the current refresh session and clears every auth cookie", async () => {
    const account = await registerAccount("logout");
    const { RefreshSessionModel } = await import("../../models/refresh-session.model.js");

    const response = await account.agent
      .post("/api/v1/auth/logout")
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", account.csrfToken);
    const clearedCookies = String(response.headers["set-cookie"]);

    expect(response.status).toBe(204);
    expect(clearedCookies).toContain("relayops_access=");
    expect(clearedCookies).toContain("relayops_refresh=");
    expect(clearedCookies).toContain("relayops_csrf=");
    expect(await RefreshSessionModel.countDocuments({ revokedAt: { $exists: true } })).toBe(1);
  });

  it("rejects cross-tenant workspace access", async () => {
    const first = await registerAccount("tenant-a");
    const second = await registerAccount("tenant-b");

    const response = await second.agent.get(`/api/v1/workspaces/${first.workspaceId}/incidents`);

    expect([403, 404]).toContain(response.status);
  });

  it("rotates refresh tokens and revokes the session when an old token is replayed", async () => {
    const account = await registerAccount("refresh-replay");
    const oldRefresh = cookieValue(account.registrationCookies, "relayops_refresh");
    const csrf = cookieValue(account.registrationCookies, "relayops_csrf");
    const rotated = await account.agent
      .post("/api/v1/auth/refresh")
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", csrf);

    expect(rotated.status).toBe(200);
    expect(cookieValue(String(rotated.headers["set-cookie"]), "relayops_refresh")).not.toBe(
      oldRefresh
    );

    const replay = await request(app)
      .post("/api/v1/auth/refresh")
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", csrf)
      .set("Cookie", [`relayops_refresh=${oldRefresh}`, `relayops_csrf=${csrf}`]);
    expect(replay.status).toBe(401);

    const { RefreshSessionModel } = await import("../../models/refresh-session.model.js");
    expect(await RefreshSessionModel.countDocuments({ revokedAt: { $exists: false } })).toBe(0);
  });

  it("commits an incident, timeline entry, and audit event together", async () => {
    const account = await registerAccount("incident");
    const response = await account.agent
      .post(`/api/v1/workspaces/${account.workspaceId}/incidents`)
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", account.csrfToken)
      .send({
        title: "Checkout authorization latency",
        description: "Authorization latency exceeded the operational threshold.",
        affectedService: "Checkout API",
        priority: "P1",
        severity: "SEV1"
      });
    expect(response.status).toBe(201);

    const [{ TimelineModel }, { AuditEventModel }] = await Promise.all([
      import("../../models/timeline.model.js"),
      import("../../models/audit-event.model.js")
    ]);
    expect(await TimelineModel.countDocuments({ incidentId: response.body.data.id })).toBe(1);
    expect(await AuditEventModel.countDocuments({ entityId: response.body.data.id })).toBe(1);
  });

  it("normalizes validation failures without exposing internals", async () => {
    const account = await registerAccount("validation");
    const response = await account.agent
      .post(`/api/v1/workspaces/${account.workspaceId}/incidents`)
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", account.csrfToken)
      .send({ title: "x" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(response.body.error.requestId).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain("stack");
  });

  it("rate-limits repeated authentication attempts with a normalized response", async () => {
    let limitedBody: unknown;
    for (let attempt = 0; attempt < 25 && !limitedBody; attempt += 1) {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: `missing-${attempt}@example.com`,
          password: "A-secure-test-password!"
        });
      if (response.status === 429) limitedBody = response.body;
    }
    expect(limitedBody).toMatchObject({
      error: { code: "RATE_LIMITED", requestId: expect.any(String) }
    });
  });
});
