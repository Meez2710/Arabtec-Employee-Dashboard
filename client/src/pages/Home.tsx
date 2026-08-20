/** Arabtec Workspace daily briefing. All employee-facing content is database driven. */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { copy } from "@/lib/workspaceCopy";
import { AppShell } from "@/components/workspace/AppShell";
import { PriorityRail } from "@/components/workspace/PriorityRail";
import { WeekStrip } from "@/components/workspace/WeekStrip";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { EmptyState, Kicker, LoadingState } from "@/components/workspace/Primitives";
import {
  formatCairoGreeting, isActionable, localiseItem, matchesQuery, sectionLabel,
  sortByLayout, type WorkspaceItem, type WorkspaceSlot,
} from "@/lib/workspaceContent";

export type WorkspaceEmployeePreviewItem = WorkspaceItem;

/** Sections that get their own dedicated surface rather than a Home card. */
const ownSurface: WorkspaceSlot[] = ["week_ahead"];

export default function Home({ previewItems }: { previewItems?: WorkspaceEmployeePreviewItem[] }) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isPreview = previewItems !== undefined;
  const [query, setQuery] = useState("");

  const utils = trpc.useUtils();
  const cardsQuery = trpc.workspace.listCards.useQuery(undefined, { retry: false, enabled: !isPreview });
  const sectionsQuery = trpc.workspace.listSections.useQuery(undefined, { retry: false });
  const acknowledgedQuery = trpc.workspace.listAcknowledged.useQuery(undefined, { retry: false, enabled: Boolean(user) && !isPreview });
  const acknowledge = trpc.workspace.acknowledgeItem.useMutation();

  const items = useMemo<WorkspaceItem[]>(
    () => (previewItems ?? (cardsQuery.data as WorkspaceItem[] | undefined) ?? []).slice().sort(sortByLayout),
    [previewItems, cardsQuery.data],
  );

  const visible = useMemo(
    () => items.filter(item => matchesQuery(localiseItem(item, locale), query)),
    [items, locale, query],
  );

  const priority = useMemo(() => visible.filter(isActionable), [visible]);
  const weekItems = useMemo(() => visible.filter(item => item.slot === "week_ahead"), [visible]);
  const gridItems = useMemo(
    () => visible.filter(item => !ownSurface.includes(item.slot) && !priority.includes(item)),
    [visible, priority],
  );

  const enabledSections = useMemo(
    () => new Set((sectionsQuery.data ?? []).filter(section => section.enabled).map(section => section.slot)),
    [sectionsQuery.data],
  );
  const gridBySection = useMemo(
    () => (enabledSections.size === 0 ? gridItems : gridItems.filter(item => enabledSections.has(item.slot))),
    [gridItems, enabledSections],
  );

  const acknowledgedIds = acknowledgedQuery.data ?? [];
  const greeting = formatCairoGreeting(locale);

  const onAcknowledge = async (id: number) => {
    try {
      await acknowledge.mutateAsync({ id });
      await utils.workspace.listAcknowledged.invalidate();
      toast.success(copy.actions.acknowledged[locale]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.states.error[locale]);
    }
  };

  const loading = !isPreview && cardsQuery.isLoading;

  return (
    <AppShell query={query} onQueryChange={setQuery} embedded={isPreview}>
      <div className="ws-pagehead">
        <div className="ws-greet">
          <Kicker>{copy.home.briefing[locale]}</Kicker>
          <h1 className="ws-heading ws-heading--display ws-heading--dot">{greeting.greeting}</h1>
          <p className="ws-meta">{greeting.dateLabel}</p>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <PriorityRail
            items={priority}
            acknowledgedIds={acknowledgedIds}
            onAcknowledge={onAcknowledge}
            acknowledging={acknowledge.isPending ? acknowledge.variables?.id ?? null : null}
            canAcknowledge={Boolean(user) && !isPreview}
          />

          {/* With nothing published at all, the page says so exactly once.
              Sections only appear when there is something to put in them. */}
          {visible.length === 0 ? (
            <div className="ws-card">
              <EmptyState message={query ? copy.empty.search[locale] : copy.empty.default[locale]} />
            </div>
          ) : (
            <>
              {priority.length === 0 && !query && (
                <p className="ws-lede" style={{ marginBlockEnd: "var(--space-6)" }}>{copy.home.nothingToday[locale]}</p>
              )}

              {weekItems.length > 0 && <WeekStrip items={weekItems} />}

              {gridBySection.length > 0 && (
                <section className="ws-section" aria-label={sectionLabel("company_news", locale)}>
                  <div className="ws-grid">
                    {gridBySection.map(item => <WorkspaceCard key={item.id} item={item} showSection />)}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
