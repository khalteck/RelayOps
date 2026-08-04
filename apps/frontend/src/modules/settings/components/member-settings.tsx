import { MoreOutlined, UserAddOutlined } from "@ant-design/icons";
import type { OrganisationSummary, Role } from "@relayops/types";
import { AsyncState } from "@relayops/ui";
import { App, Button, Card, Dropdown, Input, Modal, Select, Table, Tag } from "antd";
import { useMemo, useState } from "react";
import {
  useInvitations,
  useInviteMember,
  useOrganisationMembers,
  useResendInvitation,
  useChangeMemberStatus,
  useRemoveMember
} from "../operations/member-management.queries";

const invitationalRoles: Array<{ label: string; value: Exclude<Role, "owner"> }> = [
  { label: "Administrator", value: "administrator" },
  { label: "Responder", value: "responder" },
  { label: "Viewer", value: "viewer" }
];

export function MemberSettings({ organisation }: { organisation: OrganisationSummary }) {
  const { message, modal } = App.useApp();
  const members = useOrganisationMembers(organisation.id, true);
  const invitations = useInvitations(organisation.id, true);
  const invite = useInviteMember(organisation.id);
  const resend = useResendInvitation(organisation.id);
  const changeStatus = useChangeMemberStatus(organisation.id);
  const remove = useRemoveMember(organisation.id);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "owner">>("responder");
  const [workspaceIds, setWorkspaceIds] = useState<string[]>([]);
  const workspaceNames = useMemo(
    () => new Map(organisation.workspaces.map((workspace) => [workspace.id, workspace.name])),
    [organisation.workspaces]
  );

  const close = () => {
    setOpen(false);
    setEmail("");
    setRole("responder");
    setWorkspaceIds([]);
  };
  const submit = async () => {
    await invite.mutateAsync({ email, role, workspaceIds });
    void message.success("Invitation email queued");
    close();
  };

  const confirmLifecycle = (
    member: NonNullable<typeof members.data>[number],
    action: "suspend" | "restore" | "remove"
  ) => {
    modal.confirm({
      title: `${action[0]?.toUpperCase()}${action.slice(1)} ${member.user.name}?`,
      content:
        action === "remove"
          ? "Their organisation access will be removed, while audit and incident history remain."
          : `Their access will be ${action === "suspend" ? "blocked immediately" : "restored"}.`,
      okText: action,
      okButtonProps: { danger: action !== "restore" },
      async onOk() {
        if (action === "remove") await remove.mutateAsync(member.membershipId);
        else
          await changeStatus.mutateAsync({
            membershipId: member.membershipId,
            status: action === "suspend" ? "suspended" : "active"
          });
        void message.success(
          `Member ${action === "remove" ? "removed" : action === "suspend" ? "suspended" : "restored"}`
        );
      }
    });
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
          Invite administrators, responders, or viewers by email and manage their organisation
          access.
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
                title: "Status",
                dataIndex: "status",
                width: 130,
                render: (value: string) => (
                  <Tag
                    color={value === "active" ? "green" : value === "suspended" ? "red" : "gold"}
                  >
                    {value.replace("_", " ")}
                  </Tag>
                )
              },
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
              },
              {
                title: "",
                key: "actions",
                width: 54,
                render: (_value, member) =>
                  member.role === "owner" ? null : (
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          member.status === "suspended"
                            ? { key: "restore", label: "Restore access" }
                            : { key: "suspend", label: "Suspend access" },
                          { type: "divider" },
                          { key: "remove", label: "Remove user", danger: true }
                        ],
                        onClick: ({ key }) =>
                          confirmLifecycle(member, key as "suspend" | "restore" | "remove")
                      }}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        aria-label={`Actions for ${member.user.name}`}
                      />
                    </Dropdown>
                  )
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
              },
              {
                title: "",
                key: "actions",
                width: 90,
                render: (_value, invitation) =>
                  invitation.status === "pending" ? (
                    <Button
                      type="link"
                      loading={resend.isPending}
                      onClick={async () => {
                        await resend.mutateAsync(invitation.id);
                        void message.success("Invitation resent");
                      }}
                    >
                      Resend
                    </Button>
                  ) : null
              }
            ]}
          />
        </AsyncState>
      </Card>
      <Modal
        title="Invite a user"
        open={open}
        okText="Send invitation"
        confirmLoading={invite.isPending}
        okButtonProps={{
          disabled: !email.includes("@") || workspaceIds.length === 0
        }}
        onOk={() => void submit()}
        onCancel={close}
      >
        {
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
        }
      </Modal>
    </>
  );
}
