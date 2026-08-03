import { describe, expect, it } from "vitest";
import { createCsv } from "@/helpers/csv";

describe("CSV serialization", () => {
  it("escapes quotes and protects spreadsheet formula cells", () => {
    const result = createCsv(
      [{ name: 'A "quoted" incident', value: "=IMPORTXML('unsafe')" }],
      [
        { header: "Name", value: (row) => row.name },
        { header: "Value", value: (row) => row.value }
      ]
    );

    expect(result).toContain('"A ""quoted"" incident"');
    expect(result).toContain("\"'=IMPORTXML('unsafe')\"");
  });

  it("serializes nullish values as empty cells", () => {
    expect(createCsv([{ value: null }], [{ header: "Value", value: (row) => row.value }])).toBe(
      '"Value"\r\n""'
    );
  });
});
