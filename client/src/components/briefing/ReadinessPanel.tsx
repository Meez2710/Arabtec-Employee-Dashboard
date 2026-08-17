/**
 * Arabtec Executive Briefing design reminder:
 * Show readiness as an accountable progression with rules, concise annotation, and named sites—not decorative charts.
 */
import { ArrowUpRight, TrendingUp } from "lucide-react";

type ReadinessPanelProps = { isArabic: boolean };

export function ReadinessPanel({ isArabic }: ReadinessPanelProps) {
  const copy = isArabic
    ? {
        label: "المسار · الجاهزية في اليوم الأول",
        title: "التحسن مستمر، لكن السلامة لا تنتظر.",
        body: "بقي بندان مفتوحين أمام الدفعة الحالية. المعيار هو أن يكون كل بند مطلوب مغلقاً قبل وصول الشخص إلى البوابة.",
        open: "عنصران مفتوحان",
        site: "مارينا تاور · 5 من 7 جاهزة",
        report: "عرض اتجاه الموقع",
      }
    : {
        label: "Trajectory · day-one readiness",
        title: "Momentum is up. Safety cannot wait.",
        body: "Two required items remain open for the current cohort. The standard is simple: every required item closes before the person reaches the gate.",
        open: "2 items remain open",
        site: "Marina Tower · 5 of 7 ready",
        report: "View site trajectory",
      };

  return (
    <section className="grid gap-6 border-t-2 border-ink pt-5 lg:grid-cols-[1.06fr_0.94fr]" aria-labelledby="readiness-title">
      <div>
        <p className="briefing-kicker">{copy.label}</p>
        <h2 id="readiness-title" className="mt-2 max-w-xl font-display text-3xl font-bold tracking-[-0.065em] text-ink sm:text-4xl">{copy.title}</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{copy.body}</p>
        <button type="button" className="briefing-text-action mt-7">
          {copy.report} <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="border border-ink/25 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">{copy.site}</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-[-0.07em] text-ready">71%</p>
          </div>
          <TrendingUp className="text-ready" size={24} aria-hidden="true" />
        </div>
        <div className="mt-8 flex h-28 items-end gap-2 border-b-2 border-ink pt-3" aria-label="Readiness progress over five review points">
          {[34, 48, 44, 61, 71].map((height, index) => (
            <div key={height} className="group relative flex-1 bg-ink/12">
              <div className={`absolute inset-x-0 bottom-0 transition-all duration-300 ${index === 4 ? "bg-ready" : "bg-ink"}`} style={{ height: `${height}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Today</span></div>
        <p className="mt-5 border-s-2 border-signal ps-3 text-sm font-semibold text-ink">{copy.open}</p>
      </div>
    </section>
  );
}
