import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app: Express;
beforeAll(async () => {
  app = (await import("../../app.js")).createApp();
});

describe("verified owner onboarding", () => {
  it("verifies the emailed code before creating the first tenant", async () => {
    const agent = request.agent(app);
    const started = await agent
      .post("/api/v1/auth/register/start")
      .set("x-forwarded-for", "10.0.1.4")
      .send({
        name: "Verified Owner",
        email: "verified@example.com",
        password: "A-secure-test-password!"
      });
    expect(started.status).toBe(202);
    const { capturedEmails } = await import("../../modules/email/email.transport.js");
    const code = capturedEmails.at(-1)?.text.match(/\b\d{6}\b/)?.[0];
    expect(code).toMatch(/^\d{6}$/);

    const verified = await agent
      .post("/api/v1/auth/register/verify")
      .set("x-forwarded-for", "10.0.1.4")
      .send({ challengeId: started.body.data.challengeId, code });
    expect(verified.status).toBe(201);
    expect(verified.body.data.onboarding).toEqual({ required: true, kind: "owner" });

    const completed = await agent
      .post("/api/v1/auth/onboarding/owner")
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", verified.body.data.csrfToken)
      .send({
        organisationName: "Verified Ops",
        workspaceName: "Platform",
        preferences: {
          theme: "dark",
          inApp: { incidentAssigned: true, incidentUpdated: false, incidentCommented: true }
        }
      });
    expect(completed.status).toBe(201);
    expect(completed.body.data.destinationPath).toContain("/dashboard");
    const organisations = await agent.get("/api/v1/organisations");
    expect(organisations.body.data[0]).toMatchObject({ name: "Verified Ops", role: "owner" });
  });

  it("does not disclose that an email already belongs to an account", async () => {
    const first = await request(app)
      .post("/api/v1/auth/register/start")
      .set("x-forwarded-for", "10.0.1.5")
      .send({ name: "First", email: "same@example.com", password: "A-secure-test-password!" });
    const second = await request(app)
      .post("/api/v1/auth/register/start")
      .set("x-forwarded-for", "10.0.1.6")
      .send({ name: "Second", email: "same@example.com", password: "A-secure-test-password!" });
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(Object.keys(second.body.data).sort()).toEqual(Object.keys(first.body.data).sort());
  });
});
