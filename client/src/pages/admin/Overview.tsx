import { AlertTriangle, CalendarClock, Clock, ImageOff, Languages, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { Kicker } from "@/components/workspace/Primitives";
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

const when = (value?: Date | null) => (value ? formatCairoDate(value, "en", { dateStyle: "medium", timeStyle: "short" }) : "");

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
  const attention = data.needsAttention;
  const total =
    attention.reviewOverdue.length + attention.goingLiveToday.length + attention.expiringThisWeek.length +
    attention.expiredStillLive.length + attention.missingArabic.length + attention.missingImageAlt.length;

  return (
    <>
      <div className="adm__head">
        <div>
          <Kicker>Workspace console</Kicker>
          <h1 className="ws-heading ws-heading--dot">Overview</h1>
          <p className="ws-lede">
            {total === 0
              ? "Nothing needs attention right now."
              : `${total} item${total === 1 ? "" : "s"} need attention.`}
          </p>
        </div>
        {data.lastPublishedAt && <p className="ws-meta">Last published {when(data.lastPublishedAt)} (Cairo)</p>}
      </div>

      <div className="adm__kpis">
        <div className="adm__kpi"><strong>{data.counts.published}</strong><span>Live</span></div>
        <div className="adm__kpi"><strong>{data.counts.scheduled}</strong><span>Scheduled</span></div>
        <div className="adm__kpi"><strong>{data.counts.inReview}</strong><span>In review</span></div>
        <div className="adm__kpi"><strong>{data.counts.drafts}</strong><span>Drafts</span></div>
        <div className="adm__kpi"><strong>{data.counts.archived}</strong><span>Archived</span></div>
      </div>

      <div className="adm__attention">
        <Group title="Expired but still live" icon={<AlertTriangle size={18} aria-hidden="true" />} items={attention.expiredStillLive} note={item => `Expired ${when(item.expiresAt)}`} onOpen={onOpenItem} />
        <Group title="Review overdue" icon={<Clock size={18} aria-hidden="true" />} items={attention.reviewOverdue} note={item => `Due ${when(item.reviewBy)}`} onOpen={onOpenItem} />
        <Group title="Going live today" icon={<CalendarClock size={18} aria-hidden="true" />} items={attention.goingLiveToday} note={item => when(item.scheduledFor)} onOpen={onOpenItem} />
        <Group title="Expiring this week" icon={<Timer size={18} aria-hidden="true" />} items={attention.expiringThisWeek} note={item => when(item.expiresAt)} onOpen={onOpenItem} />
        <Group title="Missing Arabic" icon={<Languages size={18} aria-hidden="true" />} items={attention.missingArabic} note={() => "Arabic readers see English"} onOpen={onOpenItem} />
        <Group title="Image without a description" icon={<ImageOff size={18} aria-hidden="true" />} items={attention.missingImageAlt} note={() => "Alt text required"} onOpen={onOpenItem} />
        {total === 0 && (
          <section className="adm__attention-group">
            <p className="ws-meta">Overdue reviews, scheduled releases, expiring items, and missing Arabic will appear here.</p>
          </section>
        )}
      </div>
    </>
  );
}
