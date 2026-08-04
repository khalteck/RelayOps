import type { ThemePreference } from "@/stores/ui.store";
import { Card, Segmented } from "antd";
import { useUiStore } from "@/stores/ui.store";
import { useSession, useUpdatePreferences } from "@/modules/auth";

export function AppearanceSettings() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const session = useSession();
  const updatePreferences = useUpdatePreferences();
  const changeTheme = (value: ThemePreference) => {
    setTheme(value);
    const preferences = session.data?.user.preferences;
    if (preferences) updatePreferences.mutate({ ...preferences, theme: value });
  };
  return (
    <Card title="Appearance" className="settings-card">
      <p className="settings-card__description">
        Choose how RelayOps appears on this device. System follows your operating-system setting.
      </p>
      <Segmented
        aria-label="Colour theme"
        value={theme}
        options={[
          { label: "System", value: "system" },
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" }
        ]}
        onChange={(value) => changeTheme(value as ThemePreference)}
      />
    </Card>
  );
}
