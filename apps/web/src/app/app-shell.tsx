import {
  BulbOutlined,
  DashboardOutlined,
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
  const [newOrganisationName, setNewOrganisationName] = useState("");
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const organisation = organisations.data?.find((item) => item.slug === params.orgSlug);
  const workspace = organisation?.workspaces.find((item) => item.slug === params.workspaceSlug);
  const canManageWorkspace = organisation?.permissions.includes("workspace:update") ?? false;

  const switchOrganisation = (organisationId: string) => {
    const next = organisations.data?.find((item) => item.id === organisationId);
    const nextWorkspace = next?.workspaces[0];
    if (next && nextWorkspace) void navigate(`/app/${next.slug}/${nextWorkspace.slug}/overview`);
  };

  const switchWorkspace = (workspaceId: string) => {
    const next = organisation?.workspaces.find((item) => item.id === workspaceId);
    if (next && organisation) void navigate(`/app/${organisation.slug}/${next.slug}/overview`);
  };

  const createTenant = async () => {
    if (newOrganisationName.trim().length < 2) return;
    const result = await createOrganisation.mutateAsync(newOrganisationName);
    const nextWorkspace = result.data.workspaces[0];
    setCreateOpen(false);
    setNewOrganisationName("");
    void message.success("Organisation created");
    if (nextWorkspace) {
      await navigate(`/app/${result.data.slug}/${nextWorkspace.slug}/overview`);
    }
  };

  const nav = (
    <div className="app-nav">
      <div className="app-nav__brand">
        <RelayLogo compact={Boolean(collapsed && screens.md)} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname.endsWith("/settings") ? "settings" : "overview"]}
        items={[
          {
            key: "overview",
            icon: <DashboardOutlined />,
            label: "Overview",
            onClick: () => void navigate(`/app/${organisation?.slug}/${workspace?.slug}/overview`)
          },
          ...(canManageWorkspace
            ? [
                {
                  key: "settings",
                  icon: <SettingOutlined />,
                  label: "Workspace settings",
                  onClick: () =>
                    void navigate(`/app/${organisation?.slug}/${workspace?.slug}/settings`)
                }
              ]
            : [])
        ]}
      />
      <div className="app-nav__footer">
        <span className="app-nav__signal" />
        {!collapsed || !screens.md ? (
          <div>
            <strong>All systems connected</strong>
            <small>Foundation environment</small>
          </div>
        ) : null}
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
        <Layout className="app-layout">
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          {screens.md ? (
            <Sider
              width={248}
              collapsedWidth={76}
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
          <Layout>
            <Header className="app-header">
              <Space size={8}>
                <Button
                  type="text"
                  icon={
                    screens.md ? (
                      collapsed ? (
                        <MenuUnfoldOutlined />
                      ) : (
                        <MenuFoldOutlined />
                      )
                    ) : (
                      <MenuOutlined />
                    )
                  }
                  aria-label={screens.md ? "Toggle sidebar" : "Open navigation"}
                  onClick={screens.md ? toggleSidebar : () => setMobileOpen(true)}
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
                  <Button type="text" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} />
                </Tooltip>
              </Space>
              <Space>
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
                        onClick: async () => {
                          await logout.mutateAsync();
                          await navigate("/login");
                        }
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
        </Layout>
      ) : null}
    </AsyncState>
  );
}
