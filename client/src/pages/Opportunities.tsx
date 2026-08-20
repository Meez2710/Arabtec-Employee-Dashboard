import { useMemo, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { copy } from "@/lib/workspaceCopy";
import { AppShell } from "@/components/workspace/AppShell";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { EmptyState, Kicker, LoadingState } from "@/components/workspace/Primitives";
import { localiseItem, matchesQuery, toDate, type WorkspaceItem } from "@/lib/workspaceContent";

export default function Opportunities() {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const cardsQuery = trpc.workspace.listCards.useQuery(undefined, { retry: false });

  const items = useMemo<WorkspaceItem[]>(() => {
    const all = ((cardsQuery.data as WorkspaceItem[] | undefined) ?? []).filter(item => item.slot === "opportunity");
    // Soonest closing date first; anything undated sits after the dated roles.
    return all.slice().sort((a, b) => {
      const left = toDate(a.closingDate)?.getTime() ?? Number.POSITIVE_INFINITY;
      const right = toDate(b.closingDate)?.getTime() ?? Number.POSITIVE_INFINITY;
      return left - right;
    });
  }, [cardsQuery.data]);

  const visible = useMemo(() => items.filter(item => matchesQuery(localiseItem(item, locale), query)), [items, locale, query]);

  return (
    <AppShell query={query} onQueryChange={setQuery}>
      <div className="ws-pagehead">
        <Kicker>{copy.workspace[locale]}</Kicker>
        <h1 className="ws-heading ws-heading--dot">{copy.pages.opportunitiesTitle[locale]}</h1>
        <p className="ws-lede">{copy.pages.opportunitiesLede[locale]}</p>
      </div>

      {cardsQuery.isLoading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <div className="ws-card"><EmptyState message={query ? copy.empty.search[locale] : copy.empty.default[locale]} /></div>
      ) : (
        <div className="ws-grid">
          {visible.map(item => <WorkspaceCard key={item.id} entries={[item]} />)}
        </div>
      )}
    </AppShell>
  );
}
