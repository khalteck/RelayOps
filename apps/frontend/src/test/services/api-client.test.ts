import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, type ApiError } from "@/services/api-client";

describe("apiRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes an empty successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    await expect(apiRequest("/api/v1/example")).rejects.toMatchObject({
      name: "Error",
      message: "We couldn’t complete that request. Please try again.",
      code: "INVALID_RESPONSE"
    } satisfies Partial<ApiError>);
  });

  it("normalizes a successful non-JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("not-json", { status: 200, headers: { "content-type": "text/plain" } })
        )
    );

    await expect(apiRequest("/api/v1/example")).rejects.toThrow(
      "We couldn’t complete that request. Please try again."
    );
  });

  it("returns a valid API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { id: "incident-1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
    );

    await expect(apiRequest<{ id: string }>("/api/v1/example")).resolves.toEqual({
      data: { id: "incident-1" }
    });
  });
});
