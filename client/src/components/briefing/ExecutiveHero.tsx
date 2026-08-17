/**
 * Arabtec Executive Briefing design reminder:
 * Prioritize the operational signal with a red rail, strong type, and documentary imagery—not a generic hero card.
 */
import { ArrowUpRight, CircleAlert, UsersRound } from "lucide-react";

type Filter = "all" | "action" | "people";

type ExecutiveHeroProps = {
  isArabic: boolean;
  filter: Filter;
  onFilter: (filter: Filter) => void;
};

const joiners = [
  { initials: "AK", name: "Ahmed Kamal", role: "Site Engineer", site: "Marina Tower", start: "24 Aug", image: "/manus-storage/arabtec-onboarding-field_348ed9ae.jpg" },
  { initials: "NF", name: "Nour Fathy", role: "QS", site: "Technical Office", start: "24 Aug" },
  { initials: "MS", name: "Mahmoud Salah", role: "Foreman", site: "Zayed Depot", start: "27 Aug" },
];

export function ExecutiveHero({ isArabic, filter, onFilter }: ExecutiveHeroProps) {
  const copy = isArabic
    ? {
        label: "ملخص القيادة · صباح اليوم",
        title: "اليوم يبدأ بثلاثة قرارات واضحة.",
        body: "نظرة سريعة على جاهزية القادمين، ما ينتظر الملاك، وما سيصل إلى الشركة في ملخص الخميس.",
        highlighted: "5 إشارات تشغيلية",
        all: "كل الإشارات",
        action: "تحتاج إجراء",
        people: "الأشخاص",
        joiners: "قادمون خلال 14 يوماً",
        starts: "يبدأ",
        status: "الملخص جاهز للمراجعة",
      }
    : {
        label: "Executive briefing · morning issue",
        title: "The day starts with three clear decisions.",
        body: "A fast view of joiner readiness, owner actions, and what the company will receive in Thursday’s digest.",
        highlighted: "5 operational signals",
        all: "All signals",
        action: "Needs action",
        people: "People",
        joiners: "Joining in the next 14 days",
        starts: "Starts",
        status: "Digest ready for review",
      };

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: copy.all },
    { id: "action", label: copy.action },
    { id: "people", label: copy.people },
  ];

  return (
    <section className="relative overflow-hidden border-b-2 border-ink bg-[#e9ebed]">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[minmax(0,1.16fr)_minmax(340px,0.84fr)]">
        <div className="relative px-4 py-8 md:px-8 md:py-12 lg:px-12 lg:py-16">
          <div className="briefing-red-rail absolute inset-y-8 start-4 md:inset-y-12 md:start-8 lg:inset-y-16 lg:start-12" />
          <div className="ms-5 max-w-3xl md:ms-7">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="briefing-kicker">{copy.label}</p>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-signal">
                <CircleAlert size={14} aria-hidden="true" /> {copy.highlighted}
              </span>
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[0.94] tracking-[-0.07em] text-ink sm:text-5xl md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink/75 md:text-lg">{copy.body}</p>

            <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={isArabic ? "تصفية الملخص" : "Filter briefing"}>
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onFilter(item.id)}
                  className={`briefing-filter ${filter === item.id ? "briefing-filter--active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-10 border-t-2 border-ink pt-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="briefing-section-title flex items-center gap-2">
                  <UsersRound size={16} aria-hidden="true" /> {copy.joiners}
                </p>
                <span className="briefing-status-dot">{copy.status}</span>
              </div>
              <div className="grid gap-px overflow-hidden border border-ink/25 bg-ink/15 sm:grid-cols-3">
                {joiners.map((joiner, index) => (
                  <article key={joiner.initials} className="group bg-[#f6f7f7] p-4 transition-colors duration-200 hover:bg-white">
                    <div className="flex items-start justify-between gap-3">
                      {joiner.image ? (
                        <img src={joiner.image} alt="" className="h-10 w-10 object-cover grayscale transition duration-200 group-hover:grayscale-0" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center border border-ink bg-paper font-display text-xs font-bold">{joiner.initials}</span>
                      )}
                      <span className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">0{index + 1}</span>
                    </div>
                    <h2 className="mt-7 font-display text-xl font-bold tracking-[-0.05em] text-ink">{joiner.name}</h2>
                    <p className="mt-1 text-sm text-ink/70">{joiner.role} · {joiner.site}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-signal">{copy.starts} {joiner.start}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-h-[380px] border-t-2 border-ink lg:border-s-2 lg:border-t-0">
          <img
            src="/manus-storage/arabtec-executive-site-review_5aa4ad0a.jpg"
            alt="Engineers reviewing a site plan at a high-rise construction project"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <p className="max-w-xs font-display text-2xl font-bold leading-tight tracking-[-0.05em] text-white">Marina Tower moves to its final pre-start review.</p>
            <button type="button" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-signal decoration-2 underline-offset-8 transition hover:text-paper">
              {isArabic ? "فتح تقرير الموقع" : "Open site report"} <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
