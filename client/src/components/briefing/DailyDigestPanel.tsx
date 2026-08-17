/**
 * Arabtec Executive Briefing design reminder:
 * The digest is an editorial feed with visible delivery state and concise operational copy, never a generic email card.
 */
import { CheckCircle2, ChevronRight, Mail, Send, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type DigestState = "ready" | "preview" | "queued";

type DailyDigestPanelProps = {
  isArabic: boolean;
  digestState: DigestState;
  onDigestAction: () => void;
};

const digestItems = [
  { category: "People Ops", title: "Four people join us this month", time: "Scheduled for Thu · 09:00", tone: "signal" },
  { category: "Projects", title: "Marina Tower reaches level 40", time: "Published 2 hours ago", tone: "ink" },
  { category: "HSE", title: "500 days without a lost-time incident", time: "Included in this digest", tone: "ready" },
  { category: "People Ops", title: "Annual leave policy: updated guidance", time: "Owner review pending", tone: "caution" },
];

export function DailyDigestPanel({ isArabic, digestState, onDigestAction }: DailyDigestPanelProps) {
  const copy = isArabic
    ? {
        kicker: "الملخص اليومي · الخميس",
        title: "جاهز للمراجعة قبل الإرسال.",
        audience: "382 موظفاً · 12 مالكاً · 4 قادمين",
        ready: "قائمة الإرسال جاهزة",
        preview: "معاينة الجمهور",
        queue: "تمت جدولة الملخص",
        next: "مراجعة معاينة التوزيع",
        delivery: "ما سيصل إلى كل جمهور",
        staff: "رسالة أسبوعية واحدة للموظفين",
        owners: "واجبات واضحة للملاك",
        newcomers: "حزمة ترحيب للقادمين",
      }
    : {
        kicker: "Daily digest · Thursday",
        title: "Ready for review before it sends.",
        audience: "382 employees · 12 owners · 4 joiners",
        ready: "Delivery list ready",
        preview: "Preview audience",
        queue: "Digest queued",
        next: "Review distribution preview",
        delivery: "What each audience receives",
        staff: "One weekly welcome email to staff",
        owners: "Clear action emails to owners",
        newcomers: "Welcome pack for incoming joiners",
      };

  const buttonLabel = digestState === "queued" ? copy.queue : digestState === "preview" ? copy.next : copy.preview;

  return (
    <aside className="border-t-2 border-ink pt-5" aria-labelledby="digest-title">
      <div className="border-2 border-ink bg-paper p-5 sm:p-6">
        <p className="briefing-kicker">{copy.kicker}</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <h2 id="digest-title" className="max-w-xs font-display text-3xl font-bold leading-[0.95] tracking-[-0.065em] text-ink">{copy.title}</h2>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-signal text-white"><Mail size={18} aria-hidden="true" /></span>
        </div>
        <p className="mt-5 border-y border-ink/20 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{copy.audience}</p>

        <img src="/manus-storage/arabtec-briefing-morning_fc5700c1.jpg" alt="Project manager reviewing construction drawings" className="mt-5 h-32 w-full object-cover grayscale" />

        <div className="mt-5 flex items-center justify-between border-b-2 border-ink pb-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-ready"><CheckCircle2 size={17} aria-hidden="true" /> {copy.ready}</span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink">09:00</span>
        </div>

        <div className="mt-1 divide-y divide-ink/15">
          {digestItems.map((item) => (
            <article key={item.title} className="digest-item">
              <div className={`mt-1 h-2 w-2 shrink-0 ${item.tone === "signal" ? "bg-signal" : item.tone === "ready" ? "bg-ready" : item.tone === "caution" ? "bg-caution" : "bg-ink"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-muted-foreground">{item.category}</p>
                <h3 className="mt-1 text-sm font-semibold leading-5 text-ink">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
              </div>
              <ChevronRight size={16} className="mt-1 shrink-0 text-ink/60 rtl:rotate-180" aria-hidden="true" />
            </article>
          ))}
        </div>

        <Button onClick={onDigestAction} className="mt-6 w-full rounded-none bg-signal text-white hover:bg-[#c91627]" size="lg">
          <Send size={16} aria-hidden="true" /> {buttonLabel}
        </Button>

        {digestState !== "ready" && (
          <div className="mt-4 border-s-2 border-signal bg-[#fff1f2] p-4 text-sm leading-6 text-ink">
            <p className="font-bold">{copy.delivery}</p>
            <ul className="mt-2 space-y-1 text-ink/75">
              <li className="flex gap-2"><UsersRound size={15} className="mt-1 shrink-0 text-signal" aria-hidden="true" /> {copy.staff}</li>
              <li className="flex gap-2"><UsersRound size={15} className="mt-1 shrink-0 text-signal" aria-hidden="true" /> {copy.owners}</li>
              <li className="flex gap-2"><UsersRound size={15} className="mt-1 shrink-0 text-signal" aria-hidden="true" /> {copy.newcomers}</li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
