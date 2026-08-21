import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Badge, EmptyState, Kicker } from "@/components/workspace/Primitives";
import { useLocale } from "@/contexts/LocaleContext";
import { consoleText } from "@/lib/consoleCopy";
import { formatCairoDate } from "@shared/workspaceTime";
import { cardSizes, slotLabel } from "./adminShared";
import type { CardSize, WorkspaceSlot } from "@/lib/workspaceContent";
import type { WorkspaceRole } from "@shared/workspaceCapabilities";


/* -------------------------------------------------------------------------- */

export type SectionRow = { slot: WorkspaceSlot; labelEn: string; labelAr: string; enabled: boolean; defaultSize: CardSize; sortOrder: number };

export function SectionsScreen({ rows, saving, onSave }: { rows: SectionRow[]; saving: boolean; onSave: (row: SectionRow) => void }) {
  const { locale } = useLocale();
  const c = consoleText(locale);
  const [working, setWorking] = useState<SectionRow[]>(rows);
  useEffect(() => { setWorking(rows); }, [rows]);
  const update = (slot: WorkspaceSlot, patch: Partial<SectionRow>) =>
    setWorking(current => current.map(row => (row.slot === slot ? { ...row, ...patch } : row)));

  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.sections.title}</h1>
          <p className="ws-lede">{c.sections.lede}</p>
        </div>
      </div>
      <section className="adm__panel">
        <div className="ws-tablewrap">
          <table className="ws-table">
            <caption className="sr-only">{c.sections.caption}</caption>
            <thead>
              <tr><th scope="col">{c.sections.section}</th><th scope="col">{c.sections.englishLabel}</th><th scope="col">{c.sections.arabicLabel}</th><th scope="col">{c.sections.defaultSize}</th><th scope="col">{c.sections.shownColumn}</th><th scope="col"><span className="sr-only">{c.sections.save}</span></th></tr>
            </thead>
            <tbody>
              {working.map(row => (
                <tr key={row.slot}>
                  <td data-label={c.sections.section}>{c.slots[row.slot as keyof typeof c.slots] ?? slotLabel(row.slot)}</td>
                  <td data-label={c.sections.englishLabel}><input className="ws-input" value={row.labelEn} onChange={event => update(row.slot, { labelEn: event.target.value })} aria-label={c.sections.englishLabelFor(row.slot)} /></td>
                  <td data-label={c.sections.arabicLabel}><input className="ws-input" lang="ar" dir="rtl" value={row.labelAr} onChange={event => update(row.slot, { labelAr: event.target.value })} aria-label={c.sections.arabicLabelFor(row.slot)} /></td>
                  <td data-label={c.sections.defaultSize}>
                    <select className="ws-input" value={row.defaultSize} onChange={event => update(row.slot, { defaultSize: event.target.value as CardSize })} aria-label={c.sections.defaultSizeFor(row.slot)}>
                      {cardSizes.map(size => <option key={size} value={size}>{c.sizes[size]}</option>)}
                    </select>
                  </td>
                  <td data-label={c.sections.shownColumn}>
                    <label className="ws-switch">
                      <input type="checkbox" checked={row.enabled} onChange={event => update(row.slot, { enabled: event.target.checked })} aria-label={c.sections.showOnHome(row.slot)} />
                      <span>{row.enabled ? c.sections.shown : c.sections.hidden}</span>
                    </label>
                  </td>
                  <td data-label={c.sections.save}><button type="button" className="ws-btn ws-btn--sm" onClick={() => onSave(row)} disabled={saving}><Save size={14} aria-hidden="true" /> {c.sections.save}</button></td>
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

const roleOrder: WorkspaceRole[] = ["user", "viewer", "editor", "publisher", "admin"];

export function PeopleScreen({ rows, currentUserId, saving, onSetRole }: { rows: PersonRow[]; currentUserId: number | null; saving: boolean; onSetRole: (userId: number, role: WorkspaceRole) => void }) {
  const { locale } = useLocale();
  const c = consoleText(locale);
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.people.title}</h1>
          <p className="ws-lede">{c.people.lede}</p>
        </div>
      </div>
      <section className="adm__panel">
        <div className="ws-tablewrap">
          <table className="ws-table">
            <caption className="sr-only">{c.people.caption}</caption>
            <thead><tr><th scope="col">{c.people.person}</th><th scope="col">{c.people.email}</th><th scope="col">{c.people.access}</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={3}><EmptyState message={c.people.empty} /></td></tr>
              ) : rows.map(person => (
                <tr key={person.id}>
                  <td data-label={c.people.person}>{person.name || "—"}</td>
                  <td data-label={c.people.email}>{person.email || "—"}</td>
                  <td data-label={c.people.access}>
                    {person.id === currentUserId ? (
                      <Badge>{c.roles[person.role as WorkspaceRole] ?? person.role} ({c.people.you})</Badge>
                    ) : (
                      <select className="ws-input" value={person.role} onChange={event => onSetRole(person.id, event.target.value as WorkspaceRole)} disabled={saving} aria-label={c.people.accessFor(String(person.name || person.email || person.id))}>
                        {roleOrder.map(value => <option key={value} value={value}>{c.roles[value]} — {c.people.roleDetail[value]}</option>)}
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
  const { locale } = useLocale();
  const c = consoleText(locale);
  const when = (value?: Date | null) => (value ? formatCairoDate(value, locale, { dateStyle: "medium", timeStyle: "short" }) : "—");
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.audit.title}</h1>
          <p className="ws-lede">{c.audit.lede}</p>
        </div>
      </div>
      <section className="adm__panel">
        <div className="ws-tablewrap">
          <table className="ws-table">
            <caption className="sr-only">{c.audit.caption}</caption>
            <thead><tr><th scope="col">{c.audit.when}</th><th scope="col">{c.audit.who}</th><th scope="col">{c.audit.action}</th><th scope="col">{c.audit.detail}</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4}><EmptyState message={c.audit.empty} /></td></tr>
              ) : rows.map(entry => (
                <tr key={entry.id}>
                  <td data-label={c.audit.when}>{when(entry.createdAt)}</td>
                  <td data-label={c.audit.who}>{entry.actorName || entry.actorEmail || entry.actorLabel || c.content.system}</td>
                  <td data-label={c.audit.action}><Badge>{entry.action.replace(/[._]/g, " ")}</Badge></td>
                  <td data-label={c.audit.detail}>{entry.summary ?? "—"}</td>
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
  const { locale } = useLocale();
  const c = consoleText(locale);
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.media.title}</h1>
          <p className="ws-lede">{c.media.lede}</p>
        </div>
      </div>
      <section className="adm__panel">
        {rows.length === 0 ? (
          <EmptyState message={c.media.empty} />
        ) : (
          <div className="ws-grid">
            {rows.map(row => (
              <article className="ws-card ws-card--flush" key={row.id}>
                <img className="ws-card__media" src={row.imageUrl} alt={row.imageAlt ?? ""} loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} />
                <div className="ws-card__inner">
                  <Kicker>{c.slots[row.slot as keyof typeof c.slots] ?? slotLabel(row.slot)}</Kicker>
                  <h3 className="ws-card__title">{row.title}</h3>
                  {row.imageAlt ? <p className="ws-card__dek">{row.imageAlt}</p> : <p style={{ marginBlockStart: "var(--space-3)" }}><Badge tone="critical">{c.media.noDescription}</Badge></p>}
                  <button type="button" className="ws-btn ws-btn--sm" style={{ marginBlockStart: "var(--space-4)" }} onClick={() => onOpenItem(row.id)}>{c.media.openItem}</button>
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
  const { locale } = useLocale();
  const c = consoleText(locale);
  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.settings.title}</h1>
          <p className="ws-lede">{c.settings.lede}</p>
        </div>
      </div>
      <section className="adm__panel" style={{ display: "grid", gap: "var(--space-5)" }}>
        <div className="ws-field">
          <span>{c.settings.timezone}</span>
          <input className="ws-input" value="Africa/Cairo" readOnly aria-describedby="tz-help" />
          <span className="ws-field__hint" id="tz-help">{c.settings.timezoneHelp}</span>
        </div>
        <div className="ws-field">
          <span>{c.settings.sender}</span>
          <input
            className="ws-input"
            value={reminder?.emailConfigured ? reminder.sender || c.settings.configuredSender : c.settings.notConfigured}
            readOnly
            aria-describedby="sender-help"
          />
          <span className="ws-field__hint" id="sender-help">
            {reminder?.emailConfigured ? c.settings.senderConfigured : c.settings.senderMissing}
          </span>
        </div>
      </section>
    </>
  );
}
