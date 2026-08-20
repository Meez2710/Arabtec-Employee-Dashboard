import { useLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/workspaceCopy";
import { EmptyState, Kicker } from "@/components/workspace/Primitives";
import { formatDate, localiseItem, toDate, type WorkspaceItem } from "@/lib/workspaceContent";
import { cairoDateKey } from "@shared/workspaceTime";

/**
 * The week ahead as a scannable timeline rather than a paragraph.
 * "Today" is resolved in Africa/Cairo, not the viewer's device timezone.
 */
export function WeekStrip({ items }: { items: WorkspaceItem[] }) {
  const { locale } = useLocale();
  const todayKey = cairoDateKey();

  const dated = items
    .map(item => ({ item, date: toDate(item.eventStart) }))
    .filter((entry): entry is { item: WorkspaceItem; date: Date } => entry.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <section className="ws-section" aria-labelledby="ws-week-heading">
      <Kicker><span id="ws-week-heading">{copy.home.thisWeek[locale]}</span></Kicker>
      <div className="ws-card">
        {dated.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="ws-week">
            {dated.map(({ item, date }) => {
              const localised = localiseItem(item, locale);
              const isToday = cairoDateKey(date) === todayKey;
              return (
                <div className={isToday ? "ws-week__row is-today" : "ws-week__row"} key={item.id}>
                  <span className="ws-week__day">
                    {isToday ? copy.home.today[locale] : formatDate(date, locale, { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span>
                    <span className="ws-week__title">{localised.title}</span>
                    {item.location ? <span className="ws-week__where"> · {item.location}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
