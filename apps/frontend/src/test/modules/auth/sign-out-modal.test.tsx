import { App } from "antd";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutModal } from "@/modules/auth/components/sign-out-modal";

const logout = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("@/modules/auth/operations/auth.queries", () => ({
  useLogout: () => ({ isPending: false, mutateAsync: logout.mutateAsync })
}));

describe("SignOutModal", () => {
  beforeEach(() => logout.mutateAsync.mockReset());

  it("keeps the session UI open and hides operational failure details", async () => {
    const signedOut = vi.fn();
    logout.mutateAsync.mockRejectedValueOnce(
      new Error("MongoDB connection failed for internal-host.example")
    );

    render(
      <App>
        <SignOutModal open onCancel={vi.fn()} onSignedOut={signedOut} />
      </App>
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("We couldn’t sign you out. Please try again.")).toBeVisible();
    expect(screen.queryByText(/internal-host/i)).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(signedOut).not.toHaveBeenCalled();
  });

  it("allows a failed sign-out to be retried", async () => {
    const signedOut = vi.fn();
    logout.mutateAsync.mockRejectedValueOnce(new Error("Unavailable")).mockResolvedValueOnce({});

    render(
      <App>
        <SignOutModal open onCancel={vi.fn()} onSignedOut={signedOut} />
      </App>
    );
    const button = screen.getByRole("button", { name: "Sign out" });
    fireEvent.click(button);
    await screen.findByText("We couldn’t sign you out. Please try again.");
    fireEvent.click(button);

    await waitFor(() => expect(signedOut).toHaveBeenCalledOnce());
  });
});
