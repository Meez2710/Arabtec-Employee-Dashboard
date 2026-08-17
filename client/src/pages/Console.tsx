/**
 * Arabtec Console design reminder:
 * Editors prepare the digest in a focused editorial workspace; Admins gain one explicit publish decision with the same paper/ink/signal-red hierarchy.
 */
import { useEffect, useMemo, useState } from "react";
import { FilePenLine, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout, { type ConsoleNavItem } from "@/components/DashboardLayout";
import { AudienceReview } from "@/components/console/AudienceReview";
import { ConsoleAccessDenied } from "@/components/console/ConsoleAccessDenied";
import { DigestEditor } from "@/components/console/DigestEditor";
import type { DigestFormState } from "@/components/console/types";
import { trpc } from "@/lib/trpc";

const consoleNavigation: ConsoleNavItem[] = [
  { icon: FilePenLine, label: "Daily digest", path: "/console" },
  { icon: LayoutDashboard, label: "Executive briefing", path: "/" },
];

function formatDateTimeInput(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

function toFormState(digest: {
  id: number;
  title: string;
  introduction: string;
  digestDate: string;
  scheduledFor: Date | null;
  recipientCount: number;
  status: DigestFormState["status"];
  entries: DigestFormState["entries"];
}): DigestFormState {
  return { ...digest, scheduledFor: formatDateTimeInput(digest.scheduledFor), entries: digest.entries.map(entry => ({ ...entry })) };
}

export default function Console() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const digestQuery = trpc.digest.getCurrent.useQuery(undefined, { enabled: Boolean(user && ["editor", "admin"].includes(user.role)), retry: false });
  const saveMutation = trpc.digest.saveDraft.useMutation();
  const reviewMutation = trpc.digest.submitForReview.useMutation();
  const publishMutation = trpc.digest.publish.useMutation();
  const [form, setForm] = useState<DigestFormState | null>(null);

  useEffect(() => {
    if (digestQuery.data) setForm(toFormState(digestQuery.data));
  }, [digestQuery.data]);

  const isEditor = user?.role === "editor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const pending = saveMutation.isPending || reviewMutation.isPending || publishMutation.isPending;

  const payload = useMemo(() => {
    if (!form) return null;
    return { ...form, scheduledFor: form.scheduledFor ? new Date(form.scheduledFor) : null };
  }, [form]);

  const refresh = async () => utils.digest.getCurrent.invalidate();

  const handleSave = async () => {
    if (!payload) return;
    try {
      await saveMutation.mutateAsync(payload);
      await refresh();
      toast.success("Draft saved", { description: "The editor working copy is available for the next review." });
    } catch (error) {
      toast.error("Could not save the draft", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleReview = async () => {
    if (!payload) return;
    try {
      await saveMutation.mutateAsync(payload);
      await reviewMutation.mutateAsync({ id: payload.id });
      await refresh();
      toast.success("Submitted for Admin review", { description: "The content is locked in a clear review state until publishing." });
    } catch (error) {
      toast.error("Could not submit for review", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handlePublish = async () => {
    if (!payload) return;
    try {
      await publishMutation.mutateAsync({ id: payload.id });
      await refresh();
      toast.success("Digest published", { description: "The Admin publish decision is now recorded. Outbound email is not yet enabled." });
    } catch (error) {
      toast.error("Could not publish the digest", { description: error instanceof Error ? error.message : "Submit the digest for review first." });
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-paper" />;
  if (!isEditor) return <ConsoleAccessDenied role={user.role} />;

  return (
    <DashboardLayout navItems={consoleNavigation}>
      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 lg:px-12 lg:py-10">
        <header className="border-b-2 border-ink pb-6">
          <p className="briefing-kicker">Workspace console · authenticated</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-[-0.075em] text-ink sm:text-5xl">Prepare the daily digest.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Editors write and submit the release sheet. Admins review the audience summary and record the final publish decision.</p>
            </div>
            <span className="border-2 border-ink bg-ink px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.13em] text-white">Signed in as {user.role}</span>
          </div>
        </header>

        {digestQuery.isLoading ? (
          <div className="mt-8 grid min-h-72 place-items-center border-2 border-ink bg-white"><p className="text-sm font-semibold text-muted-foreground">Loading the current release sheet…</p></div>
        ) : digestQuery.error ? (
          <div className="mt-8 border-s-4 border-signal bg-white p-6"><p className="font-display text-2xl font-bold">The digest could not be loaded.</p><p className="mt-2 text-sm text-muted-foreground">Refresh the page or verify your role assignment.</p></div>
        ) : !form ? (
          <div className="mt-8 border-s-4 border-signal bg-white p-6"><p className="font-display text-2xl font-bold">No digest is available.</p><p className="mt-2 text-sm text-muted-foreground">Create or restore the current release sheet before continuing.</p></div>
        ) : (
          <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.65fr)]">
            <DigestEditor form={form} canPublish={isAdmin} pending={pending} onChange={setForm} onSave={handleSave} onSubmitForReview={handleReview} onPublish={handlePublish} />
            <AudienceReview form={form} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
