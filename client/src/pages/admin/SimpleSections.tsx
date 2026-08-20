import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Badge, EmptyState, Kicker } from "@/components/workspace/Primitives";
import { formatCairoDate } from "@shared/workspaceTime";
import { cardSizes, slotLabel } from "./adminShared";
import type { CardSize, WorkspaceSlot } from "@/lib/workspaceContent";
import type { WorkspaceRole } from "@shared/workspaceCapabilities";

const when = (value?: Date | null) => (value ? formatCairoDate(value, "en", { dateStyle: "medium", timeStyle: "short" }) : "—");

/* -------------------------------------------------------------------------- */

export type SectionRow = { slot: WorkspaceSlot; labelEn: string; labelAr: string; enabled: boolean; defaultSize: CardSize; sortOrder: number };

export function SectionsScreen({ rows, saving, onSave }: { rows: SectionRow[]; saving: boolean; onSave: (row: SectionRow) => void }) {
  const [working, setWorking] = useState<SectionRow[]>(rows);
  useEffect(() => { setWorking(rows); }, [rows]);
  const update = (slot: WorkspaceSlot, patch: Partial<SectionRow>) =>
    setWorking(current => current.map(row => (row.slot === slot ? { ...row, ...patch } : row)));

  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>Workspace console</Kicker>
          <h1 className="ws-heading ws-heading--dot">Sections</h1>
          <p className="ws-lede">Turn sections on or off and set the labels employees see in each language.</p>
        </div>
      </div>
      <section className="adm__panel">
        <div className="ws-tablewrap">
          <table className="ws-table">
            <caption className="sr-only">Employee home sections</caption>
            <thead>
              <tr><th scope="col">Section</th><th scope="col">English label</th><th scope="col">Arabic label</th><th scope="col">Default size</th><th scope="col">Shown</th><th scope="col"><span className="sr-only">Save</span></th></tr>
            </thead>
            <tbody>
              {working.map(row => (
                <tr key={row.slot}>
                  <td data-label="Section">{slotLabel(row.slot)}</td>
                  <td data-label="English label"><input className="ws-input" value={row.labelEn} onChange={event => update(row.slot, { labelEn: event.target.value })} aria-label={`English label for ${row.slot}`} /></td>
                  <td data-label="Arabic label"><input className="ws-input" lang="ar" dir="rtl" value={row.labelAr} onChange={event => update(row.slot, { labelAr: event.target.value })} aria-label={`Arabic label for ${row.slot}`} /></td>
                  <td data-label="Default size">
                    <select className="ws-input" value={row.defaultSize} onChange={event => update(row.slot, { defaultSize: event.target.value as CardSize })} aria-label={`Default size for ${row.slot}`}>
                      {cardSizes.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </td>
                  <td data-label="Shown">
                    <label className="ws-switch">
                      <input type="checkbox" checked={row.enabled} onChange={event => update(row.slot, { enabled: event.target.checked })} aria-label={`Show ${row.slot} on the employee home`} />
                      <span>{row.enabled ? "Shown" : "Hidden"}</span>
                    </label>
                  </td>
                  <td data-label="Save"><button type="button" className="ws-btn ws-btn--sm" onClick={() => onSave(row)} disabled={saving}><Save size={14} aria-hidden="true" /> Save</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export type PersonRow = { id: number; name: string | null; email: string | null; role: string };

const roleOptions: Array<{ value: WorkspaceRole; label: string; detail: string }> = [
  { value: "user", label: "Employee", detail: "No console access" },
  { value: "viewer", label: "Viewer", detail: "Can read the console" },
  { value: "editor", label: "Editor", detail: "Can write content, cannot publish" },
  { value: "publisher", label: "Publisher", detail: "Can write and publish" },
  { value: "admin", label: "Administrator", detail: "Everything, including access" },
];

export function PeopleScreen({ rows, currentUserId, saving, onSetRole }: { rows: PersonRow[]; currentUserId: number | null; saving: boolean; onSetRole: (userId: number, role: WorkspaceRole) => void }) {
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>Workspace console</Kicker>
          <h1 className="ws-heading ws-heading--dot">People &amp; access</h1>
          <p className="ws-lede">Publishing is restricted by role. You cannot change your own access.</p>
        </div>
      </div>
      <section className="adm__panel">
        <div className="ws-tablewrap">
          <table className="ws-table">
            <caption className="sr-only">Accounts and their Workspace access</caption>
            <thead><tr><th scope="col">Person</th><th scope="col">Email</th><th scope="col">Access</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={3}><EmptyState message="No accounts yet." /></td></tr>
              ) : rows.map(person => (
                <tr key={person.id}>
                  <td data-label="Person">{person.name || "—"}</td>
                  <td data-label="Email">{person.email || "—"}</td>
                  <td data-label="Access">
                    {person.id === currentUserId ? (
                      <Badge>{person.role} (you)</Badge>
                    ) : (
                      <select className="ws-input" value={person.role} onChange={event => onSetRole(person.id, event.target.value as WorkspaceRole)} disabled={saving} aria-label={`Access level for ${person.name || person.email || person.id}`}>
                        {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label} — {option.detail}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export type AuditRow = { id: number; entity: string; entityId: number | null; action: string; actorName: string | null; actorEmail: string | null; actorLabel: string | null; summary: string | null; createdAt: Date };

export function AuditScreen({ rows }: { rows: AuditRow[] }) {
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>Workspace console</Kicker>
          <h1 className="ws-heading ws-heading--dot">Audit log</h1>
          <p className="ws-lede">Every publish-grade action, most recent first. Times are Africa/Cairo.</p>
        </div>
      </div>
      <section className="adm__panel">
        <div className="ws-tablewrap">
          <table className="ws-table">
            <caption className="sr-only">Workspace audit log</caption>
            <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Action</th><th scope="col">Detail</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4}><EmptyState message="No recorded actions yet." /></td></tr>
              ) : rows.map(entry => (
                <tr key={entry.id}>
                  <td data-label="When">{when(entry.createdAt)}</td>
                  <td data-label="Who">{entry.actorName || entry.actorEmail || entry.actorLabel || "System"}</td>
                  <td data-label="Action"><Badge>{entry.action.replace(/[._]/g, " ")}</Badge></td>
                  <td data-label="Detail">{entry.summary ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export type MediaRow = { id: number; title: string; imageUrl: string; imageAlt: string | null; slot: string };

export function MediaScreen({ rows, onOpenItem }: { rows: MediaRow[]; onOpenItem: (id: number) => void }) {
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>Workspace console</Kicker>
          <h1 className="ws-heading ws-heading--dot">Media</h1>
          <p className="ws-lede">Every image in use, and whether it has a description. Images without one cannot be published.</p>
        </div>
      </div>
      <section className="adm__panel">
        {rows.length === 0 ? (
          <EmptyState message="No images in use yet." />
        ) : (
          <div className="ws-grid">
            {rows.map(row => (
              <article className="ws-card ws-card--flush" key={row.id}>
                <img className="ws-card__media" src={row.imageUrl} alt={row.imageAlt ?? ""} loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} />
                <div className="ws-card__inner">
                  <Kicker>{slotLabel(row.slot)}</Kicker>
                  <h3 className="ws-card__title">{row.title}</h3>
                  {row.imageAlt ? <p className="ws-card__dek">{row.imageAlt}</p> : <p style={{ marginBlockStart: "var(--space-3)" }}><Badge tone="critical">No description</Badge></p>}
                  <button type="button" className="ws-btn ws-btn--sm" style={{ marginBlockStart: "var(--space-4)" }} onClick={() => onOpenItem(row.id)}>Open item</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export function SettingsScreen({ reminder }: { reminder: { emailConfigured: boolean; sender: string | null } | undefined }) {
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>Workspace console</Kicker>
          <h1 className="ws-heading ws-heading--dot">Settings</h1>
          <p className="ws-lede">Workspace-wide configuration.</p>
        </div>
      </div>
      <section className="adm__panel" style={{ display: "grid", gap: "var(--space-5)" }}>
        <div className="ws-field">
          <span>Business timezone</span>
          <input className="ws-input" value="Africa/Cairo" readOnly aria-describedby="tz-help" />
          <span className="ws-field__hint" id="tz-help">Every &ldquo;today&rdquo;, &ldquo;this week&rdquo;, overdue, and expiry decision is made in Cairo, whatever timezone the reader is in.</span>
        </div>
        <div className="ws-field">
          <span>Review reminder sender</span>
          <input
            className="ws-input"
            value={reminder?.emailConfigured ? reminder.sender || "Configured sender" : "Not configured"}
            readOnly
            aria-describedby="sender-help"
          />
          <span className="ws-field__hint" id="sender-help">
            {reminder?.emailConfigured
              ? "Owners receive one email per overdue review."
              : "Overdue reviews are flagged on the Overview. Email delivery stays off until an approved sender is provisioned."}
          </span>
        </div>
      </section>
    </>
  );
}
