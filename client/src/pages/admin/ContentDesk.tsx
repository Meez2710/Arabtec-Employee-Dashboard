import { useMemo, useState } from "react";
import { Archive, Copy, Eye, FilePlus2, RotateCcw, Save, Send, UploadCloud } from "lucide-react";
import { Badge, EmptyState, Kicker } from "@/components/workspace/Primitives";
import { formatCairoDate } from "@shared/workspaceTime";
import { copy } from "@/lib/workspaceCopy";
import {
  cardSizes, resourceTypes, severities, slotLabel, slots, statusLabel, statusTone,
  toDateInput, type EditorDraft, type Status,
} from "./adminShared";
import type { WorkspaceSlot } from "@/lib/workspaceContent";

export type ManagedItem = {
  id: number; slot: string; title: string; status: string;
  scheduledFor: Date | null; publishedAt: Date | null; expiresAt: Date | null; reviewBy: Date | null;
  ownerName: string | null; ownerEmail: string | null; reviewOverdue: boolean;
  titleAr: string | null; bodyAr: string | null; imageUrl: string | null; imageAlt: string | null;
  updatedAt: Date;
};

export type Blocker = { field: string; message: string };

const statuses: Array<Status | "all" | "attention"> = ["attention", "all", "draft", "in_review", "approved", "scheduled", "published", "unpublished", "archived"];
const sortOptions = [
  { key: "priority", label: "Action priority" },
  { key: "updated", label: "Last updated" },
  { key: "review", label: "Review date" },
  { key: "golive", label: "Go-live date" },
] as const;

const when = (value?: Date | null) => (value ? formatCairoDate(value, "en", { dateStyle: "medium", timeStyle: "short" }) : "Not set");

/** Later status = closer to needing a decision, so the queue can rank by urgency. */
const priorityRank = (item: ManagedItem) => {
  if (item.reviewOverdue) return 0;
  if (item.status === "in_review") return 1;
  if (item.status === "approved") return 2;
  if (item.status === "scheduled") return 3;
  if (item.status === "draft") return 4;
  if (item.status === "published") return 5;
  return 6;
};

type ContentDeskProps = {
  items: ManagedItem[];
  loading: boolean;
  draft: EditorDraft | null;
  owners: Array<{ id: number; name: string | null; email: string | null }>;
  history: Array<{ id: number; action: string; actorName: string | null; actorEmail: string | null; createdAt: Date; note: string | null }>;
  blockers: Blocker[];
  warnings: Blocker[];
  canWrite: boolean;
  canPublish: boolean;
  saving: boolean;
  selectedIds: number[];
  onSelectItem: (id: number) => void;
  onToggleSelect: (id: number) => void;
  onDraftChange: (next: EditorDraft) => void;
  onNew: () => void;
  onSave: () => void;
  onPublish: (id: number) => void;
  onAction: (id: number, action: "unpublish" | "archive" | "restore" | "duplicate" | "submit") => void;
  onBulk: (action: "archive" | "unpublish") => void;
  onPreview: () => void;
};

export function ContentDesk(props: ContentDeskProps) {
  const { items, draft, canWrite, canPublish } = props;
  const [statusFilter, setStatusFilter] = useState<Status | "all" | "attention">("attention");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<typeof sortOptions[number]["key"]>("priority");

  const filtered = useMemo(() => {
    let list = items.slice();
    if (statusFilter === "attention") list = list.filter(item => item.reviewOverdue || ["in_review", "approved", "draft"].includes(item.status));
    else if (statusFilter !== "all") list = list.filter(item => item.status === statusFilter);
    const term = search.trim().toLowerCase();
    if (term) list = list.filter(item => `${item.title} ${item.slot} ${item.ownerName ?? ""} ${item.ownerEmail ?? ""}`.toLowerCase().includes(term));
    list.sort((a, b) => {
      if (sort === "priority") return priorityRank(a) - priorityRank(b) || b.updatedAt.getTime() - a.updatedAt.getTime();
      if (sort === "updated") return b.updatedAt.getTime() - a.updatedAt.getTime();
      if (sort === "review") return (a.reviewBy?.getTime() ?? Infinity) - (b.reviewBy?.getTime() ?? Infinity);
      return (a.scheduledFor?.getTime() ?? Infinity) - (b.scheduledFor?.getTime() ?? Infinity);
    });
    return list;
  }, [items, statusFilter, search, sort]);

  const set = <K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => {
    if (!draft) return;
    props.onDraftChange({ ...draft, [key]: value });
  };

  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>Workspace console</Kicker>
          <h1 className="ws-heading ws-heading--dot">Content</h1>
          <p className="ws-lede">Every action is reversible. Drafts stay private until someone confirms publication.</p>
        </div>
        {canWrite && <button type="button" className="ws-btn ws-btn--primary" onClick={props.onNew}><FilePlus2 size={16} aria-hidden="true" /> New item</button>}
      </div>

      <div className="adm__toolbar">
        <label className="sr-only" htmlFor="content-search">Search content</label>
        <input id="content-search" className="ws-input" type="search" placeholder="Search by title, section, or owner" value={search} onChange={event => setSearch(event.target.value)} />
        <label className="sr-only" htmlFor="content-status">Filter by status</label>
        <select id="content-status" className="ws-input" value={statusFilter} onChange={event => setStatusFilter(event.target.value as Status | "all")}>
          {statuses.map(value => <option key={value} value={value}>{value === "attention" ? "Needs attention" : value === "all" ? "All statuses" : statusLabel(value)}</option>)}
        </select>
        <label className="sr-only" htmlFor="content-sort">Sort</label>
        <select id="content-sort" className="ws-input" value={sort} onChange={event => setSort(event.target.value as typeof sort)}>
          {sortOptions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
        {props.selectedIds.length > 0 && canPublish && (
          <>
            <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onBulk("unpublish")}>Unpublish {props.selectedIds.length}</button>
            <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onBulk("archive")}>Archive {props.selectedIds.length}</button>
          </>
        )}
      </div>

      <div className="adm__split">
        <section className="adm__panel" aria-label="All content">
          <div className="ws-tablewrap">
            <table className="ws-table">
              <caption className="sr-only">All content items with status, go-live, owner, and review date</caption>
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Select</span></th>
                  <th scope="col">Item</th>
                  <th scope="col">Status</th>
                  <th scope="col">Go live</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Review</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {props.loading ? (
                  <tr><td colSpan={7}><EmptyState message="Loading content…" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState message="Nothing matches these filters." /></td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className={draft?.id === item.id ? "is-selected" : undefined}>
                    <td data-label="Select">
                      <input
                        type="checkbox"
                        checked={props.selectedIds.includes(item.id)}
                        onChange={() => props.onToggleSelect(item.id)}
                        aria-label={`Select ${item.title}`}
                      />
                    </td>
                    <td data-label="Item">
                      <button type="button" className="ws-table__title" onClick={() => props.onSelectItem(item.id)}>
                        {item.title}
                        <span>{slotLabel(item.slot)}</span>
                      </button>
                    </td>
                    <td data-label="Status"><Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge></td>
                    <td data-label="Go live">{item.status === "scheduled" ? when(item.scheduledFor) : item.publishedAt ? when(item.publishedAt) : "Not live"}</td>
                    <td data-label="Owner">{item.ownerName || item.ownerEmail || "Unassigned"}</td>
                    <td data-label="Review">{item.reviewOverdue ? <Badge tone="critical">Review overdue</Badge> : when(item.reviewBy)}</td>
                    <td data-label="Actions">
                      <div className="ws-rowactions">
                        {canPublish && item.status !== "archived" && item.status !== "published" && (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onPublish(item.id)}>Publish</button>
                        )}
                        {canPublish && ["published", "scheduled"].includes(item.status) && (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "unpublish")}>Unpublish</button>
                        )}
                        {canWrite && (item.status === "archived" ? (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "restore")}><RotateCcw size={14} aria-hidden="true" /> Restore</button>
                        ) : (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "archive")}><Archive size={14} aria-hidden="true" /> Archive</button>
                        ))}
                        {canWrite && <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "duplicate")}><Copy size={14} aria-hidden="true" /> Duplicate</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="adm__panel" aria-label="Item history">
          <Kicker>Item history</Kicker>
          {props.history.length === 0 ? (
            <EmptyState message="No recorded changes yet." />
          ) : (
            <ol className="adm__history">
              {props.history.map(entry => (
                <li key={entry.id}>
                  <strong>{entry.action.replace(/_/g, " ")}</strong>
                  <span>{entry.actorName || entry.actorEmail || "System"} · {when(entry.createdAt)}</span>
                  {entry.note && <p>{entry.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      {draft && (
        <section className="adm__panel" style={{ marginBlockStart: "var(--space-5)" }} aria-label="Item editor">
          <div className="adm__head">
            <div>
              <Kicker>{draft.id ? "Edit item" : "New draft"}</Kicker>
              <h2 className="ws-subheading">{draft.title || "Untitled item"}</h2>
            </div>
            {draft.id && <Badge tone={statusTone(draft.status)}>{statusLabel(draft.status)}</Badge>}
          </div>

          <div className="adm__form">
            <label className="ws-field">
              <span>Section</span>
              <select className="ws-input" value={draft.slot} onChange={event => set("slot", event.target.value as WorkspaceSlot)} disabled={!canWrite}>
                {slots.map(slot => <option key={slot} value={slot}>{slotLabel(slot)}</option>)}
              </select>
            </label>
            <label className="ws-field">
              <span>Owner</span>
              <select className="ws-input" value={draft.ownerUserId ?? ""} onChange={event => set("ownerUserId", event.target.value ? Number(event.target.value) : null)} disabled={!canWrite}>
                <option value="">Assign to me when saved</option>
                {props.owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name || owner.email || `Account ${owner.id}`}</option>)}
              </select>
            </label>

            <div className="adm__bilingual">
              <div>
                <span className="adm__lang-tag">English</span>
                <label className="ws-field"><span>Label</span><input className="ws-input" value={draft.eyebrow} onChange={event => set("eyebrow", event.target.value)} placeholder="For example: People and Culture" disabled={!canWrite} /></label>
                <label className="ws-field"><span>Title</span><input className="ws-input" value={draft.title} onChange={event => set("title", event.target.value)} placeholder="Clear employee-facing headline" disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "title")} /></label>
                <label className="ws-field"><span>Employee message</span><textarea className="ws-input" value={draft.body} onChange={event => set("body", event.target.value)} placeholder="What employees need to know" disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "body")} /></label>
              </div>
              <div lang="ar" dir="rtl">
                <span className="adm__lang-tag">العربية</span>
                <label className="ws-field"><span>التسمية</span><input className="ws-input" value={draft.eyebrowAr} onChange={event => set("eyebrowAr", event.target.value)} disabled={!canWrite} /></label>
                <label className="ws-field"><span>العنوان</span><input className="ws-input" value={draft.titleAr} onChange={event => set("titleAr", event.target.value)} disabled={!canWrite} /></label>
                <label className="ws-field"><span>الرسالة</span><textarea className="ws-input" value={draft.bodyAr} onChange={event => set("bodyAr", event.target.value)} disabled={!canWrite} /></label>
              </div>
            </div>

            {draft.slot === "announcement" && (
              <>
                <label className="ws-field">
                  <span>Severity</span>
                  <select className="ws-input" value={draft.severity} onChange={event => set("severity", event.target.value as EditorDraft["severity"])} disabled={!canWrite}>
                    {severities.map(value => <option key={value} value={value}>{copy.severity[value].en}</option>)}
                  </select>
                </label>
                <label className="ws-switch">
                  <input type="checkbox" checked={draft.requiresAck} onChange={event => set("requiresAck", event.target.checked)} disabled={!canWrite} />
                  <span>Ask employees to acknowledge this notice</span>
                </label>
              </>
            )}

            {["week_ahead", "activity", "new_joiner"].includes(draft.slot) && (
              <label className="ws-field">
                <span>{draft.slot === "new_joiner" ? "Start date" : "Date and time"}</span>
                <input className="ws-input" type="datetime-local" value={draft.eventStart} onChange={event => set("eventStart", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "eventStart")} />
              </label>
            )}
            {["activity", "opportunity", "week_ahead"].includes(draft.slot) && (
              <label className="ws-field"><span>Location</span><input className="ws-input" value={draft.location} onChange={event => set("location", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "location")} /></label>
            )}
            {["opportunity", "new_joiner"].includes(draft.slot) && (
              <label className="ws-field"><span>{draft.slot === "new_joiner" ? "Department" : "Function"}</span><input className="ws-input" value={draft.functionArea} onChange={event => set("functionArea", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "functionArea")} /></label>
            )}
            {draft.slot === "opportunity" && (
              <label className="ws-field"><span>Closing date</span><input className="ws-input" type="datetime-local" value={draft.closingDate} onChange={event => set("closingDate", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "closingDate")} /></label>
            )}
            {["industry_watch", "resource"].includes(draft.slot) && (
              <label className="ws-field"><span>{draft.slot === "resource" ? "Owning department" : "Source"}</span><input className="ws-input" value={draft.sourceName} onChange={event => set("sourceName", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "sourceName")} /></label>
            )}
            {draft.slot === "resource" && (
              <label className="ws-field">
                <span>Resource type</span>
                <select className="ws-input" value={draft.resourceType} onChange={event => set("resourceType", event.target.value as EditorDraft["resourceType"])} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "resourceType")}>
                  <option value="">Choose a type</option>
                  {resourceTypes.map(value => <option key={value} value={value}>{copy.resourceType[value].en}</option>)}
                </select>
              </label>
            )}

            <label className="ws-field is-full"><span>External destination (optional)</span><input className="ws-input" type="url" value={draft.linkUrl} onChange={event => set("linkUrl", event.target.value)} placeholder="https://…" disabled={!canWrite} /></label>
            <label className="ws-field is-full"><span>Image URL (optional)</span><input className="ws-input" type="url" value={draft.imageUrl} onChange={event => set("imageUrl", event.target.value)} disabled={!canWrite} /></label>
            {draft.imageUrl && (
              <div className="adm__bilingual">
                <label className="ws-field"><span>Image description (English)</span><input className="ws-input" value={draft.imageAlt} onChange={event => set("imageAlt", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "imageAlt")} /><span className="ws-field__hint">Required whenever an image is attached.</span></label>
                <label className="ws-field" lang="ar" dir="rtl"><span>وصف الصورة</span><input className="ws-input" value={draft.imageAltAr} onChange={event => set("imageAltAr", event.target.value)} disabled={!canWrite} /></label>
              </div>
            )}

            <label className="ws-field">
              <span>Card size on Home</span>
              <select className="ws-input" value={draft.cardSize} onChange={event => set("cardSize", event.target.value as EditorDraft["cardSize"])} disabled={!canWrite}>
                {cardSizes.map(value => <option key={value} value={value}>{value === "1x1" ? "Original" : value === "2x1" ? "Double width" : "Double height"}</option>)}
              </select>
            </label>
            <label className="ws-field"><span>Go live at (optional)</span><input className="ws-input" type="datetime-local" value={draft.scheduledFor} onChange={event => set("scheduledFor", event.target.value)} disabled={!canWrite} /></label>
            <label className="ws-field"><span>Expire at (optional)</span><input className="ws-input" type="datetime-local" value={draft.expiresAt} onChange={event => set("expiresAt", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "expiresAt")} /></label>
            <label className="ws-field"><span>Review by (optional)</span><input className="ws-input" type="datetime-local" value={draft.reviewBy} onChange={event => set("reviewBy", event.target.value)} disabled={!canWrite} /></label>
          </div>

          {props.blockers.length > 0 && (
            <div className="adm__gates" role="alert">
              <strong>Cannot publish yet</strong>
              <ul>{props.blockers.map(blocker => <li key={blocker.field + blocker.message}>{blocker.message}</li>)}</ul>
            </div>
          )}
          {props.warnings.length > 0 && (
            <div className="adm__warns">
              <strong>Worth checking</strong>
              <ul>{props.warnings.map(warning => <li key={warning.field + warning.message}>{warning.message}</li>)}</ul>
            </div>
          )}

          <div className="adm__savebar">
            <span className="adm__savebar-status">All times are Africa/Cairo.</span>
            {canWrite && <button type="button" className="ws-btn ws-btn--primary" onClick={props.onSave} disabled={props.saving}><Save size={16} aria-hidden="true" /> {props.saving ? "Saving…" : "Save draft"}</button>}
            {draft.id && <button type="button" className="ws-btn" onClick={props.onPreview}><Eye size={16} aria-hidden="true" /> Preview as employee</button>}
            {draft.id && canWrite && draft.status === "draft" && <button type="button" className="ws-btn" onClick={() => props.onAction(draft.id!, "submit")}><Send size={16} aria-hidden="true" /> Send for review</button>}
            {draft.id && canPublish && <button type="button" className="ws-btn" onClick={() => props.onPublish(draft.id!)} disabled={props.blockers.length > 0}><UploadCloud size={16} aria-hidden="true" /> Publish…</button>}
          </div>
        </section>
      )}
    </>
  );
}
