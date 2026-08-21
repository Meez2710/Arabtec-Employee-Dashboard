import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { Languages, Monitor, ShieldCheck, Smartphone, Tablet, X } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import Home, { type WorkspaceEmployeePreviewItem } from "@/pages/Home";
import { Kicker, LoadingState } from "@/components/workspace/Primitives";
import { consoleText } from "@/lib/consoleCopy";
import { evaluatePublishReadiness } from "@shared/publishReadiness";
import type { WorkspaceRole } from "@shared/workspaceCapabilities";
import { AdminShell } from "./admin/AdminShell";
import { Overview } from "./admin/Overview";
import { ContentDesk, type ManagedItem } from "./admin/ContentDesk";
import { LayoutComposer, type LayoutRow } from "./admin/LayoutComposer";
import { AuditScreen, MediaScreen, PeopleScreen, SectionsScreen, SettingsScreen, type SectionRow } from "./admin/SimpleSections";
import { blankDraft, fromDateInput, slotLabel, toDateInput, type ConsoleSection, type EditorDraft, type Status } from "./admin/adminShared";
import { formatCairoDate } from "@shared/workspaceTime";
import type { CardSize, ResourceType, Severity, WorkspaceSlot } from "@/lib/workspaceContent";

type PreviewWidth = "desktop" | "tablet" | "mobile";

export default function ManageWorkspace() {
  const { user, loading } = useAuth();
  const { locale, setLocale } = useLocale();
  const [, params] = useRoute("/admin/:section");
  const section = (params?.section ?? "overview") as ConsoleSection;
  const c = consoleText(locale);

  const utils = trpc.useUtils();
  const capabilitiesQuery = trpc.workspace.getCapabilities.useQuery();
  const capabilities = capabilitiesQuery.data?.capabilities ?? [];
  const can = (capability: string) => capabilities.includes(capability as never);
  const hasConsole = can("console.view");

  const overviewQuery = trpc.workspace.getOverview.useQuery(undefined, { enabled: hasConsole });
  const itemsQuery = trpc.workspace.listManagedItems.useQuery(undefined, { enabled: hasConsole });
  const ownersQuery = trpc.workspace.listOwners.useQuery(undefined, { enabled: hasConsole });
  const sectionsQuery = trpc.workspace.listSections.useQuery();
  const reminderQuery = trpc.workspace.getReminderConfiguration.useQuery(undefined, { enabled: hasConsole });
  const auditQuery = trpc.workspace.listAuditLog.useQuery(undefined, { enabled: can("audit.view") });

  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [publishTarget, setPublishTarget] = useState<ManagedItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");
  const [previewRows, setPreviewRows] = useState<LayoutRow[] | null>(null);

  const historyQuery = trpc.workspace.getItemHistory.useQuery({ id: draft?.id ?? 0 }, { enabled: hasConsole && Boolean(draft?.id) });

  const save = trpc.workspace.saveItem.useMutation();
  const publish = trpc.workspace.publishItem.useMutation();
  const unpublish = trpc.workspace.unpublishItem.useMutation();
  const archive = trpc.workspace.archiveItem.useMutation();
  const restore = trpc.workspace.restoreItem.useMutation();
  const duplicate = trpc.workspace.duplicateItem.useMutation();
  const submit = trpc.workspace.submitItemForReview.useMutation();
  const bulk = trpc.workspace.bulkAction.useMutation();
  const saveLayout = trpc.workspace.saveLayout.useMutation();
  const saveSection = trpc.workspace.saveSection.useMutation();
  const setRole = trpc.workspace.setUserRole.useMutation();
  const uploadImage = trpc.workspace.uploadImage.useMutation();

  /** Reads the file in the browser and hands the bytes to the storage mutation. */
  const onUploadImage = async (file: File): Promise<string> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("The file could not be read."));
      reader.readAsDataURL(file);
    });
    const stored = await uploadImage.mutateAsync({
      filename: file.name,
      mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
      base64,
    });
    return stored.url;
  };

  const items = (itemsQuery.data ?? []) as unknown as ManagedItem[];
  const rawItems = itemsQuery.data ?? [];

  const refresh = async () => {
    await Promise.all([
      utils.workspace.listManagedItems.invalidate(),
      utils.workspace.listCards.invalidate(),
      utils.workspace.getOverview.invalidate(),
      utils.workspace.listAuditLog.invalidate(),
    ]);
  };

  const toDraft = (item: (typeof rawItems)[number]): EditorDraft => ({
    id: item.id,
    slot: item.slot as WorkspaceSlot,
    eyebrow: item.eyebrow, title: item.title, body: item.body,
    eyebrowAr: item.eyebrowAr ?? "", titleAr: item.titleAr ?? "", bodyAr: item.bodyAr ?? "",
    linkUrl: item.linkUrl ?? "", imageUrl: item.imageUrl ?? "",
    imageAlt: item.imageAlt ?? "", imageAltAr: item.imageAltAr ?? "",
    imageMode: item.imageMode,
    cardSize: item.cardSize as CardSize,
    severity: item.severity as Severity,
    requiresAck: item.requiresAck === 1,
    eventStart: toDateInput(item.eventStart), eventEnd: toDateInput(item.eventEnd),
    location: item.location ?? "", locationAr: item.locationAr ?? "",
    functionArea: item.functionArea ?? "", functionAreaAr: item.functionAreaAr ?? "",
    closingDate: toDateInput(item.closingDate),
    sourceName: item.sourceName ?? "", sourceNameAr: item.sourceNameAr ?? "",
    resourceType: (item.resourceType as ResourceType | null) ?? "",
    sortOrder: item.sortOrder, status: item.status as Status,
    scheduledFor: toDateInput(item.scheduledFor), expiresAt: toDateInput(item.expiresAt),
    reviewBy: toDateInput(item.reviewBy), ownerUserId: item.ownerUserId,
  });

  const openItem = (id: number) => {
    const item = rawItems.find(entry => entry.id === id);
    if (item) setDraft(toDraft(item));
    if (section !== "content") window.history.pushState(null, "", "/admin/content");
  };

  const readiness = useMemo(() => {
    if (!draft) return { blockers: [], warnings: [] };
    return evaluatePublishReadiness({
      slot: draft.slot,
      title: draft.title,
      body: draft.body,
      titleAr: draft.titleAr,
      bodyAr: draft.bodyAr,
      imageUrl: draft.imageUrl || null,
      imageAlt: draft.imageAlt || null,
      eventStart: fromDateInput(draft.eventStart),
      location: draft.location || null,
      functionArea: draft.functionArea || null,
      closingDate: fromDateInput(draft.closingDate),
      sourceName: draft.sourceName || null,
      resourceType: draft.resourceType || null,
      scheduledFor: fromDateInput(draft.scheduledFor),
      expiresAt: fromDateInput(draft.expiresAt),
    });
  }, [draft]);

  const runAction = async (label: string, execute: () => Promise<unknown>) => {
    try {
      await execute();
      await refresh();
      toast.success(label);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c.toasts.actionFailed);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.eyebrow.trim() || !draft.title.trim()) { toast.error(c.toasts.needLabelTitle); return; }
    try {
      const saved = await save.mutateAsync({
        id: draft.id, slot: draft.slot, eyebrow: draft.eyebrow, title: draft.title, body: draft.body,
        eyebrowAr: draft.eyebrowAr || null, titleAr: draft.titleAr || null, bodyAr: draft.bodyAr || null,
        linkUrl: draft.linkUrl || null, imageUrl: draft.imageUrl || null,
        imageAlt: draft.imageAlt || null, imageAltAr: draft.imageAltAr || null,
        imageMode: draft.imageMode, cardSize: draft.cardSize, severity: draft.severity,
        requiresAck: draft.requiresAck,
        eventStart: fromDateInput(draft.eventStart), eventEnd: fromDateInput(draft.eventEnd),
        location: draft.location || null, locationAr: draft.locationAr || null,
        functionArea: draft.functionArea || null, functionAreaAr: draft.functionAreaAr || null,
        closingDate: fromDateInput(draft.closingDate),
        sourceName: draft.sourceName || null, sourceNameAr: draft.sourceNameAr || null,
        resourceType: draft.resourceType || null,
        sortOrder: draft.sortOrder, active: false, status: draft.status,
        scheduledFor: fromDateInput(draft.scheduledFor), expiresAt: fromDateInput(draft.expiresAt),
        reviewBy: fromDateInput(draft.reviewBy), ownerUserId: draft.ownerUserId,
      });
      if (!saved) throw new Error(c.toasts.saveFailed);
      await refresh();
      const fresh = (await utils.workspace.listManagedItems.fetch()).find(entry => entry.id === saved.id);
      if (fresh) setDraft(toDraft(fresh));
      toast.success(c.toasts.draftSaved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c.toasts.saveFailed);
    }
  };

  /** Preview always renders the real employee page, never a mock of it. */
  const previewItems = useMemo<WorkspaceEmployeePreviewItem[]>(() => {
    const layoutById = new Map((previewRows ?? []).map((row, index) => [row.id, { cardSize: row.cardSize, sortOrder: index }]));
    const published = rawItems
      .filter(item => item.status === "published" && item.id !== draft?.id)
      .map(item => ({ ...item, ...(layoutById.get(item.id) ?? {}) }));
    if (!draft?.title.trim()) return published as unknown as WorkspaceEmployeePreviewItem[];
    const preview = {
      ...draft,
      id: draft.id ?? -1,
      eyebrow: draft.eyebrow || c.preview.previewKicker,
      requiresAck: draft.requiresAck ? 1 : 0,
      eventStart: fromDateInput(draft.eventStart),
      closingDate: fromDateInput(draft.closingDate),
      linkUrl: draft.linkUrl || null, imageUrl: draft.imageUrl || null,
      imageAlt: draft.imageAlt || null, imageAltAr: draft.imageAltAr || null,
      titleAr: draft.titleAr || null, bodyAr: draft.bodyAr || null, eyebrowAr: draft.eyebrowAr || null,
      resourceType: draft.resourceType || null,
      location: draft.location || null, locationAr: draft.locationAr || null,
      functionArea: draft.functionArea || null, functionAreaAr: draft.functionAreaAr || null,
      sourceName: draft.sourceName || null, sourceNameAr: draft.sourceNameAr || null,
      createdAt: new Date(), publishedAt: new Date(), updatedAt: new Date(),
    };
    return [...published, preview] as unknown as WorkspaceEmployeePreviewItem[];
  }, [rawItems, draft, previewRows]);

  const layoutRows = useMemo<LayoutRow[]>(
    () => rawItems
      .filter(item => item.status === "published" || item.status === "scheduled")
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(item => ({ id: item.id, title: item.title, slot: item.slot, cardSize: item.cardSize as CardSize })),
    [rawItems],
  );

  const mediaRows = useMemo(
    () => rawItems.filter(item => Boolean(item.imageUrl)).map(item => ({ id: item.id, title: item.title, imageUrl: item.imageUrl as string, imageAlt: item.imageAlt, slot: item.slot })),
    [rawItems],
  );

  const sectionRows = useMemo<SectionRow[]>(
    () => (sectionsQuery.data ?? []).map(row => ({ ...row, slot: row.slot as WorkspaceSlot, defaultSize: row.defaultSize as CardSize })),
    [sectionsQuery.data],
  );

  const attentionCount = useMemo(() => {
    const attention = overviewQuery.data?.needsAttention;
    if (!attention) return 0;
    return attention.reviewOverdue.length + attention.goingLiveToday.length + attention.expiringThisWeek.length
      + attention.expiredStillLive.length + attention.missingArabic.length + attention.missingImageAlt.length;
  }, [overviewQuery.data]);

  useEffect(() => { setSelectedIds([]); }, [section]);

  if (loading || capabilitiesQuery.isLoading) return <main className="adm__login"><LoadingState /></main>;
  if (!user) return <AccessPanel title={c.access.signInTitle} detail={c.access.signInDetail} signInLabel={c.access.signIn} kicker={c.brand} action />;
  if (!hasConsole) return <AccessPanel title={c.access.deniedTitle} detail={c.access.deniedDetail(user.role)} signInLabel={c.access.signIn} kicker={c.brand} />;

  return (
    <>
      <AdminShell section={section} capabilities={capabilities} user={user} attentionCount={attentionCount}>
        {section === "overview" && (overviewQuery.data
          ? <Overview data={overviewQuery.data as never} onOpenItem={openItem} />
          : <LoadingState />)}

        {section === "content" && (
          <ContentDesk
            items={items}
            loading={itemsQuery.isLoading}
            draft={draft}
            owners={ownersQuery.data ?? []}
            history={historyQuery.data ?? []}
            blockers={readiness.blockers}
            warnings={readiness.warnings}
            canWrite={can("content.write")}
            canPublish={can("content.publish")}
            saving={save.isPending}
            selectedIds={selectedIds}
            onSelectItem={openItem}
            onToggleSelect={id => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])}
            onDraftChange={setDraft}
            onNew={() => setDraft(blankDraft())}
            onSave={saveDraft}
            onPublish={id => { const item = items.find(entry => entry.id === id); if (item) setPublishTarget(item); }}
            onAction={(id, action) => {
              const label = { unpublish: c.toasts.unpublished, archive: c.toasts.archived, restore: c.toasts.restored, duplicate: c.toasts.duplicated, submit: c.toasts.submitted }[action];
              const run = { unpublish, archive, restore, duplicate, submit }[action];
              if (action === "archive" && !window.confirm(c.confirm.archiveItem)) return;
              void runAction(label, () => run.mutateAsync({ id }));
            }}
            onBulk={action => {
              if (!window.confirm(c.confirm.bulk(action, selectedIds.length))) return;
              void runAction(c.toasts.bulkApplied, async () => { await bulk.mutateAsync({ ids: selectedIds, action }); setSelectedIds([]); });
            }}
            onPreview={() => { setPreviewRows(null); setPreviewOpen(true); }}
            onUploadImage={onUploadImage}
          />
        )}

        {section === "layout" && (
          <LayoutComposer
            rows={layoutRows}
            saving={saveLayout.isPending}
            onSave={rows => void runAction(c.toasts.layoutSaved, () => saveLayout.mutateAsync({ items: rows.map((row, index) => ({ id: row.id, sortOrder: index, cardSize: row.cardSize })) }))}
            renderPreview={rows => (
              <button type="button" className="ws-btn ws-btn--block" onClick={() => { setPreviewRows(rows); setPreviewOpen(true); }}>
                Preview as employee
              </button>
            )}
          />
        )}

        {section === "media" && <MediaScreen rows={mediaRows} onOpenItem={openItem} />}
        {section === "sections" && <SectionsScreen rows={sectionRows} saving={saveSection.isPending} onSave={row => void runAction(c.toasts.sectionSaved, async () => { await saveSection.mutateAsync(row); await utils.workspace.listSections.invalidate(); })} />}
        {section === "people" && <PeopleScreen rows={ownersQuery.data ?? []} currentUserId={user.id} saving={setRole.isPending} onSetRole={(userId, role) => void runAction(c.toasts.accessUpdated, async () => { await setRole.mutateAsync({ userId, role: role as WorkspaceRole }); await utils.workspace.listOwners.invalidate(); })} />}
        {section === "audit" && <AuditScreen rows={(auditQuery.data ?? []) as never} />}
        {section === "settings" && <SettingsScreen reminder={reminderQuery.data} />}
      </AdminShell>

      {publishTarget && (
        <PublishConfirmation
          item={publishTarget}
          onCancel={() => setPublishTarget(null)}
          onConfirm={() => void runAction(
            publishTarget.scheduledFor && new Date(publishTarget.scheduledFor) > new Date() ? c.toasts.scheduled : c.toasts.published,
            async () => { await publish.mutateAsync({ id: publishTarget.id, confirmed: true }); setPublishTarget(null); },
          )}
          busy={publish.isPending}
        />
      )}

      {previewOpen && (
        <section className="adm__preview-layer" role="dialog" aria-modal="true" aria-label={c.preview.label} lang={locale}>
          <div className="adm__preview-bar">
            <div>
              <strong>{c.preview.label}</strong>
              <span className="ws-meta"> {c.preview.note}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <button type="button" className={`ws-btn ws-btn--sm${previewWidth === "desktop" ? " is-active" : ""}`} onClick={() => setPreviewWidth("desktop")}><Monitor size={14} aria-hidden="true" /> {c.preview.desktop}</button>
              <button type="button" className={`ws-btn ws-btn--sm${previewWidth === "tablet" ? " is-active" : ""}`} onClick={() => setPreviewWidth("tablet")}><Tablet size={14} aria-hidden="true" /> {c.preview.tablet}</button>
              <button type="button" className={`ws-btn ws-btn--sm${previewWidth === "mobile" ? " is-active" : ""}`} onClick={() => setPreviewWidth("mobile")}><Smartphone size={14} aria-hidden="true" /> {c.preview.mobile}</button>
              <button type="button" className="ws-btn ws-btn--sm" onClick={() => setLocale(locale === "en" ? "ar" : "en")}><Languages size={14} aria-hidden="true" /> {locale === "en" ? c.preview.viewInArabic : c.preview.viewInEnglish}</button>
              <button type="button" className="ws-btn ws-btn--sm" onClick={() => setPreviewOpen(false)}><X size={14} aria-hidden="true" /> {c.preview.close}</button>
            </div>
          </div>
          <div className="adm__preview-frame" data-width={previewWidth}>
            <Home previewItems={previewItems} />
          </div>
        </section>
      )}
    </>
  );
}

function PublishConfirmation({ item, onCancel, onConfirm, busy }: { item: ManagedItem; onCancel: () => void; onConfirm: () => void; busy: boolean }) {
  const { locale } = useLocale();
  const c = consoleText(locale);
  const scheduled = Boolean(item.scheduledFor && new Date(item.scheduledFor) > new Date());
  const when = (value?: Date | null) => (value ? formatCairoDate(value, locale, { dateStyle: "medium", timeStyle: "short" }) : c.confirm.notSet);
  const missingArabic = !item.titleAr?.trim() || !item.bodyAr?.trim();
  const cairo = locale === "ar" ? "بتوقيت القاهرة" : "Cairo";
  return (
    <div className="ws-scrim" role="dialog" aria-modal="true" aria-labelledby="publish-confirmation-title">
      <div className="ws-modal">
        <Kicker>{c.confirm.kicker}</Kicker>
        <h2 id="publish-confirmation-title">{scheduled ? c.confirm.readySchedule(item.title) : c.confirm.readyPublish(item.title)}</h2>
        <p className="ws-lede">{c.confirm.lede}</p>
        <dl>
          <div><dt>{c.confirm.audience}</dt><dd>{c.confirm.allEmployees}</dd></div>
          <div><dt>{c.confirm.section}</dt><dd>{c.slots[item.slot as keyof typeof c.slots] ?? slotLabel(item.slot)}</dd></div>
          <div><dt>{c.confirm.goLive}</dt><dd>{scheduled ? `${when(item.scheduledFor)} (${cairo})` : c.confirm.immediately}</dd></div>
          <div><dt>{c.confirm.expires}</dt><dd>{when(item.expiresAt)}</dd></div>
          <div><dt>{c.confirm.owner}</dt><dd>{item.ownerName || item.ownerEmail || c.confirm.ownerYou}</dd></div>
        </dl>
        {missingArabic && <p className="ws-modal__warn">{c.confirm.missingArabic}</p>}
        <div className="ws-modal__actions">
          <button type="button" className="ws-btn" onClick={onCancel}>{c.confirm.keepEditing}</button>
          <button type="button" className="ws-btn ws-btn--primary" onClick={onConfirm} disabled={busy}>
            {busy ? c.confirm.confirming : scheduled ? c.confirm.confirmSchedule : c.confirm.confirmPublish}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccessPanel({ title, detail, kicker, signInLabel, action = false }: { title: string; detail: string; kicker: string; signInLabel: string; action?: boolean }) {
  return (
    <main className="adm__login">
      <section className="adm__login-panel">
        <ShieldCheck size={32} aria-hidden="true" color="var(--brand)" />
        <Kicker>{kicker}</Kicker>
        <h1>{title}</h1>
        <p>{detail}</p>
        {action && <button type="button" onClick={() => startLogin()} className="ws-btn ws-btn--primary">{signInLabel}</button>}
      </section>
    </main>
  );
}
