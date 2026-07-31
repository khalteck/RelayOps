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
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, lazy: () => import("./entry.route") },
          {
            path: "/app/:orgSlug/:workspaceSlug",
            element: <AppShell />,
            children: [
              { path: "overview", lazy: () => import("../features/organisations/overview.route") },
              { path: "settings", lazy: () => import("../features/organisations/settings.route") }
            ]
          }
        ]
      }
    ]
  }
]);
