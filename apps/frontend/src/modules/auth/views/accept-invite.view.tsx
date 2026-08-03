import { AsyncState } from "@relayops/ui";
import { Alert, Button, Input, Tag } from "antd";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "../components/auth-layout";
import { useAcceptInvitation, useInvitationPreview } from "../operations/invitation.queries";

export function Component() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation(token);

  const acceptInvitation = () => {
    accept.mutate(
      { accountExists: Boolean(preview.data?.accountExists), name, password },
      {
        onSuccess: ({ data }) => {
          void navigate(`/login?email=${encodeURIComponent(data.email)}&invited=1`);
        }
      }
    );
  };

  return (
    <AuthLayout>
      <AsyncState
        loading={preview.isPending}
        error={preview.error}
        onRetry={() => void preview.refetch()}
      >
        {preview.data ? (
          <>
            <div className="auth-card__heading">
              <span>Workspace invitation</span>
              <h2>Join {preview.data.organisationName}</h2>
              <p>
                {preview.data.invitedByName} invited {preview.data.email} as a {preview.data.role}.
              </p>
            </div>
            <div className="invite-workspaces">
              {preview.data.workspaces.map((workspace) => (
                <Tag key={workspace.id}>{workspace.name}</Tag>
              ))}
            </div>
            {accept.error ? <Alert type="error" showIcon message={accept.error.message} /> : null}
            {preview.data.accountExists ? (
              <div className="form-stack">
                <Alert
                  type="info"
                  showIcon
                  message="Existing RelayOps account found"
                  description="Accept the workspace access, then sign in with your existing password."
                />
                <Button
                  type="primary"
                  size="large"
                  loading={accept.isPending}
                  onClick={acceptInvitation}
                >
                  Accept invitation
                </Button>
              </div>
            ) : (
              <div className="form-stack">
                <label>
                  <span>Your name</span>
                  <Input
                    size="large"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label>
                  <span>Create password</span>
                  <Input.Password
                    size="large"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <Button
                  type="primary"
                  size="large"
                  loading={accept.isPending}
                  disabled={name.trim().length < 2 || password.length < 12}
                  onClick={acceptInvitation}
                >
                  Create account and join
                </Button>
              </div>
            )}
            <p className="auth-card__footer">
              <Link to="/login">Return to sign in</Link>
            </p>
          </>
        ) : null}
      </AsyncState>
    </AuthLayout>
  );
}
