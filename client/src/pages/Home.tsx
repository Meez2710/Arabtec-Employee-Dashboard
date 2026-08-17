/**
 * Arabtec Workspace design reminder:
 * A visual, open employee intranet: the first fold is an onboarding invitation with copy at left and a scrollable non-photographic gallery at right. Company news and announcements immediately follow in a modern editorial card layout.
 */
import { useRef, useState } from "react";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coffee,
  GraduationCap,
  Landmark,
  Megaphone,
  Newspaper,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { BriefingFooter } from "@/components/briefing/BriefingFooter";
import { BriefingHeader } from "@/components/briefing/BriefingHeader";

const onboardingSlides = [
  {
    image: "/manus-storage/arabtec-onboarding-welcome_dca8351d.jpg",
    eyebrow: "Start here",
    title: "Your first week, mapped simply.",
    body: "Meet your team, explore the workplace, and know exactly where to go next.",
    tag: "Welcome guide",
  },
  {
    image: "/manus-storage/arabtec-onboarding-roadmap_05a4b024.jpg",
    eyebrow: "Your roadmap",
    title: "The practical steps are already waiting.",
    body: "A clear sequence for people, safety, systems, and your first project conversations.",
    tag: "First seven days",
  },
  {
    image: "/manus-storage/arabtec-onboarding-community_f74340e9.jpg",
    eyebrow: "Your network",
    title: "Build useful connections early.",
    body: "Find your buddy, your people partner, and the colleagues who help work move forward.",
    tag: "Meet the team",
  },
];

const newsCards = [
  {
    category: "Project update",
    title: "Marina Tower reaches its next delivery milestone",
    body: "The team has completed the latest handover sequence and is preparing the next critical package.",
    value: "74%",
    label: "delivery progress",
    variant: "dark",
  },
  {
    category: "People & culture",
    title: "The August learning calendar is now open",
    body: "Register for project controls, site leadership, and HSE refresher sessions through the Academy.",
    value: "12",
    label: "sessions this month",
    variant: "light",
  },
  {
    category: "Operations",
    title: "New project controls toolkit is available",
    body: "A concise collection of templates, reference points, and common coordination practices.",
    value: "06",
    label: "new resources",
    variant: "red",
  },
];

const jobs = [
  { title: "Planning Engineer", location: "Cairo · Projects", closing: "Closes 21 Aug", type: "Internal move" },
  { title: "Commercial Manager", location: "New Alamein · Commercial", closing: "Closes 24 Aug", type: "Internal move" },
  { title: "HSE Specialist", location: "Riyadh · HSE", closing: "Closes 28 Aug", type: "Referral welcome" },
  { title: "Document Controller", location: "Cairo · Technical Office", closing: "Closes 30 Aug", type: "Internal move" },
];

const events = [
  { date: "19", month: "AUG", title: "New joiner welcome session", meta: "09:30 · Head Office & Teams", tag: "Onboarding" },
  { date: "21", month: "AUG", title: "Project controls knowledge share", meta: "13:00 · Learning Hub", tag: "Learning" },
  { date: "25", month: "AUG", title: "Official calendar update", meta: "HR will publish the next confirmed holiday notice", tag: "HR notice" },
];

const industryBriefs = [
  { topic: "Procurement watch", detail: "Monitor lead times and supplier commitments in this week’s commercial brief." },
  { topic: "Safety practice", detail: "A practical focus on site access, induction, and handover coordination." },
  { topic: "Market intelligence", detail: "Construction-sector updates curated for project and commercial teams." },
];

export default function Home() {
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const visibleJobs = showAllJobs ? jobs : jobs.slice(0, 3);

  const moveGallery = (direction: -1 | 1) => {
    galleryRef.current?.scrollBy({ left: direction * galleryRef.current.clientWidth * 0.78, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BriefingHeader />
      <main>
        <section id="onboarding" className="border-b-2 border-ink bg-[#eceef0]">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden px-5 py-9 md:px-8 md:py-12 lg:px-12 lg:py-14">
              <div className="absolute -start-16 top-20 h-64 w-64 rounded-full border-[32px] border-signal/10" aria-hidden="true" />
              <div className="relative max-w-xl">
                <div className="flex items-center gap-3"><span className="workspace-live-dot" /><p className="workspace-kicker">Onboarding · August intake</p></div>
                <h1 className="mt-6 font-display text-[3.25rem] font-bold leading-[0.87] tracking-[-0.085em] sm:text-6xl lg:text-7xl">Welcome<br />to your<br /><span className="text-signal">next chapter.</span></h1>
                <p className="mt-7 max-w-md text-base leading-7 text-ink/75 md:text-lg">Everything a new employee needs for a confident first week—your people, your place, and the practical details that make work feel familiar.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button type="button" className="workspace-primary-action">Open your welcome guide <ArrowRight size={17} /></button>
                  <a href="#company-news" className="workspace-secondary-action">See what’s happening</a>
                </div>
              </div>

              <div className="relative mt-10 grid max-w-lg grid-cols-3 gap-2 border-t border-ink/20 pt-5">
                <HeroMeta icon={Clock3} title="Day 01" detail="Monday start" />
                <HeroMeta icon={UsersRound} title="03 people" detail="Your support circle" />
                <HeroMeta icon={CalendarDays} title="07 days" detail="Onboarding plan" />
              </div>
            </div>

            <div className="border-t-2 border-ink bg-ink py-7 text-paper lg:border-s-2 lg:border-t-0 lg:py-10">
              <div className="flex items-end justify-between px-5 md:px-8 lg:px-10">
                <div><p className="workspace-kicker text-signal">Onboarding stories</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.065em]">Your journey starts here.</h2></div>
                <div className="hidden gap-2 sm:flex"><button type="button" onClick={() => moveGallery(-1)} className="workspace-gallery-control" aria-label="Previous onboarding story"><ChevronLeft size={18} /></button><button type="button" onClick={() => moveGallery(1)} className="workspace-gallery-control" aria-label="Next onboarding story"><ChevronRight size={18} /></button></div>
              </div>
              <div ref={galleryRef} className="workspace-gallery mt-7 px-5 md:px-8 lg:px-10" aria-label="Scrollable onboarding stories">
                {onboardingSlides.map(slide => (
                  <article key={slide.title} className="workspace-gallery-card">
                    <img src={slide.image} alt="" className="h-full w-full object-cover" />
                    <div className="workspace-gallery-shade" />
                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6"><p className="workspace-gallery-tag">{slide.tag}</p><p className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-paper/70">{slide.eyebrow}</p><h3 className="mt-2 max-w-sm font-display text-2xl font-bold leading-[0.95] tracking-[-0.055em]">{slide.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-paper/80">{slide.body}</p></div>
                  </article>
                ))}
              </div>
              <p className="mt-5 px-5 text-xs text-paper/50 md:px-8 lg:px-10">Swipe or use the arrows to explore your onboarding journey.</p>
            </div>
          </div>
        </section>

        <section id="company-news" className="border-b-2 border-ink bg-white">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 md:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.55fr)] lg:gap-12 lg:px-12 lg:py-14">
            <div>
              <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading kicker="Company news" title="The stories moving Arabtec forward." body="A visual briefing from projects, people, and the teams shaping what comes next." /><span className="workspace-news-count">03 NEW</span></div>
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {newsCards.slice(0, 2).map((story, index) => <NewsCard key={story.title} story={story} index={index} />)}
                <NewsCard story={newsCards[2]} index={2} full />
              </div>
              <button type="button" className="workspace-text-link mt-6">Explore all company news <ArrowRight size={16} aria-hidden="true" /></button>
            </div>

            <aside id="announcements" className="workspace-notice-board" aria-labelledby="announcements-title">
              <div className="flex items-start justify-between gap-4"><div><p className="workspace-kicker text-signal">Notice board</p><h2 id="announcements-title" className="mt-2 font-display text-3xl font-bold leading-[0.95] tracking-[-0.065em]">Important, clear, and timely.</h2></div><BellRing className="text-signal" size={23} aria-hidden="true" /></div>
              {!noticeDismissed ? <>
                <div className="mt-7 border-y border-paper/20"><Announcement icon={CircleAlert} label="Action needed" title="Complete the updated induction reminder before Wednesday’s site-safety briefing." detail="Wednesday · 10:30 · All employees on live projects" /><Announcement icon={GraduationCap} label="Learning" title="Nomination is open for the September project-leadership cohort." detail="Register your interest by 28 August" /><Announcement icon={Coffee} label="People moment" title="New joiner breakfast is hosted in the Head Office atrium this Tuesday." detail="Tuesday · 09:00 · All welcome" /></div>
                <button type="button" onClick={() => setNoticeDismissed(true)} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline decoration-signal decoration-2 underline-offset-8">Mark notices as read <ArrowRight size={16} /></button>
              </> : <div className="mt-7 grid min-h-60 place-items-center border border-dashed border-paper/30 p-8 text-center"><div><X className="mx-auto text-signal" size={25} /><p className="mt-4 font-display text-xl font-bold">You’re up to date.</p><button type="button" onClick={() => setNoticeDismissed(false)} className="mt-3 text-sm font-semibold underline decoration-signal decoration-2 underline-offset-6">Show notices again</button></div></div>}
            </aside>
          </div>
        </section>

        <section id="opportunities" className="border-b-2 border-ink bg-[#f5f6f6]">
          <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-8 lg:px-12 lg:py-14">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b-2 border-ink pb-6"><SectionHeading kicker="Internal opportunities" title="Move your next role closer." body="Open roles, projects, and referrals from across Arabtec." /><div className="workspace-icon-tile"><BriefcaseBusiness size={21} /><span>04 open</span></div></div>
            <div className="grid divide-y divide-ink/20 border-b border-ink/20 lg:grid-cols-2 lg:divide-x lg:divide-y-0">{visibleJobs.map((job, index) => <article key={job.title} className="workspace-job group"><span className="font-display text-3xl font-bold tracking-[-0.07em] text-signal">0{index + 1}</span><div className="min-w-0 flex-1"><h3 className="font-display text-xl font-bold tracking-[-0.045em]">{job.title}</h3><p className="mt-1 text-sm text-muted-foreground">{job.location}</p><div className="mt-4 flex flex-wrap gap-2"><span className="workspace-tag">{job.type}</span><span className="workspace-tag workspace-tag--ink">{job.closing}</span></div></div><ChevronRight className="mt-1 shrink-0 group-hover:text-signal" size={18} aria-hidden="true" /></article>)}</div>
            <button type="button" onClick={() => setShowAllJobs(value => !value)} className="workspace-text-link mt-6">{showAllJobs ? "Show fewer roles" : "View all internal opportunities"} <ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,1.1fr)] lg:gap-12 lg:px-12 lg:py-14">
          <section id="calendar"><SectionHeading kicker="Holidays & events" title="Put the week in context." body="Official notices and shared moments, in one place." /><div className="mt-7 divide-y-2 divide-ink border-y-2 border-ink">{events.map(event => <article key={event.title} className="workspace-event"><div className="w-14 shrink-0 border-e border-ink/20 text-center"><p className="font-display text-3xl font-bold tracking-[-0.07em]">{event.date}</p><p className="text-[0.58rem] font-bold tracking-[0.14em] text-signal">{event.month}</p></div><div className="ps-4"><p className="workspace-kicker">{event.tag}</p><h3 className="mt-1 font-display text-xl font-bold tracking-[-0.045em]">{event.title}</h3><p className="mt-1 text-sm text-muted-foreground">{event.meta}</p></div></article>)}</div><div className="mt-6 flex items-start gap-3 border-s-4 border-signal bg-white p-4"><Landmark size={18} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" /><p className="text-sm leading-6 text-ink/75">Official holidays appear here after HR publishes the confirmed calendar notice.</p></div></section>
          <section id="industry-watch" className="bg-ink p-6 text-paper sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="workspace-kicker text-signal">Industry watch</p><h2 className="mt-2 font-display text-3xl font-bold leading-[0.96] tracking-[-0.065em]">External context, made useful.</h2></div><Newspaper className="text-signal" size={24} aria-hidden="true" /></div><p className="mt-4 max-w-lg text-sm leading-6 text-paper/65">A focused view of topics that matter to our people and project teams—not a noisy news feed.</p><div className="mt-7 divide-y divide-paper/20 border-y border-paper/20">{industryBriefs.map((brief, index) => <article key={brief.topic} className="flex gap-4 py-5"><span className="font-display text-xl font-bold text-signal">0{index + 1}</span><div><h3 className="font-display text-lg font-bold tracking-[-0.04em]">{brief.topic}</h3><p className="mt-1 text-sm leading-6 text-paper/65">{brief.detail}</p></div></article>)}</div><button type="button" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline decoration-signal decoration-2 underline-offset-8">Open the industry briefing <ArrowRight size={16} /></button></section>
        </section>

        <section className="border-t-2 border-ink bg-[#eef0f1]"><div className="mx-auto grid max-w-[1440px] gap-px border-x border-ink/20 bg-ink/20 sm:grid-cols-3"><QuickLink icon={Megaphone} title="Announcements" detail="Official notices and employee guidance" /><QuickLink icon={Sparkles} title="Learning hub" detail="Courses, sessions, and shared practice" /><QuickLink icon={UsersRound} title="People directory" detail="Find the colleagues and teams you need" /></div></section>
      </main>
      <BriefingFooter />
    </div>
  );
}

function HeroMeta({ icon: Icon, title, detail }: { icon: typeof Clock3; title: string; detail: string }) { return <div><Icon size={16} className="text-signal" /><p className="mt-2 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }
function SectionHeading({ kicker, title, body }: { kicker: string; title: string; body: string }) { return <div><p className="workspace-kicker">{kicker}</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.065em] sm:text-4xl">{title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p></div>; }
function NewsCard({ story, index, full = false }: { story: typeof newsCards[number]; index: number; full?: boolean }) { return <article className={`workspace-news-card workspace-news-card--${story.variant} ${full ? "md:col-span-2" : ""}`}><div className="flex items-start justify-between gap-5"><div><p className="workspace-kicker text-current opacity-75">{story.category}</p><h3 className="mt-3 max-w-lg font-display text-2xl font-bold leading-[0.96] tracking-[-0.055em]">{story.title}</h3></div><span className="font-display text-3xl font-bold tracking-[-0.08em] opacity-70">0{index + 1}</span></div><div className="mt-8 flex items-end justify-between gap-5"><p className="max-w-md text-sm leading-6 opacity-75">{story.body}</p><div className="text-end"><p className="font-display text-4xl font-bold tracking-[-0.08em]">{story.value}</p><p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] opacity-65">{story.label}</p></div></div></article>; }
function Announcement({ icon: Icon, label, title, detail }: { icon: typeof BellRing; label: string; title: string; detail: string }) { return <article className="flex gap-3 py-5"><Icon size={18} className="mt-1 shrink-0 text-signal" /><div><p className="text-[0.6rem] font-bold uppercase tracking-[0.13em] text-paper/55">{label}</p><h3 className="mt-2 font-display text-lg font-bold leading-[1.02] tracking-[-0.04em]">{title}</h3><p className="mt-2 text-xs leading-5 text-paper/60">{detail}</p></div></article>; }
function QuickLink({ icon: Icon, title, detail }: { icon: typeof Megaphone; title: string; detail: string }) { return <article className="bg-[#eef0f1] p-6"><Icon className="text-signal" size={21} aria-hidden="true" /><h2 className="mt-8 font-display text-xl font-bold tracking-[-0.045em]">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p><span className="mt-6 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em]">Open <ArrowRight size={14} /></span></article>; }
