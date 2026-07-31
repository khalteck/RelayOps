import { describe, expect, it } from "vitest";
import { createSlug } from "./slug.js";

describe("createSlug", () => {
  it("produces stable URL-safe identifiers", () => {
    expect(createSlug("  Platform & Reliability  ")).toBe("platform-reliability");
  });
});
