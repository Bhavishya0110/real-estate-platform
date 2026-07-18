/**
 * ROLES AND PERMISSIONS
 *
 * The authorisation vocabulary, defined independently of how users are stored.
 * Today a user's role arrives from an environment-configured account; tomorrow
 * it arrives from a `role` column. Neither this file nor anything that consumes
 * it changes when that happens.
 *
 * Checks are written against *permissions*, never against roles directly — so
 * introducing a new role is a change to the table below rather than a hunt
 * through every guarded route.
 */

export const ROLES = ["owner", "admin", "editor", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
  | "content:read"
  | "content:write"
  | "leads:read"
  | "leads:write"
  | "settings:read"
  | "settings:write"
  | "users:manage";

const ALL: Permission[] = [
  "content:read",
  "content:write",
  "leads:read",
  "leads:write",
  "settings:read",
  "settings:write",
  "users:manage",
];

/** What each role may do. The single source of truth for authorisation. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  // The account that can hand out access, including to other owners.
  owner: ALL,
  // Runs the site day to day but cannot change who has access.
  admin: ALL.filter((permission) => permission !== "users:manage"),
  // Publishes content and works the lead queue; no configuration.
  editor: ["content:read", "content:write", "leads:read", "leads:write", "settings:read"],
  // Read-only — for reporting or a new joiner still finding their feet.
  viewer: ["content:read", "leads:read", "settings:read"],
};

/** Human-readable role names, for the admin UI. */
export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Whether a role carries a permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Whether a role carries every one of the given permissions. */
export function canAll(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => can(role, permission));
}
