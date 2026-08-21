import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { copy } from "@/lib/workspaceCopy";
import { AppShell } from "@/components/workspace/AppShell";
import { Badge, EmptyState, Kicker, LoadingState } from "@/components/workspace/Primitives";
import {
  formatDate, isExternal, localiseItem, requiresAcknowledgement, sectionLabel,
  severityOf, type WorkspaceItem,
} from "@/lib/workspaceContent";

/** The shared, linkable surface for one update. Long content lives here, not in a card. */
export default function UpdateDetail() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const [, params] = useRoute("/updates/:id");
  const id = Number(params?.id);

  const utils = trpc.useUtils();
  const cardsQuery = trpc.workspace.listCards.useQuery(undefined, { retry: false });
  const acknowledgedQuery = trpc.workspace.listAcknowledged.useQuery(undefined, { retry: false, enabled: Boolean(user) });
  const acknowledge = trpc.workspace.acknowledgeItem.useMutation();

  const item = useMemo<WorkspaceItem | undefined>(
    () => ((cardsQuery.data as WorkspaceItem[] | undefined) ?? []).find(entry => entry.id === id),
    [cardsQuery.data, id],
  );

  if (cardsQuery.isLoading) {
    return <AppShell><LoadingState /></AppShell>;
  }

  if (!item) {
    return (
      <AppShell>
        <Link href="/updates" className="ws-back"><ArrowLeft size={16} aria-hidden="true" />{copy.actions.backToUpdates[locale]}</Link>
        <div className="ws-card"><EmptyState message={copy.pages.updateNotFound[locale]} /></div>
      </AppShell>
    );
  }

  const localised = localiseItem(item, locale);
  const severity = severityOf(item);
  const needsAck = requiresAcknowledgement(item);
  const done = (acknowledgedQuery.data ?? []).includes(item.id);
  const external = isExternal(item.linkUrl);

  const onAcknowledge = async () => {
    try {
      await acknowledge.mutateAsync({ id: item.id });
      await utils.workspace.listAcknowledged.invalidate();
      toast.success(copy.actions.acknowledged[locale]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.states.error[locale]);
    }
  };

  return (
    <AppShell>
      <Link href="/updates" className="ws-back"><ArrowLeft size={16} aria-hidden="true" />{copy.actions.backToUpdates[locale]}</Link>

      <article className="ws-article">
        <Kicker>{sectionLabel(item.slot, locale)}</Kicker>
        {severity !== "normal" && <div><Badge tone={severity === "critical" ? "critical" : "important"}>{copy.severity[severity][locale]}</Badge></div>}
        <h1 className="ws-heading">{localised.title}</h1>
        <p className="ws-meta">
          {localised.eyebrow}
          {formatDate(item.publishedAt ?? item.createdAt, locale) ? ` · ${formatDate(item.publishedAt ?? item.createdAt, locale)}` : ""}
        </p>

        {localised.translationPending && locale === "ar" && (
          <p className="ws-meta">{copy.states.translationPending[locale]}</p>
        )}

        {item.imageUrl && (
          <img className="ws-card__media" src={item.imageUrl} alt={localised.imageAlt ?? ""} onError={event => { event.currentTarget.style.display = "none"; }} />
        )}

        <div className="ws-article__body">{localised.body}</div>

        {item.linkUrl && (
          <p>
            <a className="ws-linkish" href={item.linkUrl} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined}>
              {copy.actions.openLink[locale]}
              {external && <ExternalLink size={16} aria-hidden="true" />}
            </a>
            {external && <span className="ws-external"> {copy.states.externalLink[locale]}</span>}
          </p>
        )}

        {needsAck && (
          done ? (
            <p className="ws-priority__done"><Check size={16} aria-hidden="true" />{copy.actions.acknowledged[locale]}</p>
          ) : user ? (
            <div><button type="button" className="ws-btn ws-btn--primary" onClick={onAcknowledge} disabled={acknowledge.isPending}>{copy.actions.acknowledge[locale]}</button></div>
          ) : null
        )}
      </article>
    </AppShell>
  );
}
