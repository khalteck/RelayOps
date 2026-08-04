import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app: Express;
beforeAll(async () => {
  app = (await import("../../app.js")).createApp();
});

describe("invitation and member lifecycle", () => {
  it("emails, onboards, suspends, restores, and removes an invited responder", async () => {
    const owner = request.agent(app);
    const registered = await owner
      .post("/api/v1/auth/register")
      .set("x-forwarded-for", "10.0.2.1")
      .send({
        name: "Lifecycle Owner",
        email: "lifecycle-owner@example.com",
        password: "A-secure-test-password!",
        organisationName: "Lifecycle Ops",
        workspaceName: "Core"
      });
    const csrf = registered.body.data.csrfToken as string;
    const organisations = await owner.get("/api/v1/organisations");
    const organisation = organisations.body.data[0];
    const invited = await owner
      .post(`/api/v1/organisations/${organisation.id}/invitations`)
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", csrf)
      .send({
        email: "invited-responder@example.com",
        role: "responder",
        workspaceIds: [organisation.workspaces[0].id]
      });
    expect(invited.status).toBe(201);
    expect(invited.body.data.deliveryStatus).toBe("sent");

    const { capturedEmails } = await import("../../modules/email/email.transport.js");
    const invitationUrl = capturedEmails
      .at(-1)
      ?.text.match(/http:\/\/localhost:5175\/accept-invite\/[^\s]+/)?.[0];
    expect(invitationUrl).toBeTruthy();
    const token = invitationUrl?.split("/").at(-1) ?? "";
    const member = request.agent(app);
    const accepted = await member
      .post(`/api/v1/invitations/${token}/accept`)
      .set("x-forwarded-for", "10.0.2.2")
      .send({ name: "Invited Responder", password: "A-secure-test-password!" });
    expect(accepted.status).toBe(200);
    const login = await member
      .post("/api/v1/auth/login")
      .set("x-forwarded-for", "10.0.2.2")
      .send({ email: "invited-responder@example.com", password: "A-secure-test-password!" });
    expect(login.body.data.onboarding.kind).toBe("invited");
    const membershipId = login.body.data.onboarding.membershipId as string;
    const completed = await member
      .post(`/api/v1/auth/onboarding/members/${membershipId}/complete`)
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", login.body.data.csrfToken)
      .send({
        name: "Invited Responder",
        preferences: {
          theme: "system",
          inApp: { incidentAssigned: true, incidentUpdated: true, incidentCommented: true }
        }
      });
    expect(completed.status).toBe(200);

    const suspend = await owner
      .patch(`/api/v1/organisations/${organisation.id}/members/${membershipId}/status`)
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", csrf)
      .send({ status: "suspended" });
    expect(suspend.status).toBe(200);
    expect((await member.get("/api/v1/organisations")).body.data).toEqual([]);
    const restore = await owner
      .patch(`/api/v1/organisations/${organisation.id}/members/${membershipId}/status`)
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", csrf)
      .send({ status: "active" });
    expect(restore.status).toBe(200);
    const removed = await owner
      .delete(`/api/v1/organisations/${organisation.id}/members/${membershipId}`)
      .set("origin", "http://localhost:5175")
      .set("x-csrf-token", csrf);
    expect(removed.status).toBe(204);
    expect(capturedEmails.slice(-3).map((email) => email.subject)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/suspended/i),
        expect.stringMatching(/restored/i),
        expect.stringMatching(/removed/i)
      ])
    );
  });
});
