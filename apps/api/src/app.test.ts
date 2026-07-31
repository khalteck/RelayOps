import { describe, expect, it } from "vitest";

describe("health routes", () => {
  it("reports process liveness without requiring MongoDB", async () => {
    const { default: request } = await import("supertest");
    const { createApp } = await import("./app.js");
    const response = await request(createApp()).get("/health/live");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("keeps readiness separate from liveness", async () => {
    const { default: request } = await import("supertest");
    const { createApp } = await import("./app.js");
    const response = await request(createApp()).get("/health/ready");
    expect(response.status).toBe(503);
  });
});
