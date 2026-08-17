/**
 * Arabtec Workspace design reminder:
 * Public employees never see editing controls. This separate, role-gated route lets an Admin change dashboard copy, add external destinations, upload images, or request an Open Graph image from an HTTPS source link.
 */
import { useEffect, useMemo, useState } from "react";
import { ImageUp, Link2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const slots = ["new_joiner", "company_news", "announcement", "activity", "industry_watch", "opportunity"] as const;
type Slot = typeof slots[number];
type Draft = { slot: Slot; eyebrow: string; title: string; body: string; linkUrl: string; imageUrl: string; imageMode: "none" | "upload" | "link_preview"; sortOrder: number; active: boolean };
const blankDraft: Draft = { slot: "new_joiner", eyebrow: "New to Arabtec", title: "New colleague", body: "Add a concise welcome message.", linkUrl: "", imageUrl: "", imageMode: "none", sortOrder: 0, active: true };

export default function ManageWorkspace() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const { data: cards } = trpc.workspace.listCards.useQuery();
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [initialized, setInitialized] = useState(false);
  const save = trpc.workspace.saveCard.useMutation();
  const upload = trpc.workspace.uploadImage.useMutation();
  const current = useMemo(() => cards?.find(card => card.slot === draft.slot), [cards, draft.slot]);

  useEffect(() => {
    if (initialized || !cards?.length) return;
    const card = cards.find(item => item.slot === draft.slot) ?? cards[0];
    if (!card) return;
    setDraft({ slot: card.slot, eyebrow: card.eyebrow, title: card.title, body: card.body, linkUrl: card.linkUrl ?? "", imageUrl: card.imageUrl ?? "", imageMode: card.imageMode, sortOrder: card.sortOrder, active: card.active === 1 });
    setInitialized(true);
  }, [cards, draft.slot, initialized]);

  const selectSlot = (slot: Slot) => {
    const card = cards?.find(item => item.slot === slot);
    setDraft(card ? { slot, eyebrow: card.eyebrow, title: card.title, body: card.body, linkUrl: card.linkUrl ?? "", imageUrl: card.imageUrl ?? "", imageMode: card.imageMode, sortOrder: card.sortOrder, active: card.active === 1 } : { ...blankDraft, slot });
  };
  const uploadImage = async (file: File) => {
    if (!(["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type) || file.size > 5_000_000) { toast.error("Use a JPG, PNG, or WebP image under 5 MB."); return; }
    const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
    try { const result = await upload.mutateAsync({ filename: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 }); setDraft(value => ({ ...value, imageUrl: result.url, imageMode: "upload" })); toast.success("Image uploaded"); } catch { toast.error("The image could not be uploaded."); }
  };
  const submit = async () => { try { await save.mutateAsync({ ...draft, linkUrl: draft.linkUrl || null, imageUrl: draft.imageUrl || null }); await utils.workspace.listCards.invalidate(); toast.success("Workspace card saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "The card could not be saved."); } };

  if (loading) return <main className="manage-page"><p>Loading Workspace management…</p></main>;
  if (!user) return <main className="manage-page"><section className="manage-login"><ShieldCheck className="text-signal" /><p className="dash-eyebrow">Workspace administration</p><h1>Sign in to manage employee content.</h1><p>Only the project owner or an Admin can change cards, external links, and images.</p><button onClick={() => startLogin()} className="dash-red-button">Sign in</button></section></main>;
  if (user.role !== "admin") return <main className="manage-page"><section className="manage-login"><ShieldCheck className="text-signal" /><h1>Administrator access is required.</h1><p>Your current role is {user.role}. Ask a Workspace Admin to publish content changes.</p></section></main>;

  return <main className="manage-page"><section className="manage-shell"><header><p className="dash-eyebrow">Workspace content manager</p><h1>Manage dashboard cards.</h1><p>Each public card can have its own copy, external destination, and media source.</p></header><div className="manage-grid"><aside><p className="dash-eyebrow">Select a card</p>{slots.map(slot => <button type="button" onClick={() => selectSlot(slot)} className={draft.slot === slot ? "is-active" : ""} key={slot}>{slot.replace(/_/g, " ")}</button>)}</aside><section className="manage-form"><label>Eyebrow<input value={draft.eyebrow} onChange={event => setDraft(value => ({ ...value, eyebrow: event.target.value }))} /></label><label>Title<input value={draft.title} onChange={event => setDraft(value => ({ ...value, title: event.target.value }))} /></label><label>Text<textarea value={draft.body} onChange={event => setDraft(value => ({ ...value, body: event.target.value }))} /></label><label>External destination URL<input type="url" placeholder="https://…" value={draft.linkUrl} onChange={event => setDraft(value => ({ ...value, linkUrl: event.target.value, imageMode: event.target.value ? "link_preview" : value.imageMode, imageUrl: event.target.value ? "" : value.imageUrl }))} /></label><p className="manage-helper">A secure HTTPS link automatically uses its Open Graph preview image when saved. You may replace it with an upload.</p><div className="manage-media-choice"><button type="button" onClick={() => setDraft(value => ({ ...value, imageMode: "link_preview", imageUrl: "" }))} className={draft.imageMode === "link_preview" ? "is-active" : ""}><Link2 size={16} /> Use link preview image</button><label className={draft.imageMode === "upload" ? "is-active" : ""}><ImageUp size={16} /> Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => event.target.files?.[0] && uploadImage(event.target.files[0])} /></label></div>{draft.imageUrl && <img className="manage-image-preview" src={draft.imageUrl} alt="Selected dashboard card media" />}<label className="manage-checkbox"><input type="checkbox" checked={draft.active} onChange={event => setDraft(value => ({ ...value, active: event.target.checked }))} /> Show this card publicly</label><button type="button" onClick={submit} disabled={save.isPending || upload.isPending} className="dash-red-button"><Save size={16} /> {save.isPending ? "Saving…" : "Save card"}</button></section><aside className="manage-preview"><p className="dash-eyebrow">Live field summary</p><h2>{current?.title || draft.title}</h2><p>{current?.body || draft.body}</p><span>{draft.linkUrl ? "External destination included" : "No external destination"}</span></aside></div></section></main>;
}
