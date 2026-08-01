import {
  AlertOutlined,
  BulbOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { AsyncState, RelayLogo } from "@relayops/ui";
import {
  App,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip
} from "antd";
import { useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSession, useLogout } from "../features/auth/auth.api";
import {
  useCreateOrganisation,
  useOrganisations
} from "../features/organisations/organisations.api";
import {
  RealtimeConnectionLabel,
  WorkspaceRealtimeProvider
} from "../features/realtime/realtime-provider";
import { NotificationCenter } from "../features/notifications/notification-center";
import { useUiStore } from "../stores/ui.store";

const { Header, Sider, Content } = Layout;

export function AppShell() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const organisations = useOrganisations();
  const session = useSession();
  const logout = useLogout();
  const createOrganisation = useCreateOrganisation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [newOrganisationName, setNewOrganisationName] = useState("");
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const organisation = organisations.data?.find((item) => item.slug === params.orgSlug);
  const workspace = organisation?.workspaces.find((item) => item.slug === params.workspaceSlug);
  const switchOrganisation = (organisationId: string) => {
    const next = organisations.data?.find((item) => item.id === organisationId);
    const nextWorkspace = next?.workspaces[0];
    if (next && nextWorkspace) void navigate(`/app/${next.slug}/${nextWorkspace.slug}/dashboard`);
  };

  const switchWorkspace = (workspaceId: string) => {
    const next = organisation?.workspaces.find((item) => item.id === workspaceId);
    if (next && organisation) void navigate(`/app/${organisation.slug}/${next.slug}/dashboard`);
  };

  const createTenant = async () => {
    if (newOrganisationName.trim().length < 2) return;
    const result = await createOrganisation.mutateAsync(newOrganisationName);
    const nextWorkspace = result.data.workspaces[0];
    setCreateOpen(false);
    setNewOrganisationName("");
    void message.success("Organisation created");
    if (nextWorkspace) {
      await navigate(`/app/${result.data.slug}/${nextWorkspace.slug}/dashboard`);
    }
  };

  const nav = (
    <div className="app-nav">
      <div className="app-nav__brand">
        <RelayLogo compact={Boolean(collapsed && screens.lg)} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname.split("/").at(-1) ?? "dashboard"]}
        items={[
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
            onClick: () => void navigate(`/app/${organisation?.slug}/${workspace?.slug}/dashboard`)
          },
          {
            key: "incidents",
            icon: <AlertOutlined />,
            label: "Incidents",
            onClick: () => void navigate(`/app/${organisation?.slug}/${workspace?.slug}/incidents`)
          },
          ...(organisation?.permissions.includes("audit:read")
            ? [
                {
                  key: "audit-log",
                  icon: <FileSearchOutlined />,
                  label: "Audit log",
                  onClick: () =>
                    void navigate(`/app/${organisation.slug}/${workspace?.slug}/audit-log`)
                }
              ]
            : []),
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Settings",
            onClick: () => void navigate(`/app/${organisation?.slug}/${workspace?.slug}/settings`)
          }
        ]}
      />
      <div className="app-nav__footer">
        <RealtimeConnectionLabel compact={Boolean(collapsed && screens.lg)} />
      </div>
    </div>
  );

  return (
    <AsyncState
      loading={organisations.isPending}
      error={organisations.error}
      empty={!organisation || !workspace}
      emptyDescription="This workspace is unavailable or you no longer have access."
      onRetry={() => void organisations.refetch()}
    >
      {organisation && workspace ? (
        <WorkspaceRealtimeProvider workspaceId={workspace.id}>
          <Layout className="app-layout">
            <a className="skip-link" href="#main-content">
              Skip to main content
            </a>
            {screens.lg ? (
              <Sider
                width={224}
                collapsedWidth={68}
                collapsed={collapsed}
                className="app-sider"
                trigger={null}
              >
                {nav}
              </Sider>
            ) : (
              <Drawer
                placement="left"
                width={280}
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                styles={{ body: { padding: 0 } }}
              >
                {nav}
              </Drawer>
            )}
            <Layout className="app-main-layout">
              <Header className="app-header">
                <Space size={8} className="app-header__tenant">
                  <Button
                    type="text"
                    icon={
                      screens.lg ? (
                        collapsed ? (
                          <MenuUnfoldOutlined />
                        ) : (
                          <MenuFoldOutlined />
                        )
                      ) : (
                        <MenuOutlined />
                      )
                    }
                    aria-label={screens.lg ? "Toggle sidebar" : "Open navigation"}
                    onClick={screens.lg ? toggleSidebar : () => setMobileOpen(true)}
                  />
                  <Select
                    aria-label="Organisation"
                    value={organisation.id}
                    className="tenant-select tenant-select--organisation"
                    onChange={switchOrganisation}
                    options={
                      organisations.data?.map((item) => ({
                        value: item.id,
                        label: item.name
                      })) ?? []
                    }
                  />
                  <span className="tenant-divider">/</span>
                  <Select
                    aria-label="Workspace"
                    value={workspace.id}
                    className="tenant-select"
                    onChange={switchWorkspace}
                    options={organisation.workspaces.map((item) => ({
                      value: item.id,
                      label: item.name
                    }))}
                  />
                  <Tooltip title="Create organisation">
                    <Button
                      className="create-organisation-button"
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateOpen(true)}
                    />
                  </Tooltip>
                </Space>
                <Space className="app-header__actions">
                  <NotificationCenter />
                  <Tag className="role-tag">{organisation.role}</Tag>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "theme",
                          icon: <BulbOutlined />,
                          label: `Theme: ${theme}`,
                          onClick: () =>
                            setTheme(
                              theme === "system" ? "light" : theme === "light" ? "dark" : "system"
                            )
                        },
                        { type: "divider" },
                        {
                          key: "logout",
                          icon: <LogoutOutlined />,
                          label: "Sign out",
                          danger: true,
                          onClick: () => setSignOutOpen(true)
                        }
                      ]
                    }}
                  >
                    <Button type="text" className="profile-button">
                      <Avatar size={30}>{session.data?.user.name.slice(0, 1).toUpperCase()}</Avatar>
                      {screens.sm ? <span>{session.data?.user.name}</span> : null}
                    </Button>
                  </Dropdown>
                </Space>
              </Header>
              <Content id="main-content" className="app-content">
                <Outlet context={{ organisation, workspace }} />
              </Content>
            </Layout>
            <Modal
              title="Create an organisation"
              open={createOpen}
              okText="Create organisation"
              confirmLoading={createOrganisation.isPending}
              okButtonProps={{ disabled: newOrganisationName.trim().length < 2 }}
              onOk={() => void createTenant()}
              onCancel={() => setCreateOpen(false)}
            >
              <label className="modal-field">
                <span>Organisation name</span>
                <input
                  autoFocus
                  value={newOrganisationName}
                  onChange={(event) => setNewOrganisationName(event.target.value)}
                  placeholder="e.g. Northstar Product"
                />
              </label>
            </Modal>
            <Modal
              title="Sign out of RelayOps?"
              open={signOutOpen}
              okText="Sign out"
              okButtonProps={{ danger: true }}
              confirmLoading={logout.isPending}
              onOk={async () => {
                await logout.mutateAsync();
                setSignOutOpen(false);
                await navigate("/login");
              }}
              onCancel={() => setSignOutOpen(false)}
            >
              <p>You will need to sign in again to access your organisations and workspaces.</p>
            </Modal>
          </Layout>
        </WorkspaceRealtimeProvider>
      ) : null}
    </AsyncState>
  );
}
