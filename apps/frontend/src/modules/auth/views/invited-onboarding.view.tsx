import type { AccountPreferences } from "@relayops/types";
import { Alert, Button, Card, Input, Steps, Tag } from "antd";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUiStore } from "@/stores/ui.store";
import { OnboardingPreferences } from "../components/onboarding-preferences";
import { WelcomeIllustration } from "../components/welcome-illustration";
import { useCompleteInvitedOnboarding, useSession } from "../operations/auth.queries";
import { defaultPreferences } from "../operations/onboarding.defaults";

export function Component() {
  const session = useSession();
  const navigate = useNavigate();
  const setTheme = useUiStore((state) => state.setTheme);
  const state = session.data?.onboarding;
  const membershipId = state?.required && state.kind === "invited" ? state.membershipId : "";
  const complete = useCompleteInvitedOnboarding(membershipId);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(session.data?.user.name ?? "");
  const [preferences, setPreferences] = useState<AccountPreferences>(
    session.data?.user.preferences ?? defaultPreferences
  );
  if (!session.isPending && (!state?.required || state.kind !== "invited"))
    return <Navigate to="/app" replace />;
  const finish = async () => {
    const result = await complete.mutateAsync({ name, preferences });
    setTheme(preferences.theme);
    await navigate(result.data.destinationPath, { replace: true });
  };
  const capabilities: Record<string, string> = {
    administrator: "Manage workspaces, SLAs and incident operations.",
    responder: "Claim and coordinate incidents assigned to you.",
    viewer: "Follow incidents, analytics and saved views without editing."
  };
  return (
    <main className="onboarding-page">
      <Card className="onboarding-card">
        <WelcomeIllustration />
        <Steps
          current={step}
          size="small"
          items={[
            { title: "Welcome" },
            { title: "Profile" },
            { title: "Preferences" },
            { title: "Your role" }
          ]}
        />
        {complete.error ? <Alert type="error" showIcon message={complete.error.message} /> : null}
        {state?.required && state.kind === "invited" && step === 0 ? (
          <section>
            <span className="eyebrow">Invitation accepted</span>
            <h1>Welcome to {state.organisationName}</h1>
            <p>
              You’re joining as <Tag>{state.role}</Tag> across {state.workspaceNames.join(", ")}.
            </p>
          </section>
        ) : null}
        {step === 1 ? (
          <section>
            <span className="eyebrow">Your identity</span>
            <h1>How teammates will see you</h1>
            <label>
              <span>Display name</span>
              <Input size="large" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
          </section>
        ) : null}
        {step === 2 ? (
          <section>
            <span className="eyebrow">Make it yours</span>
            <h1>Choose your preferences</h1>
            <OnboardingPreferences value={preferences} onChange={setPreferences} />
          </section>
        ) : null}
        {state?.required && state.kind === "invited" && step === 3 ? (
          <section>
            <span className="eyebrow">Your {state.role} role</span>
            <h1>Know where you can act</h1>
            <p>
              {capabilities[state.role] ??
                "Your organisation owner controls your workspace access."}
            </p>
            <Alert
              type="info"
              showIcon
              message="The API enforces these permissions independently of the interface."
            />
          </section>
        ) : null}
        <div className="onboarding-actions">
          {step > 0 ? <Button onClick={() => setStep(step - 1)}>Back</Button> : <span />}
          <Button
            type="primary"
            disabled={step === 1 && name.trim().length < 2}
            loading={complete.isPending}
            onClick={() => (step === 3 ? void finish() : setStep(step + 1))}
          >
            {step === 3 ? "Open my dashboard" : "Continue"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
