import { Navigate, useParams } from "react-router-dom";

export function Component() {
  const { orgSlug, workspaceSlug } = useParams();
  return <Navigate replace to={`/app/${orgSlug}/${workspaceSlug}/dashboard`} />;
}
