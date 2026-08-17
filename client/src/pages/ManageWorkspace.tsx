/**
 * Arabtec Workspace design reminder:
 * Public employees receive simple hover disclosures; only this isolated, role-gated page exposes the scalable content controls behind them.
 */
import { useEffect, useMemo, useState } from "react";
import { ImageUp, Link2, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const slots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity"] as const;
type Slot = typeof slots[number];
type ImageMode = "none" | "upload" | "link_preview";
type Draft = { slot: Slot; eyebrow: string; title: string; body: string; linkUrl: string; imageUrl: string; imageMode: ImageMode; sortOrder: number; active: boolean };
type HoverDraft = { id?: number; parentSlot: Slot; eyebrow: string; title: string; body: string; linkUrl: string; imageUrl: string; imageMode: ImageMode; sortOrder: number; active: boolean };
const blankDraft: Draft = { slot: "new_joiner", eyebrow: "New to Arabtec", title: "New colleague", body: "Add a concise welcome message.", linkUrl: "", imageUrl: "", imageMode: "none", sortOrder: 0, active: true };
const blankHoverDraft = (parentSlot: Slot, sortOrder = 0): HoverDraft => ({ parentSlot, eyebrow: parentSlot === "new_joiner" ? "Department" : "Hover detail", title: parentSlot === "new_joiner" ? "Job title" : "New hover card", body: "Add image, text, or an external link for this hover disclosure.", linkUrl: "", imageUrl: "", imageMode: "none", sortOrder, active: true });

export default function ManageWorkspace() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const { data: cards } = trpc.workspace.listCards.useQuery();
  const { data: hoverCards } = trpc.workspace.listHoverCards.useQuery();
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [hoverDraft, setHoverDraft] = useState<HoverDraft | null>(null);
  const [initialized, setInitialized] = useState(false);
  const save = trpc.workspace.saveCard.useMutation();
  const saveHover = trpc.workspace.saveHoverCard.useMutation();
  const deleteHover = trpc.workspace.deleteHoverCard.useMutation();
  const upload = trpc.workspace.uploadImage.useMutation();
  const current = useMemo(() => cards?.find(card => card.slot === draft.slot), [cards, draft.slot]);
  const currentHoverCards = useMemo(() => hoverCards?.filter(card => card.parentSlot === draft.slot) ?? [], [hoverCards, draft.slot]);

  const toDraft = (card: NonNullable<typeof cards>[number]): Draft => ({ slot: card.slot, eyebrow: card.eyebrow, title: card.title, body: card.body, linkUrl: card.linkUrl ?? "", imageUrl: card.imageUrl ?? "", imageMode: card.imageMode, sortOrder: card.sortOrder, active: card.active === 1 });
  const toHoverDraft = (card: NonNullable<typeof hoverCards>[number]): HoverDraft => ({ id: card.id, parentSlot: card.parentSlot, eyebrow: card.eyebrow, title: card.title, body: card.body, linkUrl: card.linkUrl ?? "", imageUrl: card.imageUrl ?? "", imageMode: card.imageMode, sortOrder: card.sortOrder, active: card.active === 1 });

  useEffect(() => {
    if (initialized || !cards?.length) return;
    const card = cards.find(item => item.slot === draft.slot) ?? cards[0];
    if (!card) return;
    setDraft(toDraft(card));
    setInitialized(true);
  }, [cards, draft.slot, initialized]);

  const selectSlot = (slot: Slot) => {
    const card = cards?.find(item => item.slot === slot);
    setDraft(card ? toDraft(card) : { ...blankDraft, slot });
    setHoverDraft(null);
  };
  const uploadImage = async (file: File, target: "card" | "hover") => {
    if (!( ["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type) || file.size > 5_000_000) { toast.error("Use a JPG, PNG, or WebP image under 5 MB."); return; }
    const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    try {
      const result = await upload.mutateAsync({ filename: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 });
      if (target === "card") setDraft(value => ({ ...value, imageUrl: result.url, imageMode: "upload" }));
      else setHoverDraft(value => value ? { ...value, imageUrl: result.url, imageMode: "upload" } : value);
      toast.success("Image uploaded");
    } catch { toast.error("The image could not be uploaded."); }
  };
  const saveCard = async () => { try { await save.mutateAsync({ ...draft, linkUrl: draft.linkUrl || null, imageUrl: draft.imageUrl || null }); await utils.workspace.listCards.invalidate(); toast.success("Dashboard card saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "The card could not be saved."); } };
  const saveHoverCard = async () => {
    if (!hoverDraft) return;
    try { await saveHover.mutateAsync({ ...hoverDraft, linkUrl: hoverDraft.linkUrl || null, imageUrl: hoverDraft.imageUrl || null }); await utils.workspace.listHoverCards.invalidate(); setHoverDraft(null); toast.success("Hover card saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "The hover card could not be saved."); }
  };
  const removeHoverCard = async (id: number) => { try { await deleteHover.mutateAsync({ id }); await utils.workspace.listHoverCards.invalidate(); setHoverDraft(null); toast.success("Hover card removed"); } catch { toast.error("The hover card could not be removed."); } };

  if (loading) return <main className="manage-page"><p>Loading Workspace management…</p></main>;
  if (!user) return <LoginState title="Sign in to manage employee content." detail="Only the project owner or an Admin can change dashboard cards, external links, and media." action />;
  if (user.role !== "admin") return <LoginState title="Administrator access is required." detail={`Your current role is ${user.role}. Ask a Workspace Admin to publish content changes.`} />;

  return <main className="manage-page"><section className="manage-shell"><header><p className="dash-eyebrow">Workspace content manager</p><h1>Manage dashboard and hover cards.</h1><p>Each section has one core card plus any number of compact hover cards. Every hover card can hold its own image, copy, and destination.</p></header><div className="manage-grid"><aside><p className="dash-eyebrow">Select a section</p>{slots.map(slot => <button type="button" onClick={() => selectSlot(slot)} className={draft.slot === slot ? "is-active" : ""} key={slot}>{slot.replace(/_/g, " ")}</button>)}</aside><section className="manage-form"><h2>Primary card</h2><CardFields draft={draft} onChange={setDraft} onUpload={file => uploadImage(file, "card")} />{draft.imageUrl && <img className="manage-image-preview" src={draft.imageUrl} alt="Selected dashboard card media" />}<button type="button" onClick={saveCard} disabled={save.isPending || upload.isPending} className="dash-red-button"><Save size={16} /> {save.isPending ? "Saving…" : "Save primary card"}</button><div className="manage-hover-heading"><div><p className="dash-eyebrow">Hover cards</p><h2>Additional details on hover.</h2></div><button type="button" onClick={() => setHoverDraft(blankHoverDraft(draft.slot, currentHoverCards.length))} className="manage-add-hover"><Plus size={16} /> Add hover card</button></div><div className="manage-hover-grid">{currentHoverCards.map(card => <button type="button" key={card.id} onClick={() => setHoverDraft(toHoverDraft(card))} className="manage-hover-tile">{card.imageUrl ? <img src={card.imageUrl} alt="" /> : <span className="manage-hover-tile-icon"><Link2 size={16} /></span>}<strong>{card.title}</strong><small>{card.eyebrow}</small></button>)}<button type="button" onClick={() => setHoverDraft(blankHoverDraft(draft.slot, currentHoverCards.length))} className="manage-hover-tile manage-hover-tile--add"><Plus size={22} /><strong>Add an empty square</strong><small>Image, text, or link</small></button></div>{hoverDraft && <section className="manage-hover-editor"><div className="manage-hover-editor-head"><div><p className="dash-eyebrow">Hover card editor</p><h3>{hoverDraft.id ? "Edit hover card" : "New hover card"}</h3></div>{hoverDraft.id && <button type="button" onClick={() => removeHoverCard(hoverDraft.id!)} className="manage-delete"><Trash2 size={15} /> Delete</button>}</div><HoverCardFields draft={hoverDraft} onChange={next => setHoverDraft(previous => { if (!previous) return previous; return typeof next === "function" ? next(previous) : next; })} onUpload={file => uploadImage(file, "hover")} />{hoverDraft.imageUrl && <img className="manage-image-preview" src={hoverDraft.imageUrl} alt="Selected hover card media" />}<div className="manage-hover-actions"><button type="button" onClick={() => setHoverDraft(null)} className="manage-cancel">Cancel</button><button type="button" onClick={saveHoverCard} disabled={saveHover.isPending || upload.isPending} className="dash-red-button"><Save size={16} /> Save hover card</button></div></section>}</section><aside className="manage-preview"><p className="dash-eyebrow">Live field summary</p><h2>{current?.title || draft.title}</h2><p>{current?.body || draft.body}</p><span>{draft.linkUrl ? "External destination included" : "No external destination"}</span><p className="manage-preview-count">{currentHoverCards.length} hover card{currentHoverCards.length === 1 ? "" : "s"} in this section</p></aside></div></section></main>;
}

function CardFields({ draft, onChange, onUpload }: { draft: Draft; onChange: (next: Draft | ((previous: Draft) => Draft)) => void; onUpload: (file: File) => void }) {
  return <><label>Eyebrow<input value={draft.eyebrow} onChange={event => onChange(value => ({ ...value, eyebrow: event.target.value }))} /></label><label>Title<input value={draft.title} onChange={event => onChange(value => ({ ...value, title: event.target.value }))} /></label><label>Text<textarea value={draft.body} onChange={event => onChange(value => ({ ...value, body: event.target.value }))} /></label><label>External destination URL<input type="url" placeholder="https://…" value={draft.linkUrl} onChange={event => onChange(value => ({ ...value, linkUrl: event.target.value, imageMode: event.target.value ? "link_preview" : value.imageMode, imageUrl: event.target.value ? "" : value.imageUrl }))} /></label><p className="manage-helper">A secure HTTPS link automatically uses its Open Graph preview image when saved. You may replace it with an upload.</p><div className="manage-media-choice"><button type="button" onClick={() => onChange(value => ({ ...value, imageMode: "link_preview", imageUrl: "" }))} className={draft.imageMode === "link_preview" ? "is-active" : ""}><Link2 size={16} /> Use link preview image</button><label className={draft.imageMode === "upload" ? "is-active" : ""}><ImageUp size={16} /> Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => event.target.files?.[0] && onUpload(event.target.files[0])} /></label></div><label className="manage-checkbox"><input type="checkbox" checked={draft.active} onChange={event => onChange(value => ({ ...value, active: event.target.checked }))} /> Show this card publicly</label></>;
}

function HoverCardFields({ draft, onChange, onUpload }: { draft: HoverDraft; onChange: (next: HoverDraft | ((previous: HoverDraft) => HoverDraft)) => void; onUpload: (file: File) => void }) {
  return <><label>Department or label<input value={draft.eyebrow} onChange={event => onChange(value => ({ ...value, eyebrow: event.target.value }))} /></label><label>Job title or hover heading<input value={draft.title} onChange={event => onChange(value => ({ ...value, title: event.target.value }))} /></label><label>Hover text<textarea value={draft.body} onChange={event => onChange(value => ({ ...value, body: event.target.value }))} /></label><label>External destination URL<input type="url" placeholder="https://…" value={draft.linkUrl} onChange={event => onChange(value => ({ ...value, linkUrl: event.target.value, imageMode: event.target.value ? "link_preview" : value.imageMode, imageUrl: event.target.value ? "" : value.imageUrl }))} /></label><p className="manage-helper">Add an HTTPS link for its preview image, or upload your own image for this hover card.</p><div className="manage-media-choice"><button type="button" onClick={() => onChange(value => ({ ...value, imageMode: "link_preview", imageUrl: "" }))} className={draft.imageMode === "link_preview" ? "is-active" : ""}><Link2 size={16} /> Use link preview image</button><label className={draft.imageMode === "upload" ? "is-active" : ""}><ImageUp size={16} /> Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => event.target.files?.[0] && onUpload(event.target.files[0])} /></label></div><label className="manage-checkbox"><input type="checkbox" checked={draft.active} onChange={event => onChange(value => ({ ...value, active: event.target.checked }))} /> Show this hover card publicly</label></>;
}

function LoginState({ title, detail, action = false }: { title: string; detail: string; action?: boolean }) { return <main className="manage-page"><section className="manage-login"><ShieldCheck className="text-signal" /><p className="dash-eyebrow">Workspace administration</p><h1>{title}</h1><p>{detail}</p>{action && <button onClick={() => startLogin()} className="dash-red-button">Sign in</button>}</section></main>; }
