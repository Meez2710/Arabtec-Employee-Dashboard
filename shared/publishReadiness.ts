/**
 * Publish gates, shared by the console and the server.
 *
 * The console uses these to disable the publish button and explain why; the
 * server uses the same function to reject the mutation. One definition, so the
 * UI can never drift from what is actually enforced.
 */
export const workspaceCardSlots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity", "week_ahead", "resource"] as const;
export type WorkspaceSlot = typeof workspaceCardSlots[number];

export type PublishCandidate = {
  slot: WorkspaceSlot;
  title: string;
  body: string;
  titleAr?: string | null;
  bodyAr?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  eventStart?: Date | null;
  location?: string | null;
  functionArea?: string | null;
  closingDate?: Date | null;
  sourceName?: string | null;
  resourceType?: string | null;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
};

export type PublishBlocker = { field: string; message: string };

/** Fields each section template requires before an item may go live. */
export const requiredFieldsBySlot: Record<WorkspaceSlot, Array<keyof PublishCandidate>> = {
  announcement: [],
  week_ahead: ["eventStart"],
  new_joiner: ["functionArea", "eventStart"],
  company_news: [],
  activity: ["eventStart", "location"],
  industry_watch: ["sourceName"],
  opportunity: ["location", "functionArea", "closingDate"],
  resource: ["resourceType"],
};

const fieldLabels: Record<string, string> = {
  eventStart: "Date",
  location: "Location",
  functionArea: "Function or department",
  closingDate: "Closing date",
  sourceName: "Source",
  resourceType: "Resource type",
};

/**
 * Blockers prevent publication. Warnings do not, but are surfaced so nobody
 * publishes a half-translated notice without noticing.
 */
export function evaluatePublishReadiness(candidate: PublishCandidate): { blockers: PublishBlocker[]; warnings: PublishBlocker[] } {
  const blockers: PublishBlocker[] = [];
  const warnings: PublishBlocker[] = [];

  if (!candidate.title?.trim()) blockers.push({ field: "title", message: "Add an English title." });
  if (!candidate.body?.trim()) blockers.push({ field: "body", message: "Add the employee message." });
  if (!candidate.slot) blockers.push({ field: "slot", message: "Choose a section." });

  for (const field of requiredFieldsBySlot[candidate.slot] ?? []) {
    const value = candidate[field];
    if (value === null || value === undefined || value === "") {
      blockers.push({ field: String(field), message: `${fieldLabels[String(field)] ?? String(field)} is required for this section.` });
    }
  }

  if (candidate.imageUrl && !candidate.imageAlt?.trim()) {
    blockers.push({ field: "imageAlt", message: "Describe the image so screen-reader users get the same information." });
  }

  if (candidate.scheduledFor && candidate.expiresAt && candidate.scheduledFor.getTime() >= candidate.expiresAt.getTime()) {
    blockers.push({ field: "expiresAt", message: "The expiry time must come after the go-live time." });
  }

  if (candidate.expiresAt && candidate.expiresAt.getTime() <= Date.now()) {
    blockers.push({ field: "expiresAt", message: "This expiry time has already passed." });
  }

  if (!candidate.titleAr?.trim()) warnings.push({ field: "titleAr", message: "No Arabic title. Arabic readers will see the English title." });
  if (!candidate.bodyAr?.trim()) warnings.push({ field: "bodyAr", message: "No Arabic message. Arabic readers will see the English message." });

  return { blockers, warnings };
}
