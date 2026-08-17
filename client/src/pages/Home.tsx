/**
 * Option A — the requested layout:
 * A fixed welcome area at left; automated vertical onboarding and company-news feeds in the right content hub; and a non-scrolling utility rail at the far right.
 */
import { ArrowRight, BellRing, CalendarDays, CheckCircle2, ChevronRight, Clock3, FileText, MapPin, UsersRound } from "lucide-react";
import { BriefingFooter } from "@/components/briefing/BriefingFooter";
import { BriefingHeader } from "@/components/briefing/BriefingHeader";
import { LayoutOptionNav } from "@/components/workspace/LayoutOptionNav";

const onboarding = [
  { image: "/manus-storage/arabtec-onboarding-welcome_dca8351d.jpg", label: "Day 01", title: "Meet your people and your place.", text: "A guided first day with your team, buddy, and workplace essentials." },
  { image: "/manus-storage/arabtec-onboarding-roadmap_05a4b024.jpg", label: "Days 02–04", title: "Make the practical steps familiar.", text: "Systems, safety, and the project connections that make a difference." },
  { image: "/manus-storage/arabtec-onboarding-community_f74340e9.jpg", label: "Days 05–07", title: "Begin building your network.", text: "Find key contacts, learn the language of your team, and plan your next step." },
];

const news = [
  { label: "Project update", title: "Marina Tower reaches its next delivery milestone", detail: "The delivery sequence has moved into the next critical package.", value: "74%" },
  { label: "People & culture", title: "The August learning calendar is now open", detail: "Book project controls, site leadership, and HSE sessions.", value: "12" },
  { label: "Operations", title: "New project controls toolkit is available", detail: "Templates and coordination practices are now ready to use.", value: "06" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <BriefingHeader />
      <LayoutOptionNav />
      <main>
        <section className="mx-auto max-w-[1440px] px-5 py-5 md:px-8 lg:px-12 lg:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5"><div><p className="workspace-kicker">Option A · requested content hub</p><p className="mt-1 text-sm text-muted-foreground">Two automated feeds sit beside a fixed operational utility rail.</p></div><span className="option-intent-label">Automated feeds pause on hover</span></div>
          <div className="option-a-shell">
            <section className="option-a-welcome">
              <div>
                <div className="flex items-center gap-3"><span className="workspace-live-dot" /><p className="workspace-kicker">Monday · 17 August</p></div>
                <h1 className="mt-5 font-display text-5xl font-bold leading-[0.86] tracking-[-0.085em] sm:text-6xl lg:text-7xl">Welcome<br />to your<br /><span className="text-signal">next chapter.</span></h1>
                <p className="mt-7 max-w-md text-base leading-7 text-ink/75">A simple starting point for new employees: find your people, see what is happening, and build confidence through the first week.</p>
                <button type="button" className="workspace-primary-action mt-8">Open the welcome guide <ArrowRight size={17} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-ink/20 pt-5"><Metric icon={<Clock3 size={16} />} value="Day 01" text="Monday start" /><Metric icon={<UsersRound size={16} />} value="03 people" text="Your circle" /><Metric icon={<CalendarDays size={16} />} value="07 days" text="Onboarding plan" /></div>
            </section>

            <section className="option-a-feed-column" aria-label="Automated employee onboarding feed"><FeedHeading kicker="Onboarding" title="First-week flow" icon={<UsersRound size={18} />} /><div className="workspace-autofeed"><div className="workspace-autofeed-track">{onboarding.map(item => <OnboardingFeedCard key={item.title} item={item} />)}{onboarding.map(item => <OnboardingFeedCard key={`repeat-${item.title}`} item={item} hidden />)}</div></div><p className="feed-footnote">Hover to pause · scroll to explore</p></section>

            <section className="option-a-feed-column option-a-feed-column--news" aria-label="Automated company news feed"><FeedHeading kicker="Company news" title="What is moving" icon={<FileText size={18} />} /><div className="workspace-autofeed"><div className="workspace-autofeed-track workspace-autofeed-track--news">{news.map(item => <NewsFeedCard key={item.title} item={item} />)}{news.map(item => <NewsFeedCard key={`repeat-${item.title}`} item={item} hidden />)}</div></div><p className="feed-footnote">Curated updates · all staff</p></section>

            <aside className="option-a-utility-rail" aria-label="Fixed calendar, index, and upcoming activities">
              <div><p className="workspace-kicker text-signal">Fixed utility rail</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.06em]">Today, at a glance.</h2></div>
              <div className="utility-calendar"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.14em]">August 2026</span><CalendarDays size={17} className="text-signal" /></div><div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.65rem] text-paper/55">{"SMTWTFS".split("").map(day => <span key={day}>{day}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">{Array.from({ length: 28 }, (_, index) => <span key={index} className={index + 1 === 17 ? "utility-calendar-day--active" : "py-1"}>{index + 1}</span>)}</div></div>
              <div className="utility-index"><p className="workspace-kicker text-signal">Workspace index</p><a href="#onboarding">01 · New employee onboarding</a><a href="#company-news">02 · Company news</a><a href="#announcements">03 · Announcements</a><a href="#activities">04 · Activities and events</a></div>
              <div id="activities" className="utility-upcoming"><p className="workspace-kicker text-signal">Upcoming</p><UtilityItem day="19" title="New joiner welcome session" detail="09:30 · Head Office" /><UtilityItem day="21" title="Project controls knowledge share" detail="13:00 · Learning Hub" /><UtilityItem day="25" title="Official calendar update" detail="HR notice" /></div>
              <div id="announcements" className="utility-alert"><BellRing size={17} /><p><strong>Announcement:</strong> Complete the induction reminder before Wednesday’s safety briefing.</p></div>
            </aside>
          </div>
        </section>
      </main>
      <BriefingFooter />
    </div>
  );
}

function Metric({ icon, value, text }: { icon: React.ReactNode; value: string; text: string }) { return <div><span className="text-signal">{icon}</span><p className="mt-2 text-sm font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>; }
function FeedHeading({ kicker, title, icon }: { kicker: string; title: string; icon: React.ReactNode }) { return <div className="flex items-start justify-between gap-3 px-4 py-5"><div><p className="workspace-kicker text-signal">{kicker}</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.06em]">{title}</h2></div><span className="mt-1 text-signal">{icon}</span></div>; }
function OnboardingFeedCard({ item, hidden = false }: { item: typeof onboarding[number]; hidden?: boolean }) { return <article aria-hidden={hidden || undefined} className="feed-onboarding-card"><img src={item.image} alt="" /><div className="feed-image-shade" /><div className="relative p-4"><p className="feed-label">{item.label}</p><h3 className="mt-2 font-display text-xl font-bold leading-[0.95] tracking-[-0.05em]">{item.title}</h3><p className="mt-3 text-xs leading-5 text-paper/75">{item.text}</p></div></article>; }
function NewsFeedCard({ item, hidden = false }: { item: typeof news[number]; hidden?: boolean }) { return <article aria-hidden={hidden || undefined} className="feed-news-card"><div className="flex items-start justify-between gap-3"><p className="feed-label feed-label--dark">{item.label}</p><span className="font-display text-3xl font-bold tracking-[-0.08em] text-signal">{item.value}</span></div><h3 className="mt-6 font-display text-xl font-bold leading-[0.96] tracking-[-0.05em]">{item.title}</h3><p className="mt-3 text-sm leading-6 text-ink/65">{item.detail}</p><ChevronRight size={18} className="mt-4 text-signal" /></article>; }
function UtilityItem({ day, title, detail }: { day: string; title: string; detail: string }) { return <div className="flex gap-3 border-b border-paper/15 py-3"><span className="font-display text-2xl font-bold tracking-[-0.07em] text-signal">{day}</span><div><p className="text-sm font-semibold leading-5">{title}</p><p className="mt-1 text-xs text-paper/55">{detail}</p></div></div>; }
