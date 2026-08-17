export type DigestLifecycleStatus = "draft" | "in_review" | "approved" | "published";
export type DigestAction = "save" | "submit" | "publish";

const allowedActions: Record<DigestLifecycleStatus, DigestAction[]> = {
  draft: ["save", "submit"],
  in_review: ["save", "publish"],
  approved: ["publish"],
  published: [],
};

export function canPerformDigestAction(status: DigestLifecycleStatus, action: DigestAction) {
  return allowedActions[status].includes(action);
}

export function digestTransitionMessage(status: DigestLifecycleStatus, action: DigestAction) {
  const labels: Record<DigestAction, string> = {
    save: "save this draft",
    submit: "submit this digest for review",
    publish: "publish this digest",
  };
  return `A digest in ${status.replace("_", " ")} status cannot ${labels[action]}.`;
}
