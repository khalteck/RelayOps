import { BgColorsOutlined, TeamOutlined, UserOutlined, ApartmentOutlined } from "@ant-design/icons";
import { PageHeader } from "@relayops/ui";
import { Menu } from "antd";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useSession } from "../auth/auth.api";
import { AppearanceSettings } from "./appearance-settings";
import { MemberSettings } from "./member-settings";
import { ProfileSettings } from "./profile-settings";
import type { TenantRouteContext } from "./tenant-context";
import { WorkspaceSettings } from "./workspace-settings";

type SettingsSection = "profile" | "workspace" | "members" | "appearance";

export function Component() {
  const { organisation, workspace } = useOutletContext<TenantRouteContext>();
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const canManageMembers = organisation.permissions.includes("members:manage");
  const available: SettingsSection[] = [
    "profile",
    "workspace",
    ...(canManageMembers ? (["members"] as const) : []),
    "appearance"
  ];
  const requested = params.get("section") as SettingsSection | null;
  const section = requested && available.includes(requested) ? requested : "profile";
  const selectSection = (next: SettingsSection) => {
    const nextParams = new URLSearchParams(params);
    if (next === "profile") nextParams.delete("section");
    else nextParams.set("section", next);
    setParams(nextParams, { replace: true });
  };

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow={`${organisation.name} / ${workspace.name}`}
        title="Settings"
        description="Manage your account preferences and the active operating workspace."
      />
      <div className="settings-layout">
        <aside className="settings-nav" aria-label="Settings sections">
          <Menu
            mode="inline"
            selectedKeys={[section]}
            onClick={({ key }) => selectSection(key as SettingsSection)}
            items={[
              { key: "profile", icon: <UserOutlined />, label: "Profile" },
              { key: "workspace", icon: <ApartmentOutlined />, label: "Workspace" },
              ...(canManageMembers
                ? [{ key: "members", icon: <TeamOutlined />, label: "User management" }]
                : []),
              { key: "appearance", icon: <BgColorsOutlined />, label: "Appearance" }
            ]}
          />
        </aside>
        <div className="settings-content">
          {section === "profile" && session.data ? (
            <ProfileSettings user={session.data.user} />
          ) : null}
          {section === "workspace" ? (
            <WorkspaceSettings organisation={organisation} workspace={workspace} />
          ) : null}
          {section === "members" && canManageMembers ? (
            <MemberSettings organisation={organisation} />
          ) : null}
          {section === "appearance" ? <AppearanceSettings /> : null}
        </div>
      </div>
    </div>
  );
}
