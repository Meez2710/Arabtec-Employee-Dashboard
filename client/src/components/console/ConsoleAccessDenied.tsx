/**
 * Arabtec Console design reminder:
 * Access boundaries should be calm, specific, and operationally clear—not a blank or generic error page.
 */
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function ConsoleAccessDenied({ role }: { role?: string }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6 text-ink">
      <section className="max-w-xl border-2 border-ink bg-white p-8 shadow-paper">
        <ShieldAlert size={28} className="text-signal" aria-hidden="true" />
        <p className="briefing-kicker mt-6">Console access</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.07em]">Editor access is required.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">Your current Workspace role is <strong className="text-ink">{role || "user"}</strong>. Editors may prepare and submit a digest for review; Admins may also publish it.</p>
        <Button onClick={() => setLocation("/")} variant="outline" className="mt-7 rounded-none border-ink"><ArrowLeft size={16} /> Return to the briefing</Button>
      </section>
    </div>
  );
}
