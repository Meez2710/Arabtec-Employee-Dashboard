import { ArrowRight, ExternalLink } from "lucide-react";
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

export function WorkspaceCard({ item, showSection = false }: { item: WorkspaceItem; showSection?: boolean }) {
  const { locale } = useLocale();
  const localised = localiseItem(item, locale);
  const severity = severityOf(item);
  const external = isExternal(item.linkUrl);
  const hasMedia = Boolean(item.imageUrl);

  const body = (
    <>
      {hasMedia && (
        <img
          className="ws-card__media"
          src={item.imageUrl ?? ""}
          alt={localised.imageAlt ?? ""}
          loading="lazy"
          onError={event => { event.currentTarget.style.display = "none"; }}
        />
      )}
      <div className="ws-card__inner">
        <Kicker>{showSection ? sectionLabel(item.slot, locale) : localised.eyebrow}</Kicker>
        {severity !== "normal" && (
          <div style={{ marginBlockStart: "var(--space-3)" }}>
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

  return (
    <article className={`ws-card ws-card--flush ${sizeClass(item)}`}>
      {external ? (
        <a className="ws-card__link" href={item.linkUrl ?? "#"} target="_blank" rel="noreferrer noopener">{body}</a>
      ) : (
        <Link className="ws-card__link" href={`/updates/${item.id}`}>{body}</Link>
      )}
    </article>
  );
}
