/**
 * Arabtec Workspace design reminder:
 * An open, content-first employee intranet: date and welcome first; onboarding, internal opportunities, company news, announcements, calendar, and industry context follow in a clear editorial hierarchy. No generated imagery or login flows.
 */
import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coffee,
  FileText,
  GraduationCap,
  Landmark,
  Megaphone,
  Newspaper,
  PartyPopper,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BriefingFooter } from "@/components/briefing/BriefingFooter";
import { BriefingHeader } from "@/components/briefing/BriefingHeader";

const updates = [
  { category: "Company news", title: "Marina Tower reaches its next delivery milestone", body: "The project team shares a short update on the completed handover sequence and the weeks ahead.", date: "Today", accent: "ink" },
  { category: "People & culture", title: "The August learning calendar is now open", body: "Register for project controls, site leadership, and HSE refresher sessions through the Academy.", date: "Today", accent: "signal" },
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
  const visibleJobs = showAllJobs ? jobs : jobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BriefingHeader />
      <main>
        <section id="today" className="border-b-2 border-ink bg-[#e9ebed]">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.24fr_0.76fr]">
            <div className="relative px-4 py-9 md:px-8 md:py-14 lg:px-12 lg:py-16">
              <div className="absolute inset-y-9 start-4 border-s-[6px] border-s-signal md:inset-y-14 md:start-8 lg:inset-y-16 lg:start-12" />
              <div className="ms-5 max-w-3xl md:ms-7">
                <p className="workspace-kicker">Monday · 17 August 2026</p>
                <h1 className="mt-4 font-display text-4xl font-bold leading-[0.92] tracking-[-0.075em] sm:text-5xl md:text-6xl">Good morning.<br />Here is what matters today.</h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-ink/75 md:text-lg">Your workspace for people updates, company communications, learning, events, and the context you need before the day moves on.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="workspace-today-chip"><Clock3 size={16} aria-hidden="true" /><span><strong>08:30</strong> · Start of day</span></div>
                  <div className="workspace-today-chip"><Coffee size={16} aria-hidden="true" /><span><strong>12:30</strong> · Team lunch window</span></div>
                  <div className="workspace-today-chip"><CalendarDays size={16} aria-hidden="true" /><span><strong>3</strong> events this week</span></div>
                </div>
              </div>
            </div>

            <aside className="border-t-2 border-ink bg-ink p-6 text-paper lg:border-s-2 lg:border-t-0 lg:p-8" aria-label="Today at a glance">
              <p className="workspace-kicker text-signal">Today at Arabtec</p>
              <div className="mt-6 divide-y divide-paper/20 border-y border-paper/20">
                <TodayMetric value="01" label="company announcement" detail="Requires all staff attention" />
                <TodayMetric value="04" label="internal opportunities" detail="Open across Projects & HSE" />
                <TodayMetric value="03" label="new joiners this week" detail="Welcome session on Tuesday" />
              </div>
              <a href="#announcements" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline decoration-signal decoration-2 underline-offset-8">Read today’s notices <ArrowRight size={16} aria-hidden="true" /></a>
            </aside>
          </div>
        </section>

        {!noticeDismissed && (
          <section id="announcements" className="border-b-2 border-ink bg-white">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-4 py-5 md:px-8 lg:px-12">
              <div className="flex min-w-0 items-start gap-3">
                <BellRing className="mt-0.5 shrink-0 text-signal" size={20} aria-hidden="true" />
                <div>
                  <p className="workspace-kicker">Important announcement</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ink sm:text-base">Wednesday’s site-safety briefing begins at 10:30. Teams working on live projects should complete the updated induction reminder before the session.</p>
                </div>
              </div>
              <button onClick={() => setNoticeDismissed(true)} type="button" className="workspace-dismiss">Dismiss</button>
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(330px,0.75fr)] lg:gap-12 lg:px-12 lg:py-14">
          <div id="company-news">
            <SectionHeading kicker="Company news" title="The latest from around the business." body="Clear updates from projects, people, and the teams that keep work moving." />
            <div className="mt-7 divide-y-2 divide-ink border-y-2 border-ink">
              {updates.map((update, index) => (
                <article key={update.title} className="workspace-story group">
                  <div className={`workspace-story-index ${update.accent === "signal" ? "text-signal" : "text-ink"}`}>0{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="workspace-kicker">{update.category}</p><span className="text-xs font-semibold text-muted-foreground">{update.date}</span></div>
                    <h3 className="mt-2 font-display text-2xl font-bold leading-tight tracking-[-0.05em] text-ink transition group-hover:text-signal">{update.title}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{update.body}</p>
                  </div>
                  <ChevronRight className="mt-2 shrink-0 transition group-hover:translate-x-1 rtl:rotate-180" size={19} aria-hidden="true" />
                </article>
              ))}
            </div>
            <button type="button" className="workspace-text-link mt-6">View all company news <ArrowRight size={16} aria-hidden="true" /></button>
          </div>

          <section id="onboarding" className="border-2 border-ink bg-white p-5 sm:p-6" aria-labelledby="onboarding-title">
            <div className="flex items-start justify-between gap-4"><div><p className="workspace-kicker">Onboarding</p><h2 id="onboarding-title" className="mt-2 font-display text-3xl font-bold tracking-[-0.065em]">Start here, together.</h2></div><GraduationCap className="text-signal" size={24} aria-hidden="true" /></div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Three colleagues begin this week. Share the practical information that helps them find their footing on day one.</p>
            <div className="mt-6 divide-y divide-ink/20 border-y border-ink/25">
              <OnboardingTask complete label="Welcome note and team introductions" />
              <OnboardingTask complete label="Workplace and safety essentials" />
              <OnboardingTask label="Meet your project buddy" />
            </div>
            <button type="button" className="mt-6 flex w-full items-center justify-between border-2 border-ink px-4 py-3 text-start text-sm font-semibold transition hover:bg-ink hover:text-white">Open the newcomer hub <ArrowRight size={16} aria-hidden="true" /></button>
          </section>
        </section>

        <section id="opportunities" className="border-y-2 border-ink bg-white">
          <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-8 lg:px-12 lg:py-14">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b-2 border-ink pb-6">
              <SectionHeading kicker="Internal opportunities" title="Move your next role closer." body="Open roles, projects, and referrals from across Arabtec." />
              <div className="workspace-icon-tile"><BriefcaseBusiness size={21} /><span>04 open</span></div>
            </div>
            <div className="grid divide-y divide-ink/20 border-b border-ink/20 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {visibleJobs.map((job, index) => (
                <article key={job.title} className="workspace-job group">
                  <span className="font-display text-3xl font-bold tracking-[-0.07em] text-signal">0{index + 1}</span>
                  <div className="min-w-0 flex-1"><h3 className="font-display text-xl font-bold tracking-[-0.045em]">{job.title}</h3><p className="mt-1 text-sm text-muted-foreground">{job.location}</p><div className="mt-4 flex flex-wrap gap-2"><span className="workspace-tag">{job.type}</span><span className="workspace-tag workspace-tag--ink">{job.closing}</span></div></div>
                  <ChevronRight className="mt-1 shrink-0 group-hover:text-signal rtl:rotate-180" size={18} aria-hidden="true" />
                </article>
              ))}
            </div>
            <button type="button" onClick={() => setShowAllJobs(value => !value)} className="workspace-text-link mt-6">{showAllJobs ? "Show fewer roles" : "View all internal opportunities"} <ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,1.1fr)] lg:gap-12 lg:px-12 lg:py-14">
          <section id="calendar" aria-labelledby="calendar-title"><SectionHeading kicker="Holidays & events" title="Put the week in context." body="Official notices and shared moments, in one place." />
            <div className="mt-7 divide-y-2 divide-ink border-y-2 border-ink">
              {events.map(event => <article key={event.title} className="workspace-event"><div className="w-14 shrink-0 border-e border-ink/20 text-center"><p className="font-display text-3xl font-bold tracking-[-0.07em]">{event.date}</p><p className="text-[0.58rem] font-bold tracking-[0.14em] text-signal">{event.month}</p></div><div className="ps-4"><p className="workspace-kicker">{event.tag}</p><h3 className="mt-1 font-display text-xl font-bold tracking-[-0.045em]">{event.title}</h3><p className="mt-1 text-sm text-muted-foreground">{event.meta}</p></div></article>)}
            </div>
            <div className="mt-6 flex items-start gap-3 border-s-4 border-signal bg-white p-4"><Landmark size={18} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" /><p className="text-sm leading-6 text-ink/75">Official holidays appear here after HR publishes the confirmed calendar notice.</p></div>
          </section>

          <section id="industry-watch" className="bg-ink p-6 text-paper sm:p-8" aria-labelledby="industry-watch-title"><div className="flex items-start justify-between gap-4"><div><p className="workspace-kicker text-signal">Industry watch</p><h2 id="industry-watch-title" className="mt-2 font-display text-3xl font-bold leading-[0.96] tracking-[-0.065em]">External context, made useful.</h2></div><Newspaper className="text-signal" size={24} aria-hidden="true" /></div><p className="mt-4 max-w-lg text-sm leading-6 text-paper/65">A focused view of topics that matter to our people and project teams—not a noisy news feed.</p><div className="mt-7 divide-y divide-paper/20 border-y border-paper/20">{industryBriefs.map((brief, index) => <article key={brief.topic} className="flex gap-4 py-5"><span className="font-display text-xl font-bold text-signal">0{index + 1}</span><div><h3 className="font-display text-lg font-bold tracking-[-0.04em]">{brief.topic}</h3><p className="mt-1 text-sm leading-6 text-paper/65">{brief.detail}</p></div></article>)}</div><button type="button" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline decoration-signal decoration-2 underline-offset-8">Open the industry briefing <ArrowRight size={16} aria-hidden="true" /></button></section>
        </section>

        <section className="border-t-2 border-ink bg-[#eef0f1]"><div className="mx-auto grid max-w-[1440px] gap-px border-x border-ink/20 bg-ink/20 sm:grid-cols-3"><QuickLink icon={Megaphone} title="Announcements" detail="Official notices and employee guidance" /><QuickLink icon={Sparkles} title="Learning hub" detail="Courses, sessions, and shared practice" /><QuickLink icon={UsersRound} title="People directory" detail="Find the colleagues and teams you need" /></div></section>
      </main>
      <BriefingFooter />
    </div>
  );
}

function TodayMetric({ value, label, detail }: { value: string; label: string; detail: string }) { return <div className="flex items-start gap-4 py-5"><span className="font-display text-4xl font-bold tracking-[-0.08em] text-signal">{value}</span><div><p className="text-sm font-bold uppercase tracking-[0.09em]">{label}</p><p className="mt-1 text-xs text-paper/55">{detail}</p></div></div>; }
function SectionHeading({ kicker, title, body }: { kicker: string; title: string; body: string }) { return <div><p className="workspace-kicker">{kicker}</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.065em] sm:text-4xl">{title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p></div>; }
function OnboardingTask({ complete = false, label }: { complete?: boolean; label: string }) { return <div className="flex items-center gap-3 py-4"><CheckCircle2 size={18} className={complete ? "text-ready" : "text-ink/25"} aria-hidden="true" /><span className={`text-sm font-semibold ${complete ? "text-ink" : "text-ink/65"}`}>{label}</span></div>; }
function QuickLink({ icon: Icon, title, detail }: { icon: typeof Megaphone; title: string; detail: string }) { return <article className="bg-[#eef0f1] p-6"><Icon className="text-signal" size={21} aria-hidden="true" /><h2 className="mt-8 font-display text-xl font-bold tracking-[-0.045em]">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p><span className="mt-6 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em]">Open <ArrowRight size={14} /></span></article>; }
