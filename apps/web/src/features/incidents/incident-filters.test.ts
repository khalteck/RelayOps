import { describe, expect, it } from "vitest";
import {
  normalizeIncidentFilters,
  readIncidentFilters,
  writeIncidentFilters
} from "./incident-filters";

describe("incident URL filters", () => {
  it("normalizes lists and rejects unsupported URL values", () => {
    const filters = readIncidentFilters(
      new URLSearchParams(
        "statuses=resolved,reported,invalid&priorities=P2,P1&sortBy=nope&page=-2&pageSize=999"
      )
    );
    expect(normalizeIncidentFilters(filters)).toMatchObject({
      statuses: ["reported", "resolved"],
      priorities: ["P1", "P2"],
      sortBy: "createdAt",
      page: 1,
      pageSize: 20
    });
  });

  it("preserves the open drawer and column state during filter changes", () => {
    const current = new URLSearchParams("incident=incident-1&columns=title,status");
    const filters = readIncidentFilters(new URLSearchParams("statuses=reported"));
    const result = writeIncidentFilters(current, filters);
    expect(result.get("incident")).toBe("incident-1");
    expect(result.get("columns")).toBe("title,status");
  });
});
