import {
  loadAcceptInviteView,
  loadLoginView,
  loadRegisterView,
  loadVerifyEmailView,
  loadOwnerOnboardingView,
  loadInvitedOnboardingView,
  ProtectedRoute
} from "@/modules/auth";
import { loadAuditLogView } from "@/modules/audit-log";
import { loadDashboardView } from "@/modules/dashboard";
import { loadIncidentsView } from "@/modules/incidents";
import { loadSettingsView } from "@/modules/settings";
import { loadLandingView } from "@/modules/landing";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { loadAppShell } from "./app-shell-route";
import { RouteError } from "./route-error";

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { index: true, lazy: loadLandingView },
      { path: "/login", lazy: loadLoginView },
      { path: "/register", lazy: loadRegisterView },
      { path: "/verify-email", lazy: loadVerifyEmailView },
      { path: "/accept-invite/:token", lazy: loadAcceptInviteView },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/onboarding/owner", lazy: loadOwnerOnboardingView },
          { path: "/onboarding/member", lazy: loadInvitedOnboardingView },
          { path: "/app", lazy: () => import("./entry-route") },
          {
            path: "/app/:orgSlug/:workspaceSlug",
            lazy: loadAppShell,
            children: [
              { path: "dashboard", lazy: loadDashboardView },
              { path: "overview", element: <Navigate to="../dashboard" replace /> },
              { path: "incidents", lazy: loadIncidentsView },
              { path: "analytics", element: <Navigate to="../dashboard" replace /> },
              { path: "audit-log", lazy: loadAuditLogView },
              { path: "settings", lazy: loadSettingsView }
            ]
          }
        ]
      }
    ]
  }
]);
