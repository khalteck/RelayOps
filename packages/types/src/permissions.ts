import type { Role } from "./enums.js";

export const PERMISSIONS = [
  "organisation:update",
  "workspace:create",
  "workspace:update",
  "sla:update",
  "incident:create",
  "incident:update:any",
  "incident:update:assigned",
  "incident:claim",
  "incident:assign",
  "incident:comment:any",
  "incident:comment:assigned",
  "analytics:read",
  "audit:read",
  "saved-view:manage"
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  administrator: PERMISSIONS.filter((permission) => permission !== "organisation:update"),
  responder: [
    "incident:create",
    "incident:update:assigned",
    "incident:claim",
    "incident:comment:assigned",
    "analytics:read",
    "saved-view:manage"
  ],
  viewer: ["analytics:read", "saved-view:manage"]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return rolePermissions[role];
}
