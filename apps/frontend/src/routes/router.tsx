import {
  loadAcceptInviteView,
  loadLoginView,
  loadRegisterView,
  ProtectedRoute
} from "@/modules/auth";
import { loadAuditLogView } from "@/modules/audit-log";
import { loadDashboardView } from "@/modules/dashboard";
import { loadIncidentsView } from "@/modules/incidents";
import { loadSettingsView } from "@/modules/settings";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { loadAppShell } from "./app-shell-route";
import { RouteError } from "./route-error";

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: "/login", lazy: loadLoginView },
      { path: "/register", lazy: loadRegisterView },
      { path: "/accept-invite/:token", lazy: loadAcceptInviteView },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, lazy: () => import("./entry-route") },
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
