import { digestTransitionMessage, type DigestAction, type DigestLifecycleStatus } from "./digestLifecycle";

export const workspaceContentStatuses = ["draft", "in_review", "approved", "scheduled", "published", "unpublished", "archived"] as const;
export type WorkspaceContentStatus = typeof workspaceContentStatuses[number];
export type WorkspaceContentAction = "save" | "submit" | "approve" | "publish" | "unpublish" | "archive" | "restore" | "duplicate";

const actions: Record<WorkspaceContentStatus, WorkspaceContentAction[]> = {
  draft: ["save", "submit", "publish", "archive", "duplicate"],
  in_review: ["save", "approve", "publish", "archive", "duplicate"],
  approved: ["save", "publish", "archive", "duplicate"],
  scheduled: ["save", "publish", "unpublish", "archive", "duplicate"],
  published: ["save", "unpublish", "archive", "duplicate"],
  unpublished: ["save", "publish", "archive", "duplicate"],
  archived: ["restore", "duplicate"],
};

export function canPerformWorkspaceAction(status: WorkspaceContentStatus, action: WorkspaceContentAction) {
  return actions[status].includes(action);
}

export function workspaceTransitionMessage(status: WorkspaceContentStatus, action: WorkspaceContentAction) {
  if (["draft", "in_review", "approved", "published"].includes(status) && ["save", "submit", "publish"].includes(action)) {
    return digestTransitionMessage(status as DigestLifecycleStatus, action as DigestAction);
  }
  return `An item in ${status.replace("_", " ")} status cannot ${action.replace("_", " ")}.`;
}

export function resolvePublishStatus(scheduledFor?: Date | null, now = new Date()): "published" | "scheduled" {
  return scheduledFor && scheduledFor.getTime() > now.getTime() ? "scheduled" : "published";
}
