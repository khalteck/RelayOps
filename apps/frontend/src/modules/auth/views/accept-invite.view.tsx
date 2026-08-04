import { AsyncState } from "@relayops/ui";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENT } from "@relayops/types";
import { Alert, Button, Input, Tag } from "antd";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "../components/auth-layout";
import { WelcomeIllustration } from "../components/welcome-illustration";
import { useAcceptInvitation, useInvitationPreview } from "../operations/invitation.queries";
import { useLogin } from "../operations/auth.queries";

export function Component() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation(token);
  const login = useLogin();

  const acceptInvitation = () => {
    accept.mutate(
      { accountExists: Boolean(preview.data?.accountExists), name, password },
      {
        onSuccess: async ({ data }) => {
          await login.mutateAsync({ email: data.email, password });
          void navigate("/onboarding/member", { replace: true });
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
            <WelcomeIllustration />
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
                  description="Confirm your password to securely accept this invitation."
                />
                <label>
                  <span>Password</span>
                  <Input.Password
                    size="large"
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    aria-describedby="invitation-password-guidance"
                  />
                  <small id="invitation-password-guidance" className="field-hint">
                    Enter the password for your existing RelayOps account.
                  </small>
                </label>
                <Button
                  type="primary"
                  size="large"
                  loading={accept.isPending || login.isPending}
                  disabled={password.length < PASSWORD_MIN_LENGTH}
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
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    aria-describedby="invitation-new-password-guidance"
                  />
                  <small id="invitation-new-password-guidance" className="field-hint">
                    {PASSWORD_REQUIREMENT}
                  </small>
                </label>
                <Button
                  type="primary"
                  size="large"
                  loading={accept.isPending || login.isPending}
                  disabled={name.trim().length < 2 || password.length < PASSWORD_MIN_LENGTH}
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
