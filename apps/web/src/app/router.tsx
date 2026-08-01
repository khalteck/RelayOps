import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./app-shell";
import { RouteError } from "./route-error";
import { ProtectedRoute } from "../features/auth/protected-route";

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: "/login", lazy: () => import("../features/auth/login.route") },
      { path: "/register", lazy: () => import("../features/auth/register.route") },
      { path: "/accept-invite/:token", lazy: () => import("../features/auth/accept-invite.route") },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, lazy: () => import("./entry.route") },
          {
            path: "/app/:orgSlug/:workspaceSlug",
            element: <AppShell />,
            children: [
              { path: "dashboard", lazy: () => import("../features/dashboard/dashboard.route") },
              { path: "overview", lazy: () => import("../features/organisations/overview.route") },
              { path: "incidents", lazy: () => import("../features/incidents/incidents.route") },
              { path: "analytics", lazy: () => import("../features/analytics/analytics.route") },
              { path: "audit-log", lazy: () => import("../features/audit-log/audit-log.route") },
              { path: "settings", lazy: () => import("../features/organisations/settings.route") }
            ]
          }
        ]
      }
    ]
  }
]);
