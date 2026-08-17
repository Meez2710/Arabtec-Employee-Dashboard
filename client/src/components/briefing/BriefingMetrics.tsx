/**
 * Arabtec Executive Briefing design reminder:
 * Metrics belong on an editorial rule band with compact labels and raw numbers, not floating rounded KPI cards.
 */
import { CheckCircle2, Clock3, MailCheck, Users } from "lucide-react";

type BriefingMetricsProps = { isArabic: boolean };

export function BriefingMetrics({ isArabic }: BriefingMetricsProps) {
  const metrics = isArabic
    ? [
        { value: "71%", label: "الجاهزية في يوم البداية", note: "لـ 4 قادمين", icon: CheckCircle2, tone: "ready" },
        { value: "06", label: "بنود تتجاوز الموعد", note: "3 ملاك بحاجة متابعة", icon: Clock3, tone: "signal" },
        { value: "382", label: "متلقٍ للملخص", note: "93% من قائمة الخميس", icon: MailCheck, tone: "ink" },
        { value: "12", label: "مالكاً نشطاً", note: "عبر 4 مواقع", icon: Users, tone: "ink" },
      ]
    : [
        { value: "71%", label: "Day-one readiness", note: "Across 4 upcoming starters", icon: CheckCircle2, tone: "ready" },
        { value: "06", label: "Items beyond due date", note: "3 owners need follow-up", icon: Clock3, tone: "signal" },
        { value: "382", label: "Digest recipients", note: "93% of Thursday list", icon: MailCheck, tone: "ink" },
        { value: "12", label: "Active owners", note: "Across 4 locations", icon: Users, tone: "ink" },
      ];

  return (
    <section className="border-b-2 border-ink bg-paper" aria-label={isArabic ? "مقاييس التشغيل" : "Operational metrics"}>
      <div className="mx-auto grid max-w-[1440px] divide-y divide-ink/20 border-x border-ink/20 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {metrics.map(({ value, label, note, icon: Icon, tone }) => (
          <article key={label} className="px-5 py-6 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`font-display text-4xl font-bold tracking-[-0.07em] ${tone === "signal" ? "text-signal" : tone === "ready" ? "text-ready" : "text-ink"}`}>{value}</p>
                <h2 className="mt-2 text-sm font-bold uppercase tracking-[0.1em] text-ink">{label}</h2>
              </div>
              <Icon size={19} className={tone === "signal" ? "text-signal" : tone === "ready" ? "text-ready" : "text-ink"} aria-hidden="true" />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
