import { AlertTriangle, CalendarClock, Clock, ImageOff, Languages, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { Kicker } from "@/components/workspace/Primitives";
import { useLocale } from "@/contexts/LocaleContext";
import { consoleText } from "@/lib/consoleCopy";
import { formatCairoDate } from "@shared/workspaceTime";

type Item = { id: number; title: string; slot: string; scheduledFor?: Date | null; expiresAt?: Date | null; reviewBy?: Date | null };

export type OverviewData = {
  counts: { published: number; scheduled: number; drafts: number; inReview: number; archived: number };
  needsAttention: {
    reviewOverdue: Item[];
    goingLiveToday: Item[];
    expiringThisWeek: Item[];
    expiredStillLive: Item[];
    missingArabic: Item[];
    missingImageAlt: Item[];
  };
  lastPublishedAt: Date | null;
};

function Group({ title, icon, items, note, onOpen }: { title: string; icon: ReactNode; items: Item[]; note: (item: Item) => string; onOpen: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <section className="adm__attention-group">
      <h3>{icon}{title} <span className="ws-badge">{items.length}</span></h3>
      <div className="adm__attention-list">
        {items.map(item => (
          <button type="button" key={item.id} onClick={() => onOpen(item.id)}>
            <span>{item.title}</span>
            <em>{note(item)}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Overview({ data, onOpenItem }: { data: OverviewData; onOpenItem: (id: number) => void }) {
  const { locale } = useLocale();
  const c = consoleText(locale);
  const when = (value?: Date | null) => (value ? formatCairoDate(value, locale, { dateStyle: "medium", timeStyle: "short" }) : "");
  const attention = data.needsAttention;
  const total =
    attention.reviewOverdue.length + attention.goingLiveToday.length + attention.expiringThisWeek.length +
    attention.expiredStillLive.length + attention.missingArabic.length + attention.missingImageAlt.length;

  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>{c.brand}</Kicker>
          <h1 className="ws-heading ws-heading--dot">{c.overview.title}</h1>
          <p className="ws-lede">{total === 0 ? c.overview.allClear : c.overview.needsAttention(total)}</p>
        </div>
        {data.lastPublishedAt && <p className="ws-meta">{c.overview.lastPublished(when(data.lastPublishedAt))}</p>}
      </div>

      <div className="adm__kpis">
        <div className="adm__kpi"><strong>{data.counts.published}</strong><span>{c.overview.kpi.live}</span></div>
        <div className="adm__kpi"><strong>{data.counts.scheduled}</strong><span>{c.overview.kpi.scheduled}</span></div>
        <div className="adm__kpi"><strong>{data.counts.inReview}</strong><span>{c.overview.kpi.inReview}</span></div>
        <div className="adm__kpi"><strong>{data.counts.drafts}</strong><span>{c.overview.kpi.drafts}</span></div>
        <div className="adm__kpi"><strong>{data.counts.archived}</strong><span>{c.overview.kpi.archived}</span></div>
      </div>

      <div className="adm__attention">
        <Group title={c.overview.groups.expiredStillLive} icon={<AlertTriangle size={18} aria-hidden="true" />} items={attention.expiredStillLive} note={item => c.overview.notes.expiredOn(when(item.expiresAt))} onOpen={onOpenItem} />
        <Group title={c.overview.groups.reviewOverdue} icon={<Clock size={18} aria-hidden="true" />} items={attention.reviewOverdue} note={item => c.overview.notes.dueOn(when(item.reviewBy))} onOpen={onOpenItem} />
        <Group title={c.overview.groups.goingLiveToday} icon={<CalendarClock size={18} aria-hidden="true" />} items={attention.goingLiveToday} note={item => when(item.scheduledFor)} onOpen={onOpenItem} />
        <Group title={c.overview.groups.expiringThisWeek} icon={<Timer size={18} aria-hidden="true" />} items={attention.expiringThisWeek} note={item => when(item.expiresAt)} onOpen={onOpenItem} />
        <Group title={c.overview.groups.missingArabic} icon={<Languages size={18} aria-hidden="true" />} items={attention.missingArabic} note={() => c.overview.notes.arabicFallback} onOpen={onOpenItem} />
        <Group title={c.overview.groups.missingImageAlt} icon={<ImageOff size={18} aria-hidden="true" />} items={attention.missingImageAlt} note={() => c.overview.notes.altRequired} onOpen={onOpenItem} />
        {total === 0 && (
          <section className="adm__attention-group">
            <p className="ws-meta">{c.overview.willAppearHere}</p>
          </section>
        )}
      </div>
    </>
  );
}
