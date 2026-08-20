/** Shared with the client so the console can hide what a role cannot use. */
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
export const workspaceRoles = ["user", "viewer", "editor", "publisher", "admin"] as const;
export type WorkspaceRole = typeof workspaceRoles[number];
