/**
 * Arabtec Console design reminder:
 * The review panel turns publishing into an accountable decision by naming each audience and the exact content they receive.
 */
import { Eye, MailCheck, ShieldCheck, UsersRound } from "lucide-react";
import type { DigestFormState } from "./types";

const audienceLabels = {
  employees: { label: "All employees", icon: UsersRound, detail: "Welcome strip, company news, and relevant people updates." },
  owners: { label: "Named prep owners", icon: ShieldCheck, detail: "Their open preparation items with due dates and direct action context." },
  joiners: { label: "Incoming joiners", icon: MailCheck, detail: "Welcome pack and first-week checklist context." },
};

export function AudienceReview({ form }: { form: DigestFormState }) {
  const counts = form.entries.reduce<Record<keyof typeof audienceLabels, number>>((total, entry) => {
    total[entry.audience] += 1;
    return total;
  }, { employees: 0, owners: 0, joiners: 0 });

  return (
    <section className="border-t-2 border-ink pt-5" aria-labelledby="audience-review-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="briefing-kicker">Review preview</p>
          <h2 id="audience-review-title" className="mt-2 font-display text-3xl font-bold tracking-[-0.065em]">What each audience receives.</h2>
        </div>
        <Eye className="mt-2 text-signal" size={21} aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">This review mirrors the publish confirmation: it makes the release audience explicit before an Admin records the decision.</p>

      <div className="mt-6 divide-y-2 divide-ink border-y-2 border-ink">
        {(Object.keys(audienceLabels) as Array<keyof typeof audienceLabels>).map(key => {
          const item = audienceLabels[key];
          const Icon = item.icon;
          return (
            <article key={key} className="flex items-start gap-4 p-4">
              <Icon size={19} className="mt-1 shrink-0 text-signal" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4"><h3 className="font-display text-lg font-bold tracking-[-0.04em]">{item.label}</h3><span className="text-xs font-bold uppercase tracking-[0.12em] text-signal">{counts[key]} items</span></div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </div>
            </article>
          );
        })}
      </div>

      <article className="mt-6 border-s-4 border-signal bg-white p-5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Release note</p>
        <p className="mt-2 font-display text-xl font-bold tracking-[-0.045em]">{form.title}</p>
        <p className="mt-2 text-sm leading-6 text-ink/75">{form.introduction}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">Scheduled send · {form.scheduledFor ? new Date(form.scheduledFor).toLocaleString() : "Not scheduled"}</p>
      </article>
    </section>
  );
}
