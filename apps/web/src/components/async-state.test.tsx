import { AsyncState } from "@relayops/ui";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("AsyncState", () => {
  it("renders content only after loading succeeds", () => {
    const { rerender } = render(
      <AsyncState loading>
        <p>Workspace content</p>
      </AsyncState>
    );
    expect(screen.getByLabelText("Loading content")).toBeInTheDocument();

    rerender(
      <AsyncState loading={false}>
        <p>Workspace content</p>
      </AsyncState>
    );
    expect(screen.getByText("Workspace content")).toBeInTheDocument();
  });

  it("provides a meaningful empty state", () => {
    render(
      <AsyncState loading={false} empty emptyDescription="No accessible workspaces">
        <span />
      </AsyncState>
    );
    expect(screen.getByText("No accessible workspaces")).toBeInTheDocument();
  });
});
