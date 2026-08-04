import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useUiStore } from "@/stores/ui.store";
import { Component as LandingPage } from "@/modules/landing/views/landing.view";

const session = vi.hoisted(() => ({ data: undefined as unknown }));

vi.mock("@/modules/auth", () => ({
  useSession: () => session
}));

describe("public landing page", () => {
  beforeEach(() => {
    session.data = undefined;
    useUiStore.setState({ theme: "system", sidebarCollapsed: false });
  });

  it("offers anonymous visitors clear product access", () => {
    render(<LandingPage />, { wrapper: MemoryRouter });

    expect(
      screen.getByRole("heading", { name: "Keep every response moving in the same direction." })
    ).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Create workspace/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Khalid Oyeneye" })).toHaveAttribute(
      "href",
      "https://khalidoyeneye.dev"
    );
  });

  it("adapts the primary action for an authenticated visitor", () => {
    session.data = { user: { id: "user-1", name: "Olivia Owner" } };
    render(<LandingPage />, { wrapper: MemoryRouter });

    const dashboardLinks = screen.getAllByRole("link", { name: /Open dashboard/ });
    expect(dashboardLinks.length).toBeGreaterThan(0);
    dashboardLinks.forEach((link) => expect(link).toHaveAttribute("href", "/app"));
  });

  it("supports responsive navigation and theme controls", async () => {
    const user = userEvent.setup();
    const { container } = render(<LandingPage />, { wrapper: MemoryRouter });

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector("#landing-mobile-navigation")).toHaveAttribute(
      "aria-hidden",
      "false"
    );

    await user.click(screen.getByRole("button", { name: /Theme: system/ }));
    expect(useUiStore.getState().theme).toBe("light");
  });

  it("has no automated accessibility violations", async () => {
    const { container } = render(<LandingPage />, { wrapper: MemoryRouter });
    expect(await axe(container)).toHaveNoViolations();
  });
});
