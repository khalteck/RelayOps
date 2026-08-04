import { Spin } from "antd";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../operations/auth.queries";

export function ProtectedRoute() {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <main className="centered-state">
        <Spin size="large" />
        <p>Restoring your secure session…</p>
      </main>
    );
  }
  if (session.isError) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  const onboarding = session.data?.onboarding;
  const isOnboardingRoute = location.pathname.startsWith("/onboarding/");
  if (onboarding?.required && !isOnboardingRoute) {
    return (
      <Navigate
        to={onboarding.kind === "owner" ? "/onboarding/owner" : "/onboarding/member"}
        replace
      />
    );
  }
  if (onboarding && !onboarding.required && isOnboardingRoute) return <Navigate to="/" replace />;
  return <Outlet />;
}
