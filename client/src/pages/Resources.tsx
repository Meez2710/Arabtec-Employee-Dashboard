import { useMemo, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { copy } from "@/lib/workspaceCopy";
import { AppShell } from "@/components/workspace/AppShell";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { EmptyState, Kicker, LoadingState } from "@/components/workspace/Primitives";
import { localiseItem, matchesQuery, type ResourceType, type WorkspaceItem } from "@/lib/workspaceContent";

const typeOrder: ResourceType[] = ["policy", "form", "handbook", "template", "contact"];

export default function Resources() {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const cardsQuery = trpc.workspace.listCards.useQuery(undefined, { retry: false });

  const items = useMemo<WorkspaceItem[]>(
    () => ((cardsQuery.data as WorkspaceItem[] | undefined) ?? []).filter(item => item.slot === "resource"),
    [cardsQuery.data],
  );
  const visible = useMemo(() => items.filter(item => matchesQuery(localiseItem(item, locale), query)), [items, locale, query]);

  /** Grouped by type so a policy never sits next to a phone number. */
  const grouped = useMemo(
    () => typeOrder
      .map(type => ({ type, entries: visible.filter(item => item.resourceType === type) }))
      .filter(group => group.entries.length > 0),
    [visible],
  );
  const ungrouped = useMemo(() => visible.filter(item => !item.resourceType), [visible]);

  return (
    <AppShell query={query} onQueryChange={setQuery}>
      <div className="ws-pagehead">
        <Kicker>{copy.workspace[locale]}</Kicker>
        <h1 className="ws-heading ws-heading--dot">{copy.pages.resourcesTitle[locale]}</h1>
        <p className="ws-lede">{copy.pages.resourcesLede[locale]}</p>
      </div>

      {cardsQuery.isLoading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <div className="ws-card"><EmptyState message={query ? copy.empty.search[locale] : copy.empty.default[locale]} /></div>
      ) : (
        <>
          {grouped.map(group => (
            <section className="ws-section" key={group.type} aria-label={copy.resourceType[group.type][locale]}>
              <Kicker>{copy.resourceType[group.type][locale]}</Kicker>
              <div className="ws-grid">
                {group.entries.map(item => <WorkspaceCard key={item.id} entries={[item]} />)}
              </div>
            </section>
          ))}
          {ungrouped.length > 0 && (
            <section className="ws-section" aria-label={copy.pages.resourcesTitle[locale]}>
              <div className="ws-grid">
                {ungrouped.map(item => <WorkspaceCard key={item.id} entries={[item]} />)}
              </div>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}
