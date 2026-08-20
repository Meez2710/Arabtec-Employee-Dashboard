import type { userRoles } from "../drizzle/schema";

export type UserRole = typeof userRoles[number];

/**
 * Capability model.
 *
 * `user` is the pre-existing default for every signed-in employee and carries no
 * console access. The four console roles required by the programme map onto it as:
 *   viewer    — read the console, change nothing
 *   editor    — write content, cannot publish
 *   publisher — write and publish content
 *   admin     — everything, including people, sections, and settings
 */
export const workspaceCapabilities = [
  "console.view",
  "content.write",
  "content.publish",
  "layout.manage",
  "sections.manage",
  "people.manage",
  "settings.manage",
  "audit.view",
] as const;

export type WorkspaceCapability = typeof workspaceCapabilities[number];

const capabilitiesByRole: Record<UserRole, readonly WorkspaceCapability[]> = {
  user: [],
  viewer: ["console.view"],
  editor: ["console.view", "content.write"],
  publisher: ["console.view", "content.write", "content.publish", "layout.manage", "audit.view"],
  admin: [...workspaceCapabilities],
};

export function roleCapabilities(role: UserRole | null | undefined): readonly WorkspaceCapability[] {
  if (!role) return [];
  return capabilitiesByRole[role] ?? [];
}

export function roleHasCapability(role: UserRole | null | undefined, capability: WorkspaceCapability): boolean {
  return roleCapabilities(role).includes(capability);
}

/** Human-readable reason used verbatim in API errors and in the console. */
export function capabilityDeniedMessage(capability: WorkspaceCapability, role: UserRole | null | undefined): string {
  const readable: Record<WorkspaceCapability, string> = {
    "console.view": "open the Workspace console",
    "content.write": "create or edit content",
    "content.publish": "publish, schedule, or unpublish content",
    "layout.manage": "change the employee home layout",
    "sections.manage": "change section settings",
    "people.manage": "manage people and roles",
    "settings.manage": "change Workspace settings",
    "audit.view": "view the audit log",
  };
  const current = role ?? "signed out";
  return `Your ${current} access cannot ${readable[capability]}. Ask a Workspace administrator to grant it.`;
}
