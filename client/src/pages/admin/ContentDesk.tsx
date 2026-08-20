import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Copy, Eye, FilePlus2, ImagePlus, RotateCcw, Save, Send, Trash2, UploadCloud } from "lucide-react";
import { Badge, EmptyState, Kicker } from "@/components/workspace/Primitives";
import { useLocale } from "@/contexts/LocaleContext";
import { consoleText } from "@/lib/consoleCopy";
import { copy } from "@/lib/workspaceCopy";
import { formatCairoDate } from "@shared/workspaceTime";
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
const sortKeys = ["priority", "updated", "review", "golive"] as const;


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
  /** Returns the stored URL for an uploaded image. */
  onUploadImage: (file: File) => Promise<string>;
};

const needsAttention = (item: ManagedItem) => item.reviewOverdue || ["in_review", "approved", "draft"].includes(item.status);

export function ContentDesk(props: ContentDeskProps) {
  const { items, draft, canWrite, canPublish } = props;
  // Open on the work that needs a decision, but fall back to everything when
  // there is none — landing on an empty table reads as a broken queue.
  const [statusFilter, setStatusFilter] = useState<Status | "all" | "attention" | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<typeof sortKeys[number]>("priority");
  const { locale } = useLocale();
  const c = consoleText(locale);
  const when = (value?: Date | null) => (value ? formatCairoDate(value, locale, { dateStyle: "medium", timeStyle: "short" }) : c.content.notSet);
  const effectiveFilter = statusFilter ?? (items.some(needsAttention) ? "attention" : "all");
  const editorRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const draftId = draft?.id ?? null;

  // Bring the editor to the reader rather than making them scroll past the
  // queue. Keyed on which item is open, so it does not fire while typing.
  const editorOpen = draft !== null;
  useEffect(() => {
    if (!editorOpen) return;
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [draftId, editorOpen]);

  const filtered = useMemo(() => {
    let list = items.slice();
    if (effectiveFilter === "attention") list = list.filter(needsAttention);
    else if (effectiveFilter !== "all") list = list.filter(item => item.status === effectiveFilter);
    const term = search.trim().toLowerCase();
    if (term) list = list.filter(item => `${item.title} ${item.slot} ${item.ownerName ?? ""} ${item.ownerEmail ?? ""}`.toLowerCase().includes(term));
    list.sort((a, b) => {
      if (sort === "priority") return priorityRank(a) - priorityRank(b) || b.updatedAt.getTime() - a.updatedAt.getTime();
      if (sort === "updated") return b.updatedAt.getTime() - a.updatedAt.getTime();
      if (sort === "review") return (a.reviewBy?.getTime() ?? Infinity) - (b.reviewBy?.getTime() ?? Infinity);
      return (a.scheduledFor?.getTime() ?? Infinity) - (b.scheduledFor?.getTime() ?? Infinity);
    });
    return list;
  }, [items, effectiveFilter, search, sort]);

  const set = <K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => {
    if (!draft) return;
    props.onDraftChange({ ...draft, [key]: value });
  };

  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.content.title}</h1>
          <p className="ws-lede">{c.content.lede}</p>
        </div>
        {canWrite && <button type="button" className="ws-btn ws-btn--primary" onClick={props.onNew}><FilePlus2 size={16} aria-hidden="true" /> {c.content.newItem}</button>}
      </div>

      <div className="adm__toolbar">
        <label className="sr-only" htmlFor="content-search">{c.content.searchLabel}</label>
        <input id="content-search" className="ws-input" type="search" placeholder={c.content.searchPlaceholder} value={search} onChange={event => setSearch(event.target.value)} />
        <label className="sr-only" htmlFor="content-status">{c.content.filterLabel}</label>
        <select id="content-status" className="ws-input" value={effectiveFilter} onChange={event => setStatusFilter(event.target.value as Status | "all")}>
          {statuses.map(value => <option key={value} value={value}>{value === "attention" ? c.content.needsAttention : value === "all" ? c.content.allStatuses : c.status[value]}</option>)}
        </select>
        <label className="sr-only" htmlFor="content-sort">{c.content.sortLabel}</label>
        <select id="content-sort" className="ws-input" value={sort} onChange={event => setSort(event.target.value as typeof sort)}>
          {sortKeys.map(key => <option key={key} value={key}>{c.content.sort[key]}</option>)}
        </select>
        {props.selectedIds.length > 0 && canPublish && (
          <>
            <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onBulk("unpublish")}>{c.content.bulkUnpublish(props.selectedIds.length)}</button>
            <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onBulk("archive")}>{c.content.bulkArchive(props.selectedIds.length)}</button>
          </>
        )}
      </div>

      {/* History is contextual to a selected item, so the queue keeps the full
          width until there is something to show a history for. */}
      <div className={draft ? "adm__split" : undefined}>
        <section className="adm__panel" aria-label={c.content.allContent}>
          <div className="ws-tablewrap">
            <table className="ws-table">
              <caption className="sr-only">{c.content.tableCaption}</caption>
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">{c.content.columns.select}</span></th>
                  <th scope="col">{c.content.columns.item}</th>
                  <th scope="col">{c.content.columns.status}</th>
                  <th scope="col">{c.content.columns.goLive}</th>
                  <th scope="col">{c.content.columns.owner}</th>
                  <th scope="col">{c.content.columns.review}</th>
                  <th scope="col"><span className="sr-only">{c.content.columns.actions}</span></th>
                </tr>
              </thead>
              <tbody>
                {props.loading ? (
                  <tr><td colSpan={7}><EmptyState message={c.content.loading} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState message={c.content.noMatches} /></td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className={draft?.id === item.id ? "is-selected" : undefined}>
                    <td data-label={c.content.columns.select}>
                      <input
                        type="checkbox"
                        checked={props.selectedIds.includes(item.id)}
                        onChange={() => props.onToggleSelect(item.id)}
                        aria-label={c.content.selectItem(item.title)}
                      />
                    </td>
                    <td data-label={c.content.columns.item}>
                      <button type="button" className="ws-table__title" onClick={() => props.onSelectItem(item.id)}>
                        {item.title}
                        <span>{c.slots[item.slot as keyof typeof c.slots] ?? slotLabel(item.slot)}</span>
                      </button>
                    </td>
                    <td data-label={c.content.columns.status}><Badge tone={statusTone(item.status)}>{c.status[item.status as keyof typeof c.status] ?? statusLabel(item.status)}</Badge></td>
                    <td data-label={c.content.columns.goLive}>{item.status === "scheduled" ? when(item.scheduledFor) : item.publishedAt ? when(item.publishedAt) : c.content.notLive}</td>
                    <td data-label={c.content.columns.owner}>{item.ownerName || item.ownerEmail || c.content.unassigned}</td>
                    <td data-label={c.content.columns.review}>{item.reviewOverdue ? <Badge tone="critical">{c.content.reviewOverdue}</Badge> : when(item.reviewBy)}</td>
                    <td data-label={c.content.columns.actions}>
                      <div className="ws-rowactions">
                        {canPublish && item.status !== "archived" && item.status !== "published" && (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onPublish(item.id)}>{c.content.actions.publish}</button>
                        )}
                        {canPublish && ["published", "scheduled"].includes(item.status) && (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "unpublish")}>{c.content.actions.unpublish}</button>
                        )}
                        {canWrite && (item.status === "archived" ? (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "restore")}><RotateCcw size={14} aria-hidden="true" /> {c.content.actions.restore}</button>
                        ) : (
                          <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "archive")}><Archive size={14} aria-hidden="true" /> {c.content.actions.archive}</button>
                        ))}
                        {canWrite && <button type="button" className="ws-btn ws-btn--sm" onClick={() => props.onAction(item.id, "duplicate")}><Copy size={14} aria-hidden="true" /> {c.content.actions.duplicate}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {draft && (
        <aside className="adm__panel" aria-label={c.content.history}>
          <Kicker>{c.content.history}</Kicker>
          {props.history.length === 0 ? (
            <EmptyState message={c.content.historyEmpty} />
          ) : (
            <ol className="adm__history">
              {props.history.map(entry => (
                <li key={entry.id}>
                  <strong>{entry.action.replace(/_/g, " ")}</strong>
                  <span>{entry.actorName || entry.actorEmail || c.content.system} · {when(entry.createdAt)}</span>
                  {entry.note && <p>{entry.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </aside>
        )}
      </div>

      {draft && (
        <section ref={editorRef} className="adm__panel" style={{ marginBlockStart: "var(--space-5)" }} aria-label={c.editor.label}>
          <div className="adm__head">
            <div>
              <Kicker>{draft.id ? c.editor.edit : c.editor.create}</Kicker>
              <h2 className="ws-subheading">{draft.title || c.editor.untitled}</h2>
            </div>
            {draft.id && <Badge tone={statusTone(draft.status)}>{c.status[draft.status]}</Badge>}
          </div>

          <div className="adm__form">
            <label className="ws-field">
              <span>{c.editor.section}</span>
              <select className="ws-input" value={draft.slot} onChange={event => set("slot", event.target.value as WorkspaceSlot)} disabled={!canWrite}>
                {slots.map(slot => <option key={slot} value={slot}>{c.slots[slot]}</option>)}
              </select>
            </label>
            <label className="ws-field">
              <span>{c.editor.owner}</span>
              <select className="ws-input" value={draft.ownerUserId ?? ""} onChange={event => set("ownerUserId", event.target.value ? Number(event.target.value) : null)} disabled={!canWrite}>
                <option value="">{c.editor.assignToMe}</option>
                {props.owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name || owner.email || c.editor.accountLabel(owner.id)}</option>)}
              </select>
            </label>

            <div className="adm__bilingual">
              <div>
                <span className="adm__lang-tag">{c.editor.english}</span>
                <label className="ws-field"><span>{c.editor.fieldLabel}</span><input className="ws-input" value={draft.eyebrow} onChange={event => set("eyebrow", event.target.value)} placeholder={c.editor.labelPlaceholder} disabled={!canWrite} /></label>
                <label className="ws-field"><span>{c.editor.fieldTitle}</span><input className="ws-input" value={draft.title} onChange={event => set("title", event.target.value)} placeholder={c.editor.titlePlaceholder} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "title")} /></label>
                <label className="ws-field"><span>{c.editor.fieldBody}</span><textarea className="ws-input" value={draft.body} onChange={event => set("body", event.target.value)} placeholder={c.editor.bodyPlaceholder} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "body")} /></label>
              </div>
              <div lang="ar" dir="rtl">
                <span className="adm__lang-tag">{c.editor.arabic}</span>
                <label className="ws-field"><span>{c.editor.fieldLabelAr}</span><input className="ws-input" value={draft.eyebrowAr} onChange={event => set("eyebrowAr", event.target.value)} disabled={!canWrite} /></label>
                <label className="ws-field"><span>{c.editor.fieldTitleAr}</span><input className="ws-input" value={draft.titleAr} onChange={event => set("titleAr", event.target.value)} disabled={!canWrite} /></label>
                <label className="ws-field"><span>{c.editor.fieldBodyAr}</span><textarea className="ws-input" value={draft.bodyAr} onChange={event => set("bodyAr", event.target.value)} disabled={!canWrite} /></label>
              </div>
            </div>

            {draft.slot === "announcement" && (
              <>
                <label className="ws-field">
                  <span>{c.editor.severity}</span>
                  <select className="ws-input" value={draft.severity} onChange={event => set("severity", event.target.value as EditorDraft["severity"])} disabled={!canWrite}>
                    {severities.map(value => <option key={value} value={value}>{copy.severity[value][locale]}</option>)}
                  </select>
                </label>
                <label className="ws-switch">
                  <input type="checkbox" checked={draft.requiresAck} onChange={event => set("requiresAck", event.target.checked)} disabled={!canWrite} />
                  <span>{c.editor.requiresAck}</span>
                </label>
              </>
            )}

            {["week_ahead", "activity", "new_joiner"].includes(draft.slot) && (
              <label className="ws-field">
                <span>{draft.slot === "new_joiner" ? c.editor.startDate : c.editor.dateTime}</span>
                <input className="ws-input" type="datetime-local" value={draft.eventStart} onChange={event => set("eventStart", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "eventStart")} />
              </label>
            )}
            {["activity", "opportunity", "week_ahead"].includes(draft.slot) && (
              <div className="adm__bilingual">
                <label className="ws-field"><span>{c.editor.location}</span><input className="ws-input" value={draft.location} onChange={event => set("location", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "location")} /></label>
                <label className="ws-field" lang="ar" dir="rtl"><span>{c.editor.locationAr}</span><input className="ws-input" value={draft.locationAr} onChange={event => set("locationAr", event.target.value)} disabled={!canWrite} /></label>
              </div>
            )}
            {["opportunity", "new_joiner"].includes(draft.slot) && (
              <div className="adm__bilingual">
                <label className="ws-field"><span>{draft.slot === "new_joiner" ? c.editor.department : c.editor.functionArea}</span><input className="ws-input" value={draft.functionArea} onChange={event => set("functionArea", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "functionArea")} /></label>
                <label className="ws-field" lang="ar" dir="rtl"><span>{draft.slot === "new_joiner" ? c.editor.departmentAr : c.editor.functionAreaAr}</span><input className="ws-input" value={draft.functionAreaAr} onChange={event => set("functionAreaAr", event.target.value)} disabled={!canWrite} /></label>
              </div>
            )}
            {draft.slot === "opportunity" && (
              <label className="ws-field"><span>{c.editor.closingDate}</span><input className="ws-input" type="datetime-local" value={draft.closingDate} onChange={event => set("closingDate", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "closingDate")} /></label>
            )}
            {["industry_watch", "resource"].includes(draft.slot) && (
              <div className="adm__bilingual">
                <label className="ws-field"><span>{draft.slot === "resource" ? c.editor.owningDepartment : c.editor.source}</span><input className="ws-input" value={draft.sourceName} onChange={event => set("sourceName", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "sourceName")} /></label>
                <label className="ws-field" lang="ar" dir="rtl"><span>{draft.slot === "resource" ? c.editor.owningDepartmentAr : c.editor.sourceAr}</span><input className="ws-input" value={draft.sourceNameAr} onChange={event => set("sourceNameAr", event.target.value)} disabled={!canWrite} /></label>
              </div>
            )}
            {draft.slot === "resource" && (
              <label className="ws-field">
                <span>{c.editor.resourceType}</span>
                <select className="ws-input" value={draft.resourceType} onChange={event => set("resourceType", event.target.value as EditorDraft["resourceType"])} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "resourceType")}>
                  <option value="">{c.editor.chooseType}</option>
                  {resourceTypes.map(value => <option key={value} value={value}>{copy.resourceType[value][locale]}</option>)}
                </select>
              </label>
            )}

            <label className="ws-field is-full"><span>{c.editor.externalUrl}</span><input className="ws-input" type="url" value={draft.linkUrl} onChange={event => set("linkUrl", event.target.value)} placeholder="https://…" disabled={!canWrite} /></label>
            <div className="ws-field is-full">
              <span>{c.editor.imageUpload}</span>
              {draft.imageUrl && (
                <img className="adm__image-preview" src={draft.imageUrl} alt={draft.imageAlt || c.editor.imagePreview} onError={event => { event.currentTarget.style.display = "none"; }} />
              )}
              <div className="adm__image-actions">
                <input
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!canWrite || uploading}
                  onChange={async event => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setUploadError(null);
                    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setUploadError(c.editor.wrongType); return; }
                    if (file.size > 5_000_000) { setUploadError(c.editor.tooLarge); return; }
                    setUploading(true);
                    try {
                      set("imageUrl", await props.onUploadImage(file));
                    } catch (error) {
                      setUploadError(error instanceof Error ? error.message : c.editor.uploadFailed);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <button type="button" className="ws-btn" onClick={() => fileRef.current?.click()} disabled={!canWrite || uploading}>
                  <ImagePlus size={16} aria-hidden="true" /> {uploading ? c.editor.uploading : draft.imageUrl ? c.editor.replaceImage : c.editor.chooseFile}
                </button>
                {draft.imageUrl && (
                  <button type="button" className="ws-btn" onClick={() => { set("imageUrl", ""); set("imageAlt", ""); set("imageAltAr", ""); }} disabled={!canWrite}>
                    <Trash2 size={16} aria-hidden="true" /> {c.editor.removeImage}
                  </button>
                )}
              </div>
              <span className="ws-field__hint">{c.editor.imageHint}</span>
              {uploadError && <span className="ws-field__error" role="alert">{uploadError}</span>}
              <label className="ws-field">
                <span className="ws-field__hint">{c.editor.orPasteUrl}</span>
                <input className="ws-input" type="url" value={draft.imageUrl} onChange={event => set("imageUrl", event.target.value)} disabled={!canWrite} placeholder="https://…" />
              </label>
            </div>
            {draft.imageUrl && (
              <div className="adm__bilingual">
                <label className="ws-field"><span>{c.editor.imageAlt}</span><input className="ws-input" value={draft.imageAlt} onChange={event => set("imageAlt", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "imageAlt")} /><span className="ws-field__hint">{c.editor.imageAltHint}</span></label>
                <label className="ws-field" lang="ar" dir="rtl"><span>{c.editor.imageAltAr}</span><input className="ws-input" value={draft.imageAltAr} onChange={event => set("imageAltAr", event.target.value)} disabled={!canWrite} /></label>
              </div>
            )}

            <label className="ws-field">
              <span>{c.editor.cardSize}</span>
              <select className="ws-input" value={draft.cardSize} onChange={event => set("cardSize", event.target.value as EditorDraft["cardSize"])} disabled={!canWrite}>
                {cardSizes.map(value => <option key={value} value={value}>{c.sizes[value]}</option>)}
              </select>
            </label>
            <label className="ws-field"><span>{c.editor.goLiveAt}</span><input className="ws-input" type="datetime-local" value={draft.scheduledFor} onChange={event => set("scheduledFor", event.target.value)} disabled={!canWrite} /></label>
            <label className="ws-field"><span>{c.editor.expireAt}</span><input className="ws-input" type="datetime-local" value={draft.expiresAt} onChange={event => set("expiresAt", event.target.value)} disabled={!canWrite} aria-invalid={props.blockers.some(b => b.field === "expiresAt")} /></label>
            <label className="ws-field"><span>{c.editor.reviewBy}</span><input className="ws-input" type="datetime-local" value={draft.reviewBy} onChange={event => set("reviewBy", event.target.value)} disabled={!canWrite} /></label>
          </div>

          {props.blockers.length > 0 && (
            <div className="adm__gates" role="alert">
              <strong>{c.editor.cannotPublish}</strong>
              <ul>{props.blockers.map(blocker => <li key={blocker.field + blocker.message}>{blocker.message}</li>)}</ul>
            </div>
          )}
          {props.warnings.length > 0 && (
            <div className="adm__warns">
              <strong>{c.editor.worthChecking}</strong>
              <ul>{props.warnings.map(warning => <li key={warning.field + warning.message}>{warning.message}</li>)}</ul>
            </div>
          )}

          <div className="adm__savebar">
            <span className="adm__savebar-status">{c.editor.timezoneNote}</span>
            {canWrite && <button type="button" className="ws-btn ws-btn--primary" onClick={props.onSave} disabled={props.saving}><Save size={16} aria-hidden="true" /> {props.saving ? c.editor.saving : c.editor.saveDraft}</button>}
            {draft.id && <button type="button" className="ws-btn" onClick={props.onPreview}><Eye size={16} aria-hidden="true" /> {c.editor.previewAsEmployee}</button>}
            {draft.id && canWrite && draft.status === "draft" && <button type="button" className="ws-btn" onClick={() => props.onAction(draft.id!, "submit")}><Send size={16} aria-hidden="true" /> {c.editor.sendForReview}</button>}
            {draft.id && canPublish && <button type="button" className="ws-btn" onClick={() => props.onPublish(draft.id!)} disabled={props.blockers.length > 0}><UploadCloud size={16} aria-hidden="true" /> {c.editor.publishEllipsis}</button>}
          </div>
        </section>
      )}
    </>
  );
}
