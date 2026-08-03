import { App } from "antd";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { SignOutModal } from "@/modules/auth/components/sign-out-modal";

vi.mock("@/modules/auth/operations/auth.queries", () => ({
  useLogout: () => ({ isPending: false, mutateAsync: vi.fn() })
}));

describe("authentication accessibility", () => {
  it("gives the sign-out confirmation an accessible dialog contract", async () => {
    const { container } = render(
      <App>
        <SignOutModal open onCancel={vi.fn()} onSignedOut={vi.fn()} />
      </App>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
