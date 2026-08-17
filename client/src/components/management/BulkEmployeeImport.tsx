/**
 * Arabtec Workspace design reminder:
 * This Admin-only importer turns a set of employee images into reviewable, editable profile tiles before creating public hover cards. It keeps the public workspace simple while supporting scalable people updates.
 */
import { useMemo, useState } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type QueuedEmployee = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  department: string;
  jobTitle: string;
  bio: string;
  linkUrl: string;
};

type BulkEmployeeImportProps = { existingCount: number };

export function BulkEmployeeImport({ existingCount }: BulkEmployeeImportProps) {
  const utils = trpc.useUtils();
  const uploadImage = trpc.workspace.uploadImage.useMutation();
  const bulkSave = trpc.workspace.bulkSaveEmployeeHoverCards.useMutation();
  const [queue, setQueue] = useState<QueuedEmployee[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const pending = uploadImage.isPending || bulkSave.isPending;
  const remaining = Math.max(0, 25 - queue.length);
  const valid = useMemo(() => queue.length > 0 && queue.every(employee => employee.name.trim() && employee.department.trim() && employee.jobTitle.trim() && employee.bio.trim()), [queue]);

  const addFiles = (files: File[]) => {
    const supported = files.filter(file => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5_000_000).slice(0, remaining);
    const rejected = files.length - supported.length;
    if (rejected) toast.error(`Only JPG, PNG, or WebP files under 5 MB were added. You can import up to 25 employees at once.`);
    const additions = supported.map(file => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), department: "", jobTitle: "", bio: "", linkUrl: "" }));
    setQueue(current => [...current, ...additions]);
    setRowErrors({});
  };

  const updateEmployee = (id: string, field: keyof Omit<QueuedEmployee, "id" | "file" | "previewUrl">, value: string) => setQueue(current => current.map(employee => employee.id === id ? { ...employee, [field]: value } : employee));
  const removeEmployee = (id: string) => setQueue(current => { const target = current.find(employee => employee.id === id); if (target) URL.revokeObjectURL(target.previewUrl); return current.filter(employee => employee.id !== id); });

  const toBase64 = async (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
  const importEmployees = async () => {
    if (!valid) { toast.error("Complete the name, department, job title, and short profile for every employee."); return; }
    try {
      setStatus("Uploading employee images…");
      const cards = [];
      const uploadFailures: Record<string, string> = {};
      for (let index = 0; index < queue.length; index += 1) {
        const employee = queue[index];
        try {
          setStatus(`Uploading ${index + 1} of ${queue.length}: ${employee.name}`);
          const base64 = await toBase64(employee.file);
          const stored = await uploadImage.mutateAsync({ filename: employee.file.name, mimeType: employee.file.type as "image/jpeg" | "image/png" | "image/webp", base64 });
          cards.push({ clientId: employee.id, parentSlot: "new_joiner" as const, eyebrow: employee.department, title: `${employee.name} · ${employee.jobTitle}`, body: employee.bio, linkUrl: employee.linkUrl || null, imageUrl: stored.url, imageMode: "upload" as const, sortOrder: existingCount + index, active: true });
        } catch (error) {
          uploadFailures[employee.id] = error instanceof Error ? error.message : "Image upload failed.";
        }
      }
      if (cards.length === 0) { setRowErrors(uploadFailures); setStatus(null); toast.error("No employee images could be uploaded."); return; }
      setStatus("Creating employee hover cards…");
      const result = await bulkSave.mutateAsync({ cards });
      await utils.workspace.listHoverCards.invalidate();
      const serverFailures = Object.fromEntries(result.failures.map(failure => [failure.clientId, failure.message]));
      const failures = { ...uploadFailures, ...serverFailures };
      const failedIds = new Set(Object.keys(failures));
      queue.filter(employee => !failedIds.has(employee.id)).forEach(employee => URL.revokeObjectURL(employee.previewUrl));
      setQueue(current => current.filter(employee => failedIds.has(employee.id)));
      setRowErrors(failures);
      setStatus(null);
      result.created ? toast.success(`${result.created} employee hover card${result.created === 1 ? "" : "s"} created.`) : toast.error("No employee cards were created.");
    } catch (error) {
      setStatus(null);
      toast.error(error instanceof Error ? error.message : "The employee batch could not be imported.");
    }
  };

  return <section className="bulk-employee-import" aria-labelledby="bulk-employees-title"><div className="bulk-employee-head"><div><p className="dash-eyebrow">Bulk employee import</p><h2 id="bulk-employees-title">Add employee hover cards in one batch.</h2><p>Select up to 25 employee images, complete their details, then publish the resulting hover cards together.</p></div><span className="bulk-employee-count">{queue.length} / 25 queued</span></div><label className={`bulk-employee-drop ${remaining === 0 ? "is-full" : ""}`}><UploadCloud size={23} /><strong>Choose employee images</strong><span>JPG, PNG, or WebP · 5 MB per image</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={remaining === 0 || pending} onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} /></label>{queue.length > 0 && <><div className="bulk-employee-grid">{queue.map((employee, index) => <article key={employee.id} className={`bulk-employee-tile ${rowErrors[employee.id] ? "has-error" : ""}`}><div className="bulk-employee-image"><img src={employee.previewUrl} alt={`Selected employee ${employee.name || index + 1}`} /><button type="button" onClick={() => removeEmployee(employee.id)} disabled={pending} aria-label={`Remove ${employee.name || "employee"}`}><X size={14} /></button></div><div className="bulk-employee-fields"><label>Name<input value={employee.name} onChange={event => updateEmployee(employee.id, "name", event.target.value)} /></label><label>Department<input placeholder="Project Delivery" value={employee.department} onChange={event => updateEmployee(employee.id, "department", event.target.value)} /></label><label>Job title<input placeholder="Site Engineer" value={employee.jobTitle} onChange={event => updateEmployee(employee.id, "jobTitle", event.target.value)} /></label><label>Short profile<textarea placeholder="A concise introduction for the hover card." value={employee.bio} onChange={event => updateEmployee(employee.id, "bio", event.target.value)} /></label><label>Optional profile link<input type="url" placeholder="https://…" value={employee.linkUrl} onChange={event => updateEmployee(employee.id, "linkUrl", event.target.value)} /></label>{rowErrors[employee.id] && <p className="bulk-employee-error">{rowErrors[employee.id]}</p>}</div></article>)}</div><div className="bulk-employee-actions"><p>{status ?? (valid ? "All employee details are ready to import." : "Complete required fields before importing.")}</p><button type="button" onClick={importEmployees} disabled={!valid || pending} className="dash-red-button">{pending ? <LoaderCircle className="animate-spin" size={16} /> : <ImagePlus size={16} />} {pending ? "Importing…" : `Import ${queue.length} employee${queue.length === 1 ? "" : "s"}`}</button></div></>}</section>;
}
