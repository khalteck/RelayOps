import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { OnboardingPreferences } from "@/modules/auth/components/onboarding-preferences";
import { WelcomeIllustration } from "@/modules/auth/components/welcome-illustration";
import { defaultPreferences } from "@/modules/auth/operations/onboarding.defaults";

function PreferencesHarness() {
  const [value, setValue] = useState(defaultPreferences);
  return <OnboardingPreferences value={value} onChange={setValue} />;
}

describe("onboarding components", () => {
  it("gives the welcome illustration an accessible name", () => {
    render(<WelcomeIllustration />);
    expect(screen.getByRole("img", { name: /connected responders/i })).toBeInTheDocument();
  });

  it("exposes account preferences with mandatory-email guidance", () => {
    render(<PreferencesHarness />);
    expect(screen.getByText(/security and membership lifecycle emails/i)).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /incident assignments/i })).toBeChecked();
  });
});
