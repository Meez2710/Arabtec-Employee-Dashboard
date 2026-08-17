/**
 * Option B — recommendation:
 * A calmer, user-controlled home workspace prioritizes a single onboarding feature, then lets employees scan news at their own pace while retaining a sticky utility rail.
 */
import { useState } from "react";
import { ArrowRight, BellRing, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, MapPin, Search, UsersRound } from "lucide-react";
import { BriefingFooter } from "@/components/briefing/BriefingFooter";
import { BriefingHeader } from "@/components/briefing/BriefingHeader";
import { LayoutOptionNav } from "@/components/workspace/LayoutOptionNav";

const onboarding = [
  { image: "/manus-storage/arabtec-onboarding-welcome_dca8351d.jpg", stage: "Welcome guide", title: "Your first week, mapped simply.", body: "Meet your team, navigate the workplace, and begin with the essentials." },
  { image: "/manus-storage/arabtec-onboarding-roadmap_05a4b024.jpg", stage: "First seven days", title: "Your practical roadmap is ready.", body: "Systems, safety, and timely milestones in an easy sequence." },
  { image: "/manus-storage/arabtec-onboarding-community_f74340e9.jpg", stage: "Meet the team", title: "Build the connections that help work flow.", body: "Your buddy, your people partner, and your team are in one place." },
];

const news = [
  { type: "Project update", title: "Marina Tower reaches its next delivery milestone", summary: "The delivery sequence is moving into the next critical package.", metric: "74%" },
  { type: "People & culture", title: "The August learning calendar is now open", summary: "Register now for project controls, leadership, and HSE sessions.", metric: "12" },
  { type: "Operations", title: "New project controls toolkit is available", summary: "New templates and practices are ready for teams to use.", metric: "06" },
];

export default function OptionB() {
  const [slide, setSlide] = useState(0);
  const current = onboarding[slide];
  const changeSlide = (step: number) => setSlide(currentSlide => (currentSlide + step + onboarding.length) % onboarding.length);
  return (
    <div className="min-h-screen bg-paper text-ink">
      <BriefingHeader />
      <LayoutOptionNav />
      <main>
        <section className="mx-auto max-w-[1440px] px-5 py-5 md:px-8 lg:px-12 lg:py-8"><div className="flex flex-wrap items-center justify-between gap-3 pb-5"><div><p className="workspace-kicker">Option B · usability-led workspace</p><p className="mt-1 text-sm text-muted-foreground">One primary onboarding action, stable reading surfaces, and a persistent utility rail.</p></div><span className="option-intent-label">Recommended · user-controlled movement</span></div>
          <div className="option-b-shell">
            <section className="option-b-hero">
              <div className="relative min-h-[520px] overflow-hidden bg-ink text-paper"><img src={current.image} alt={`Illustration for ${current.title}`} className="absolute inset-0 h-full w-full object-cover" /><div className="option-b-image-shade" /><div className="relative flex min-h-[520px] flex-col justify-between p-6 md:p-8"><div className="flex items-center justify-between"><p className="workspace-kicker text-signal">Onboarding · {current.stage}</p><span className="option-b-counter">0{slide + 1} / 0{onboarding.length}</span></div><div><h1 className="max-w-xl font-display text-5xl font-bold leading-[0.88] tracking-[-0.08em] sm:text-6xl">{current.title}</h1><p className="mt-5 max-w-md text-base leading-7 text-paper/80">{current.body}</p><div className="mt-7 flex flex-wrap gap-3"><button type="button" className="workspace-primary-action">Open your welcome guide <ArrowRight size={17} /></button><button type="button" onClick={() => changeSlide(-1)} className="option-b-gallery-button" aria-label="Previous story"><ChevronLeft size={18} /></button><button type="button" onClick={() => changeSlide(1)} className="option-b-gallery-button" aria-label="Next story"><ChevronRight size={18} /></button></div></div></div></div>
              <div className="grid grid-cols-3 divide-x divide-ink/15 border-x border-b border-ink/15 bg-white"><MiniStat icon={<Clock3 size={16} />} value="Day 01" label="Monday start" /><MiniStat icon={<UsersRound size={16} />} value="03 people" label="Your circle" /><MiniStat icon={<CalendarDays size={16} />} value="07 days" label="Onboarding plan" /></div>
            </section>
            <section className="option-b-news"><div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-5"><div><p className="workspace-kicker">Company news</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.065em]">Read at your pace.</h2></div><button type="button" className="workspace-text-link">All news <ArrowRight size={16} /></button></div><div className="mt-1">{news.map((item, index) => <article key={item.title} className="option-b-news-row"><span className="font-display text-3xl font-bold tracking-[-0.08em] text-signal">0{index + 1}</span><div className="min-w-0 flex-1"><p className="workspace-kicker">{item.type}</p><h3 className="mt-2 font-display text-xl font-bold leading-[0.98] tracking-[-0.045em]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p></div><div className="text-end"><span className="font-display text-3xl font-bold tracking-[-0.08em]">{item.metric}</span><p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">new</p></div></article>)}</div><div className="option-b-alert"><BellRing size={19} className="text-signal" /><div><p className="workspace-kicker">Announcement</p><p className="mt-1 text-sm font-semibold leading-6">Complete the induction reminder before Wednesday’s safety briefing.</p></div></div></section>
            <aside className="option-b-utility"><p className="workspace-kicker text-signal">Your workspace</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.06em]">Today’s essentials.</h2><div className="mt-6 grid grid-cols-2 gap-2"><UtilityTile icon={<CalendarDays size={18} />} label="Calendar" detail="3 this week" /><UtilityTile icon={<Search size={18} />} label="Find" detail="Search all" /><UtilityTile icon={<FileText size={18} />} label="Resources" detail="14 new" /><UtilityTile icon={<MapPin size={18} />} label="Locations" detail="7 active" /></div><div className="mt-7 border-t border-ink/15 pt-5"><p className="workspace-kicker">Upcoming</p><div className="mt-3 divide-y divide-ink/15"><Upcoming day="19" title="New joiner welcome" /><Upcoming day="21" title="Project controls share" /><Upcoming day="25" title="Holiday calendar notice" /></div></div></aside>
          </div>
        </section>
      </main>
      <BriefingFooter />
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="p-4"><span className="text-signal">{icon}</span><p className="mt-2 text-sm font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
function UtilityTile({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) { return <div className="border border-ink/15 bg-[#f2f3f4] p-3"><span className="text-signal">{icon}</span><p className="mt-4 text-sm font-bold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }
function Upcoming({ day, title }: { day: string; title: string }) { return <div className="flex gap-3 py-3"><span className="font-display text-xl font-bold tracking-[-0.07em] text-signal">{day}</span><p className="text-sm font-semibold leading-5">{title}</p></div>; }
