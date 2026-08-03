import { DataTable } from "@relayops/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("DataTable keyboard interaction", () => {
  it("opens an interactive row with Enter", () => {
    const open = vi.fn();
    render(
      <DataTable
        ariaLabel="Incidents"
        columns={[{ title: "Title", dataIndex: "title", key: "title" }]}
        data={[{ id: "incident-1", title: "API latency" }]}
        rowKey="id"
        total={1}
        page={1}
        pageSize={20}
        onPageChange={vi.fn()}
        onRowOpen={open}
      />
    );
    const row = screen.getByText("API latency").closest("tr");
    expect(row).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(row!, { key: "Enter" });
    expect(open).toHaveBeenCalledWith({ id: "incident-1", title: "API latency" });
  });

  it("announces the configured empty state", () => {
    render(
      <DataTable
        ariaLabel="Incidents"
        columns={[{ title: "Title", dataIndex: "title", key: "title" }]}
        data={[]}
        rowKey="id"
        total={0}
        page={1}
        pageSize={20}
        emptyDescription="No matching incidents"
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByText("No matching incidents")).toBeInTheDocument();
  });
});
