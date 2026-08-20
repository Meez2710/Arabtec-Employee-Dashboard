import { AlertTriangle, Check } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/workspaceCopy";
import { Badge, Kicker } from "@/components/workspace/Primitives";
import { localiseItem, requiresAcknowledgement, severityOf, type WorkspaceItem } from "@/lib/workspaceContent";

type PriorityRailProps = {
  items: WorkspaceItem[];
  acknowledgedIds: number[];
  onAcknowledge?: (id: number) => void;
  acknowledging?: number | null;
  canAcknowledge: boolean;
};

/**
 * Renders only when something is genuinely actionable, so its presence is the
 * signal. If it is on screen, there is something to do.
 */
export function PriorityRail({ items, acknowledgedIds, onAcknowledge, acknowledging, canAcknowledge }: PriorityRailProps) {
  const { locale } = useLocale();
  if (items.length === 0) return null;

  return (
    <section className="ws-priority" aria-labelledby="ws-priority-heading">
      <Kicker>
        <span id="ws-priority-heading">{copy.home.needsYou[locale]}</span>
      </Kicker>
      {items.map(item => {
        const localised = localiseItem(item, locale);
        const severity = severityOf(item);
        const needsAck = requiresAcknowledgement(item);
        const done = acknowledgedIds.includes(item.id);
        return (
          <article className="ws-priority__item" key={item.id}>
            <div className="ws-priority__head">
              <AlertTriangle size={18} aria-hidden="true" color="var(--brand)" />
              <Badge tone={severity === "critical" ? "critical" : "important"}>{copy.severity[severity][locale]}</Badge>
              <h2 className="ws-priority__title">{localised.title}</h2>
            </div>
            <p className="ws-priority__body">{localised.body}</p>
            <div className="ws-priority__actions">
              <Link className="ws-btn" href={`/updates/${item.id}`}>{copy.actions.readMore[locale]}</Link>
              {needsAck && (done ? (
                <span className="ws-priority__done"><Check size={16} aria-hidden="true" />{copy.actions.acknowledged[locale]}</span>
              ) : canAcknowledge ? (
                <button
                  type="button"
                  className="ws-btn ws-btn--primary"
                  onClick={() => onAcknowledge?.(item.id)}
                  disabled={acknowledging === item.id}
                >
                  {copy.actions.acknowledge[locale]}
                </button>
              ) : null)}
            </div>
          </article>
        );
      })}
    </section>
  );
}
