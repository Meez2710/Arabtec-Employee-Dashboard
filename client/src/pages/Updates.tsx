import { useMemo, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { copy } from "@/lib/workspaceCopy";
import { AppShell } from "@/components/workspace/AppShell";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { EmptyState, Kicker, LoadingState } from "@/components/workspace/Primitives";
import { localiseItem, matchesQuery, sectionLabel, sortByRecency, type WorkspaceItem, type WorkspaceSlot } from "@/lib/workspaceContent";

/** Sections that have their own dedicated page and are not repeated here. */
const excluded: WorkspaceSlot[] = ["opportunity", "resource"];

export default function Updates() {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<WorkspaceSlot | "all">("all");

  const cardsQuery = trpc.workspace.listCards.useQuery(undefined, { retry: false });
  const items = useMemo<WorkspaceItem[]>(
    () => ((cardsQuery.data as WorkspaceItem[] | undefined) ?? []).filter(item => !excluded.includes(item.slot)).slice().sort(sortByRecency),
    [cardsQuery.data],
  );

  const availableSlots = useMemo(() => Array.from(new Set(items.map(item => item.slot))), [items]);
  const visible = useMemo(
    () => items.filter(item => (slot === "all" || item.slot === slot) && matchesQuery(localiseItem(item, locale), query)),
    [items, slot, locale, query],
  );

  return (
    <AppShell query={query} onQueryChange={setQuery}>
      <div className="ws-pagehead">
        <Kicker>{copy.workspace[locale]}</Kicker>
        <h1 className="ws-heading ws-heading--dot">{copy.pages.updatesTitle[locale]}</h1>
        <p className="ws-lede">{copy.pages.updatesLede[locale]}</p>
      </div>

      {availableSlots.length > 1 && (
        <div className="ws-filters" role="group" aria-label={locale === "ar" ? "تصفية حسب القسم" : "Filter by section"}>
          <button type="button" className={slot === "all" ? "ws-chip is-active" : "ws-chip"} onClick={() => setSlot("all")} aria-pressed={slot === "all"}>
            {locale === "ar" ? "الكل" : "All"}
          </button>
          {availableSlots.map(value => (
            <button key={value} type="button" className={slot === value ? "ws-chip is-active" : "ws-chip"} onClick={() => setSlot(value)} aria-pressed={slot === value}>
              {sectionLabel(value, locale)}
            </button>
          ))}
        </div>
      )}

      {cardsQuery.isLoading ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <div className="ws-card"><EmptyState message={query || slot !== "all" ? copy.empty.search[locale] : copy.empty.default[locale]} /></div>
      ) : (
        <div className="ws-grid">
          {visible.map(item => <WorkspaceCard key={item.id} item={item} showSection />)}
        </div>
      )}
    </AppShell>
  );
}
