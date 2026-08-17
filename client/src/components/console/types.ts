/**
 * Arabtec Console design reminder:
 * Keep digest data typed and editorially bounded so the console stays a practical review surface, not an unstructured CMS.
 */
export type DigestAudience = "employees" | "owners" | "joiners";
export type DigestStatus = "draft" | "in_review" | "approved" | "published";

export type DigestEntry = {
  category: string;
  headline: string;
  summary: string;
  audience: DigestAudience;
  sortOrder: number;
};

export type DigestFormState = {
  id: number;
  title: string;
  introduction: string;
  digestDate: string;
  scheduledFor: string;
  recipientCount: number;
  status: DigestStatus;
  entries: DigestEntry[];
};
