import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/workspaceCopy";
import { Badge, Kicker } from "@/components/workspace/Primitives";
import {
  formatDate, isExternal, localiseItem, sectionLabel, severityOf, sizeClass,
  type LocalisedItem, type WorkspaceItem,
} from "@/lib/workspaceContent";

/** Meta rows differ per section template; everything else about a card is shared. */
function TemplateMeta({ item, localised }: { item: WorkspaceItem; localised: LocalisedItem }) {
  const { locale } = useLocale();
  const rows: Array<{ label: string; value: string }> = [];
  const push = (label: string, value?: string | null) => { if (value) rows.push({ label, value }); };

  switch (item.slot) {
    case "new_joiner":
      push(copy.fields.department[locale], localised.functionArea);
      push(copy.fields.starts[locale], formatDate(item.eventStart, locale));
      break;
    case "week_ahead":
      push(copy.fields.date[locale], formatDate(item.eventStart, locale, { weekday: "long", day: "numeric", month: "long" }));
      push(copy.fields.location[locale], localised.location);
      break;
    case "activity":
      push(copy.fields.date[locale], formatDate(item.eventStart, locale, { dateStyle: "medium", timeStyle: "short" }));
      push(copy.fields.location[locale], localised.location);
      break;
    case "opportunity":
      push(copy.fields.location[locale], localised.location);
      push(copy.fields.function[locale], localised.functionArea);
      push(copy.fields.closes[locale], formatDate(item.closingDate, locale));
      break;
    case "industry_watch":
      push(copy.fields.source[locale], localised.sourceName);
      break;
    case "resource":
      push(copy.fields.type[locale], item.resourceType ? copy.resourceType[item.resourceType][locale] : null);
      push(copy.fields.owner[locale], localised.sourceName);
      push(copy.fields.updated[locale], formatDate(item.updatedAt, locale));
      break;
    case "company_news":
    case "announcement":
      push(copy.fields.published[locale], formatDate(item.publishedAt ?? item.createdAt, locale));
      break;
  }

  if (rows.length === 0) return null;
  return (
    <dl className="ws-card__meta">
      {rows.map(row => (
        <div key={`${row.label}-${row.value}`}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CardFace({ item, showSection }: { item: WorkspaceItem; showSection: boolean }) {
  const { locale } = useLocale();
  const localised = localiseItem(item, locale);
  const severity = severityOf(item);
  const external = isExternal(item.linkUrl);

  const face = (
    <>
      {item.imageUrl && (
        <img
          className="ws-card__media"
          src={item.imageUrl}
          alt={localised.imageAlt ?? ""}
          loading="lazy"
          onError={event => { event.currentTarget.style.display = "none"; }}
        />
      )}
      <div className="ws-card__inner">
        <Kicker>{showSection ? sectionLabel(item.slot, locale) : localised.eyebrow}</Kicker>
        {severity !== "normal" && (
          <div className="ws-card__badge">
            <Badge tone={severity === "critical" ? "critical" : "important"}>{copy.severity[severity][locale]}</Badge>
          </div>
        )}
        <h3 className="ws-card__title">{localised.title}</h3>
        <p className="ws-card__dek">{localised.body}</p>
        <TemplateMeta item={item} localised={localised} />
        <span className="ws-card__cta">
          {external ? copy.actions.openLink[locale] : copy.actions.readMore[locale]}
          {external ? <ExternalLink size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
        </span>
        {external && <span className="ws-external">{copy.states.externalLink[locale]}</span>}
      </div>
    </>
  );

  return external ? (
    <a className="ws-card__link" href={item.linkUrl ?? "#"} target="_blank" rel="noreferrer noopener">{face}</a>
  ) : (
    <Link className="ws-card__link" href={`/updates/${item.id}`}>{face}</Link>
  );
}

/**
 * One card. When a section has several published items the card holds all of
 * them and moves between them, rather than the grid silently showing only the
 * newest — which is what the previous build did.
 */
export function WorkspaceCard({ entries, showSection = false }: { entries: WorkspaceItem[]; showSection?: boolean }) {
  const { locale } = useLocale();
  const [index, setIndex] = useState(0);
  const total = entries.length;

  // A section can shrink between publishes; never point past the end.
  useEffect(() => { setIndex(current => (current >= total ? 0 : current)); }, [total]);

  if (total === 0) return null;
  const item = entries[Math.min(index, total - 1)];
  const move = (step: number) => setIndex(current => (current + step + total) % total);

  return (
    <article className={`ws-card ws-card--flush ${sizeClass(entries[0])}`}>
      {/* Keyed on the entry so React remounts it and the enter animation runs. */}
      <div className="ws-card__stack" key={item.id}>
        <CardFace item={item} showSection={showSection} />
      </div>

      {total > 1 && (
        <div className="ws-card__pager">
          <button type="button" className="ws-icon-btn ws-card__page-btn" onClick={() => move(-1)} aria-label={copy.actions.previous[locale]}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span className="ws-card__dots" aria-hidden="true">
            {entries.map((entry, dot) => (
              <span key={entry.id} className={dot === index ? "is-current" : undefined} />
            ))}
          </span>
          <span className="sr-only" aria-live="polite">{`${copy.counter.position[locale]} ${index + 1} / ${total}`}</span>
          <span className="ws-card__count" aria-hidden="true">{index + 1} / {total}</span>
          <button type="button" className="ws-icon-btn ws-card__page-btn" onClick={() => move(1)} aria-label={copy.actions.next[locale]}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}
