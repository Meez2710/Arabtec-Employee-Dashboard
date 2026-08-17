/**
 * Arabtec Executive Briefing design reminder:
 * Action rows use inline-start status edges, clear owner accountability, and readable urgency—not color-only badges.
 */
import { ArrowUpRight, Check, CircleAlert, Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type Filter = "all" | "action" | "people";

type DecisionBoardProps = {
  isArabic: boolean;
  filter: Filter;
  resolvedActions: string[];
  onResolve: (id: string) => void;
};

const actions = [
  { id: "laptop", state: "critical", title: "Laptop & email for Ahmed Kamal", owner: "IT · Hassan Lotfy", location: "Marina Tower", due: "Due in 2 days", detail: "No assignment confirmation recorded" },
  { id: "ppe", state: "caution", title: "PPE issue for Mahmoud Salah", owner: "HSE · Sara El Masry", location: "Zayed Depot", due: "Due Friday", detail: "Awaiting stock allocation" },
  { id: "medical", state: "ready", title: "Medical card for Nour Fathy", owner: "People Ops · You", location: "Head Office", due: "Completed today", detail: "Ready for newcomer pack" },
];

export function DecisionBoard({ isArabic, filter, resolvedActions, onResolve }: DecisionBoardProps) {
  const copy = isArabic
    ? {
        kicker: "القرارات · تتطلب انتباهاً",
        title: "ما يحتاج إلى مالك اليوم.",
        body: "الصفوف ذات الحافة الحمراء أو الكهرمانية تحتاج متابعة قبل أن تتحول إلى مشكلة في أول يوم.",
        owner: "المالك",
        view: "فتح التفاصيل",
        resolve: "تأكيد المراجعة",
        done: "تمت المراجعة",
        field: "إشارة من الموقع",
        fieldTitle: "مراجعة خطة الموقع قبل بداية عمل أحمد.",
        fieldBody: "تأكيد تصريح الدخول وجلسة السلامة قبل الخميس الساعة 16:00.",
      }
    : {
        kicker: "Decisions · attention required",
        title: "What needs an owner today.",
        body: "Rows with a red or amber edge need follow-up before they become a first-day issue.",
        owner: "Owner",
        view: "Open detail",
        resolve: "Confirm review",
        done: "Reviewed",
        field: "Field signal",
        fieldTitle: "Review site plan before Ahmed’s start.",
        fieldBody: "Confirm access pass and safety induction before Thursday, 16:00.",
      };

  const visibleActions = filter === "people" ? actions.filter((action) => action.id === "medical") : actions;

  return (
    <section className="border-t-2 border-ink pt-5" aria-labelledby="decision-board-title">
      <div className="flex flex-wrap items-end justify-between gap-5 px-1">
        <div>
          <p className="briefing-kicker">{copy.kicker}</p>
          <h2 id="decision-board-title" className="mt-2 font-display text-3xl font-bold tracking-[-0.065em] text-ink sm:text-4xl">{copy.title}</h2>
        </div>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">{copy.body}</p>
      </div>

      <div className="mt-7 divide-y divide-ink/20 border-y border-ink/25">
        {visibleActions.map((action) => {
          const resolved = resolvedActions.includes(action.id) || action.state === "ready";
          const StateIcon = resolved ? Check : action.state === "critical" ? CircleAlert : Clock3;
          return (
            <article key={action.id} className={`decision-row decision-row--${resolved ? "ready" : action.state}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{copy.owner} · {action.owner}</p>
                  <span className={`inline-flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-[0.13em] ${resolved ? "text-ready" : action.state === "critical" ? "text-signal" : "text-caution"}`}>
                    <StateIcon size={13} aria-hidden="true" /> {resolved ? copy.done : action.due}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.045em] text-ink">{action.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" /> {action.location}</span>
                  <span>{action.detail}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" className="briefing-text-action">
                  {copy.view} <ArrowUpRight size={15} aria-hidden="true" />
                </button>
                {!resolved && (
                  <Button size="sm" variant="outline" onClick={() => onResolve(action.id)} className="briefing-outline-action">
                    {copy.resolve}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <article className="mt-6 grid border-2 border-ink bg-ink text-paper sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="border-b border-paper/25 p-5 sm:border-b-0 sm:border-e sm:p-6"><MapPin className="text-signal" size={23} aria-hidden="true" /></div>
        <div className="p-5 sm:p-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-paper/60">{copy.field}</p>
          <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.04em]">{copy.fieldTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-paper/70">{copy.fieldBody}</p>
        </div>
        <button type="button" className="flex h-full min-h-16 items-center justify-center border-t border-paper/25 px-6 text-sm font-semibold transition hover:bg-paper hover:text-ink sm:border-s sm:border-t-0" aria-label={copy.view}>
          <ArrowUpRight size={19} aria-hidden="true" />
        </button>
      </article>
    </section>
  );
}
