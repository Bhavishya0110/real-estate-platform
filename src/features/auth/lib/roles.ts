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

/**
 * The roles the business actually has.
 *
 * `editor` is retained as an alias for `content_editor` so any session token
 * issued before the database migration still validates — dropping it would
 * have signed those operators out mid-shift for no benefit.
 */
export const ROLES = [
  "owner",
  "admin",
  "sales_manager",
  "sales_executive",
  "content_editor",
  "marketing",
  "support",
  "editor",
  "viewer",
] as const;

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

/**
 * What each role may do.
 *
 * These coarse permissions guard the routes; the fine-grained
 * `resource:action` grants in `role_permissions` guard individual operations.
 * Both are seeded from the same role definitions, so they cannot disagree about
 * who is an editor — this table is the one the middleware and layout can read
 * without a database round trip.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  // The account that can hand out access, including to other owners.
  owner: ALL,
  // Runs the site day to day but cannot change who has access.
  admin: ALL.filter((permission) => permission !== "users:manage"),
  // Owns the pipeline: every lead, not only their own.
  sales_manager: [
    "content:read",
    "leads:read",
    "leads:write",
    "settings:read",
  ],
  // Works their own assigned leads. Row scoping is enforced in the repository.
  sales_executive: ["content:read", "leads:read", "leads:write"],
  // Publishes the catalogue and editorial content. No lead access at all.
  content_editor: ["content:read", "content:write", "settings:read"],
  // SEO, campaigns and reporting; aggregate lead visibility only.
  marketing: ["content:read", "content:write", "leads:read", "settings:read"],
  // Answers enquiries, callbacks and chat.
  support: ["content:read", "leads:read", "leads:write"],
  // Legacy alias for content_editor — see ROLES.
  editor: ["content:read", "content:write", "leads:read", "leads:write", "settings:read"],
  // Read-only — for reporting or a new joiner still finding their feet.
  viewer: ["content:read", "leads:read", "settings:read"],
};

/** Human-readable role names, for the admin UI. */
export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
  content_editor: "Content Editor",
  marketing: "Marketing",
  support: "Support",
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
