import type { InvitationPreviewDto } from "@relayops/types";
import { AsyncState } from "@relayops/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Input, Tag } from "antd";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../services/api-client";
import { AuthLayout } from "./auth-layout";

export function Component() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const preview = useQuery({
    queryKey: ["invitation-preview", token],
    queryFn: () =>
      apiRequest<InvitationPreviewDto>(`/api/v1/invitations/${token}`).then(
        (result) => result.data
      ),
    retry: false
  });
  const accept = useMutation({
    mutationFn: () =>
      apiRequest<{ email: string }>(`/api/v1/invitations/${token}/accept`, {
        method: "POST",
        body: JSON.stringify(preview.data?.accountExists ? {} : { name, password })
      }),
    onSuccess: ({ data }) => {
      void navigate(`/login?email=${encodeURIComponent(data.email)}&invited=1`);
    }
  });

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
                  onClick={() => accept.mutate()}
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
                  onClick={() => accept.mutate()}
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
