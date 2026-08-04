import type { AccountPreferences } from "@relayops/types";
import { Alert, Button, Card, Input, Steps } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "@/stores/ui.store";
import { OnboardingPreferences } from "../components/onboarding-preferences";
import { WelcomeIllustration } from "../components/welcome-illustration";
import { useCompleteOwnerOnboarding } from "../operations/auth.queries";
import { defaultPreferences } from "../operations/onboarding.defaults";

export function Component() {
  const navigate = useNavigate();
  const complete = useCompleteOwnerOnboarding();
  const setTheme = useUiStore((state) => state.setTheme);
  const [step, setStep] = useState(0);
  const [organisationName, setOrganisationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [preferences, setPreferences] = useState<AccountPreferences>(defaultPreferences);
  const finish = async () => {
    const result = await complete.mutateAsync({ organisationName, workspaceName, preferences });
    setTheme(preferences.theme);
    await navigate(result.data.destinationPath, { replace: true });
  };
  return (
    <main className="onboarding-page">
      <Card className="onboarding-card">
        <WelcomeIllustration />
        <Steps
          current={step}
          size="small"
          items={[{ title: "Workspace" }, { title: "Preferences" }, { title: "Ready" }]}
        />
        {complete.error ? <Alert type="error" showIcon message={complete.error.message} /> : null}
        {step === 0 ? (
          <section>
            <span className="eyebrow">Build your operations hub</span>
            <h1>Name the places your team will work</h1>
            <div className="form-stack">
              <label>
                <span>Organisation</span>
                <Input
                  size="large"
                  value={organisationName}
                  onChange={(event) => setOrganisationName(event.target.value)}
                />
              </label>
              <label>
                <span>First workspace</span>
                <Input
                  size="large"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
              </label>
            </div>
          </section>
        ) : null}
        {step === 1 ? (
          <section>
            <span className="eyebrow">Make it yours</span>
            <h1>Choose your working preferences</h1>
            <OnboardingPreferences value={preferences} onChange={setPreferences} />
          </section>
        ) : null}
        {step === 2 ? (
          <section>
            <span className="eyebrow">Ready to relay</span>
            <h1>Your operational home is ready</h1>
            <p>
              {organisationName} will start with the {workspaceName} workspace and RelayOps’ default
              SLA policy.
            </p>
          </section>
        ) : null}
        <div className="onboarding-actions">
          {step > 0 ? <Button onClick={() => setStep(step - 1)}>Back</Button> : <span />}
          <Button
            type="primary"
            loading={complete.isPending}
            disabled={
              step === 0 && (organisationName.trim().length < 2 || workspaceName.trim().length < 2)
            }
            onClick={() => (step === 2 ? void finish() : setStep(step + 1))}
          >
            {step === 2 ? "Open dashboard" : "Continue"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
