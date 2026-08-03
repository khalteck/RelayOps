import { CopyOutlined, UserAddOutlined } from "@ant-design/icons";
import type { OrganisationSummary, Role } from "@relayops/types";
import { AsyncState } from "@relayops/ui";
import { App, Button, Card, Input, Modal, Select, Space, Table, Tag } from "antd";
import { useMemo, useState } from "react";
import {
  useInvitations,
  useInviteMember,
  useOrganisationMembers
} from "../operations/member-management.queries";

const invitationalRoles: Array<{ label: string; value: Exclude<Role, "owner"> }> = [
  { label: "Administrator", value: "administrator" },
  { label: "Responder", value: "responder" },
  { label: "Viewer", value: "viewer" }
];

export function MemberSettings({ organisation }: { organisation: OrganisationSummary }) {
  const { message } = App.useApp();
  const members = useOrganisationMembers(organisation.id, true);
  const invitations = useInvitations(organisation.id, true);
  const invite = useInviteMember(organisation.id);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "owner">>("responder");
  const [workspaceIds, setWorkspaceIds] = useState<string[]>([]);
  const [acceptUrl, setAcceptUrl] = useState("");
  const workspaceNames = useMemo(
    () => new Map(organisation.workspaces.map((workspace) => [workspace.id, workspace.name])),
    [organisation.workspaces]
  );

  const close = () => {
    setOpen(false);
    setEmail("");
    setRole("responder");
    setWorkspaceIds([]);
    setAcceptUrl("");
  };
  const submit = async () => {
    const result = await invite.mutateAsync({ email, role, workspaceIds });
    setAcceptUrl(result.data.acceptUrl ?? "");
    void message.success("Invitation created");
  };

  return (
    <>
      <Card
        title="User management"
        className="settings-card"
        extra={
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setOpen(true)}>
            Invite user
          </Button>
        }
      >
        <p className="settings-card__description">
          Invite administrators, responders, or viewers and limit operational roles to selected
          workspaces. Email delivery is deferred, so copy the secure invitation link after creating
          it.
        </p>
        <AsyncState
          loading={members.isPending}
          error={members.error}
          onRetry={() => void members.refetch()}
        >
          <Table
            size="small"
            rowKey="membershipId"
            dataSource={members.data ?? []}
            pagination={false}
            scroll={{ x: 620 }}
            columns={[
              {
                title: "User",
                key: "user",
                render: (_value, member) => (
                  <div className="member-identity">
                    <strong>{member.user.name}</strong>
                    <span>{member.user.email}</span>
                  </div>
                )
              },
              {
                title: "Role",
                dataIndex: "role",
                width: 150,
                render: (value: Role) => <Tag>{value}</Tag>
              },
              {
                title: "Workspace access",
                key: "workspaces",
                render: (_value, member) =>
                  member.role === "owner" || member.role === "administrator"
                    ? "All workspaces"
                    : member.workspaceIds
                        .map((id) => workspaceNames.get(id))
                        .filter(Boolean)
                        .join(", ") || "None"
              },
              {
                title: "Joined",
                dataIndex: "joinedAt",
                width: 130,
                render: (value: string) => new Date(value).toLocaleDateString()
              }
            ]}
          />
        </AsyncState>
      </Card>
      <Card title="Invitations" className="settings-card">
        <AsyncState
          loading={invitations.isPending}
          error={invitations.error}
          onRetry={() => void invitations.refetch()}
          empty={invitations.data?.length === 0}
          emptyDescription="No invitations have been created yet."
        >
          <Table
            size="small"
            rowKey="id"
            dataSource={invitations.data ?? []}
            pagination={false}
            scroll={{ x: 600 }}
            columns={[
              { title: "Email", dataIndex: "email" },
              {
                title: "Role",
                dataIndex: "role",
                width: 140,
                render: (value: Role) => <Tag>{value}</Tag>
              },
              {
                title: "Status",
                dataIndex: "status",
                width: 110,
                render: (value: string) => (
                  <Tag
                    color={
                      value === "pending" ? "gold" : value === "accepted" ? "green" : "default"
                    }
                  >
                    {value}
                  </Tag>
                )
              },
              {
                title: "Expires",
                dataIndex: "expiresAt",
                width: 130,
                render: (value: string) => new Date(value).toLocaleDateString()
              }
            ]}
          />
        </AsyncState>
      </Card>
      <Modal
        title={acceptUrl ? "Invitation ready" : "Invite a user"}
        open={open}
        okText={acceptUrl ? "Done" : "Create invitation"}
        confirmLoading={invite.isPending}
        okButtonProps={{
          disabled: !acceptUrl && (!email.includes("@") || workspaceIds.length === 0)
        }}
        onOk={() => (acceptUrl ? close() : void submit())}
        onCancel={close}
      >
        {acceptUrl ? (
          <div className="invite-result">
            <p>Share this one-time link with {email}. It expires in seven days.</p>
            <Space.Compact block>
              <Input readOnly value={acceptUrl} aria-label="Invitation link" />
              <Button
                icon={<CopyOutlined />}
                onClick={async () => {
                  await navigator.clipboard.writeText(acceptUrl);
                  void message.success("Invitation link copied");
                }}
              >
                Copy
              </Button>
            </Space.Compact>
          </div>
        ) : (
          <div className="form-stack form-stack--compact">
            <label>
              <span>Email address</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Role</span>
              <Select value={role} options={invitationalRoles} onChange={setRole} />
            </label>
            <label>
              <span>Workspace access</span>
              <Select
                mode="multiple"
                value={workspaceIds}
                options={organisation.workspaces.map((workspace) => ({
                  value: workspace.id,
                  label: workspace.name
                }))}
                onChange={setWorkspaceIds}
              />
            </label>
          </div>
        )}
      </Modal>
    </>
  );
}
