import type { AccountPreferences } from "@relayops/types";
import { Checkbox, Segmented, Space } from "antd";

export function OnboardingPreferences({
  value,
  onChange
}: {
  value: AccountPreferences;
  onChange: (value: AccountPreferences) => void;
}) {
  const toggle = (key: keyof AccountPreferences["inApp"], checked: boolean) =>
    onChange({ ...value, inApp: { ...value.inApp, [key]: checked } });
  return (
    <div className="onboarding-preferences">
      <label>
        <span>Interface theme</span>
        <Segmented
          block
          value={value.theme}
          options={[
            { label: "System", value: "system" },
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" }
          ]}
          onChange={(theme) => onChange({ ...value, theme: theme as AccountPreferences["theme"] })}
        />
      </label>
      <fieldset>
        <legend>In-app notifications</legend>
        <Space direction="vertical">
          <Checkbox
            checked={value.inApp.incidentAssigned}
            onChange={(event) => toggle("incidentAssigned", event.target.checked)}
          >
            Incident assignments
          </Checkbox>
          <Checkbox
            checked={value.inApp.incidentUpdated}
            onChange={(event) => toggle("incidentUpdated", event.target.checked)}
          >
            Incident updates
          </Checkbox>
          <Checkbox
            checked={value.inApp.incidentCommented}
            onChange={(event) => toggle("incidentCommented", event.target.checked)}
          >
            New comments
          </Checkbox>
        </Space>
      </fieldset>
      <small>Security and membership lifecycle emails are always delivered.</small>
    </div>
  );
}
