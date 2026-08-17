/**
 * Arabtec Console design reminder:
 * Editing content should feel like reviewing a physical briefing sheet: explicit audiences, sturdy rules, and no ambiguous publish controls.
 */
import { CheckCircle2, CircleAlert, FilePlus2, Send, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DigestAudience, DigestFormState, DigestStatus } from "./types";

type DigestEditorProps = {
  form: DigestFormState;
  canPublish: boolean;
  pending: boolean;
  onChange: (next: DigestFormState) => void;
  onSave: () => void;
  onSubmitForReview: () => void;
  onPublish: () => void;
};

const statusCopy: Record<DigestStatus, { label: string; tone: string }> = {
  draft: { label: "Draft · editor working copy", tone: "bg-ink text-white" },
  in_review: { label: "In review · admin decision required", tone: "bg-caution text-ink" },
  approved: { label: "Approved", tone: "bg-ready text-white" },
  published: { label: "Published", tone: "bg-ready text-white" },
};

const audiences: Array<{ value: DigestAudience; label: string }> = [
  { value: "employees", label: "Employees" },
  { value: "owners", label: "Prep owners" },
  { value: "joiners", label: "Incoming joiners" },
];

export function DigestEditor({ form, canPublish, pending, onChange, onSave, onSubmitForReview, onPublish }: DigestEditorProps) {
  const update = <K extends keyof DigestFormState>(key: K, value: DigestFormState[K]) => onChange({ ...form, [key]: value });
  const updateEntry = (index: number, key: keyof DigestFormState["entries"][number], value: string | number) => {
    const entries = form.entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry);
    onChange({ ...form, entries });
  };
  const addEntry = () => {
    if (form.entries.length >= 8) return;
    onChange({
      ...form,
      entries: [...form.entries, { category: "People Ops", headline: "New digest item", summary: "Add the practical message employees need to act on.", audience: "employees", sortOrder: form.entries.length }],
    });
  };
  const removeEntry = (index: number) => {
    if (form.entries.length === 1) return;
    onChange({ ...form, entries: form.entries.filter((_, entryIndex) => entryIndex !== index).map((entry, entryIndex) => ({ ...entry, sortOrder: entryIndex })) });
  };

  const status = statusCopy[form.status];
  return (
    <section className="border-2 border-ink bg-white" aria-labelledby="digest-editor-title">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink bg-[#eef0f1] p-5 sm:p-6">
        <div>
          <p className="briefing-kicker">Daily digest · content review</p>
          <h2 id="digest-editor-title" className="mt-2 font-display text-3xl font-bold tracking-[-0.065em]">Edit the release sheet.</h2>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${status.tone}`}><CircleAlert size={14} aria-hidden="true" /> {status.label}</span>
      </header>

      <div className="grid gap-6 p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_160px_170px]">
          <Field label="Digest title"><Input value={form.title} maxLength={140} onChange={event => update("title", event.target.value)} className="briefing-input" /></Field>
          <Field label="Digest date"><Input type="date" value={form.digestDate} onChange={event => update("digestDate", event.target.value)} className="briefing-input" /></Field>
          <Field label="Scheduled send"><Input type="datetime-local" value={form.scheduledFor} onChange={event => update("scheduledFor", event.target.value)} className="briefing-input" /></Field>
        </div>

        <Field label="Opening note"><Textarea value={form.introduction} maxLength={900} onChange={event => update("introduction", event.target.value)} className="min-h-24 resize-y rounded-none border-ink/35 text-sm leading-6 focus-visible:ring-signal" /></Field>

        <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink pt-5">
          <div>
            <p className="briefing-section-title">Digest blocks</p>
            <p className="mt-1 text-xs text-muted-foreground">Every item carries its intended audience. Keep this weekly digest concise.</p>
          </div>
          <Button type="button" variant="outline" onClick={addEntry} disabled={form.entries.length >= 8} className="rounded-none border-ink"><FilePlus2 size={16} /> Add item</Button>
        </div>

        <div className="divide-y-2 divide-ink border-y-2 border-ink">
          {form.entries.map((entry, index) => (
            <article key={`${entry.sortOrder}-${index}`} className="grid gap-4 p-4 sm:grid-cols-[130px_1fr_auto] sm:items-start">
              <div>
                <Label className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Audience</Label>
                <select value={entry.audience} onChange={event => updateEntry(index, "audience", event.target.value as DigestAudience)} className="briefing-select mt-2">
                  {audiences.map(audience => <option key={audience.value} value={audience.value}>{audience.label}</option>)}
                </select>
              </div>
              <div className="grid gap-3">
                <Input aria-label={`Headline for digest item ${index + 1}`} value={entry.headline} maxLength={180} onChange={event => updateEntry(index, "headline", event.target.value)} className="briefing-input font-semibold" />
                <Textarea aria-label={`Summary for digest item ${index + 1}`} value={entry.summary} maxLength={360} onChange={event => updateEntry(index, "summary", event.target.value)} className="min-h-20 resize-y rounded-none border-ink/35 text-sm leading-6 focus-visible:ring-signal" />
              </div>
              <Button type="button" variant="ghost" onClick={() => removeEntry(index)} disabled={form.entries.length === 1} className="rounded-none text-signal hover:bg-[#fff1f2] hover:text-signal" aria-label={`Remove digest item ${index + 1}`}><Trash2 size={17} /></Button>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/25 pt-5">
          <p className="text-xs leading-5 text-muted-foreground">Drafts are saved to the Workspace data store. Publishing remains server-side and is restricted to Admins.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onSave} disabled={pending} className="rounded-none border-ink">Save draft</Button>
            <Button type="button" onClick={onSubmitForReview} disabled={pending || form.status === "in_review" || form.status === "published"} className="rounded-none bg-ink text-white hover:bg-ink/85"><CheckCircle2 size={16} /> Submit for review</Button>
            {canPublish && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" disabled={pending || form.status !== "in_review"} className="rounded-none bg-signal text-white hover:bg-[#c91627]"><Send size={16} /> Publish digest</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-none border-2 border-ink">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-display text-2xl font-bold tracking-[-0.05em]">Publish this digest?</AlertDialogTitle>
                    <AlertDialogDescription className="leading-6">Publishing confirms the approved daily digest content. Email delivery is not wired in this release, so this action records the publish decision only.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none border-ink">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onPublish} className="rounded-none bg-signal text-white hover:bg-[#c91627]">Confirm publish</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-muted-foreground">{label}</Label>{children}</div>;
}
