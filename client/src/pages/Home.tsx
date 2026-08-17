/**
 * Arabtec Workspace design reminder:
 * This production homepage follows the supplied dashboard reference: open employee access, compact white cards, red signal accents, and a secondary middle/right new-joiner image. Card destinations and media are read from the public workspace-card source.
 */
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Globe2,
  HeartHandshake,
  Laptop,
  MapPin,
  MoreHorizontal,
  PhoneCall,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { BriefingFooter } from "@/components/briefing/BriefingFooter";
import { BriefingHeader } from "@/components/briefing/BriefingHeader";
import { trpc } from "@/lib/trpc";

type DashboardSlot = "new_joiner" | "company_news" | "announcement" | "activity" | "industry_watch" | "opportunity";
type DashboardCard = { eyebrow: string; title: string; body: string; linkUrl: string | null; imageUrl: string | null; active?: number };

const fallbackCards: Record<DashboardSlot, DashboardCard> = {
  new_joiner: { eyebrow: "New to Arabtec", title: "Mohamed Tarek", body: "Site Engineer · Project Delivery. Mohamed brings five years of construction and site-execution experience. Give him a warm Arabtec welcome.", linkUrl: null, imageUrl: "/manus-storage/arabtec-new-joiner-supporting_a59391ca.jpg" },
  company_news: { eyebrow: "Project update", title: "Marina Tower reaches its next delivery milestone", body: "The delivery team has completed its next critical package and is preparing the handover sequence.", linkUrl: "https://www.arabtec.com", imageUrl: "/manus-storage/arabtec-onboarding-roadmap_05a4b024.jpg" },
  announcement: { eyebrow: "Safety", title: "Updated site induction reminder", body: "Complete the updated induction reminder before Wednesday’s safety briefing.", linkUrl: null, imageUrl: null },
  activity: { eyebrow: "Activities", title: "Employee Sports Day", body: "Building connections beyond the workplace.", linkUrl: null, imageUrl: "/manus-storage/arabtec-onboarding-community_f74340e9.jpg" },
  industry_watch: { eyebrow: "Market intelligence", title: "Construction market outlook", body: "Relevant industry signals for project, commercial, and site teams.", linkUrl: "https://www.arabtec.com", imageUrl: null },
  opportunity: { eyebrow: "Internal opportunity", title: "Planning Engineer", body: "Cairo · Projects · Internal move. Applications close 21 August.", linkUrl: null, imageUrl: null },
};

const roadmap = ["Welcome / Onboarding", "Company News", "Announcements", "Events & Activities", "Internal Opportunities", "People Directory", "Resources", "Industry Watch"];

export default function Home() {
  const { data: storedCards } = trpc.workspace.listCards.useQuery(undefined, { retry: false });
  const [newsIndex, setNewsIndex] = useState(0);
  const cards = useMemo(() => {
    const next = { ...fallbackCards };
    storedCards?.forEach(card => { next[card.slot as DashboardSlot] = { eyebrow: card.eyebrow, title: card.title, body: card.body, linkUrl: card.linkUrl, imageUrl: card.imageUrl, active: card.active }; });
    return next;
  }, [storedCards]);
  const newsCards = [cards.company_news, { ...cards.industry_watch, eyebrow: "Industry watch", title: "Procurement and supplier updates" }, { ...cards.activity, eyebrow: "People & culture", title: "The August learning calendar is now open", body: "Register for project controls, site leadership, and HSE refresher sessions." }];
  const featuredNews = newsCards[newsIndex];

  return (
    <div id="home" className="dashboard-page">
      <BriefingHeader />
      <main className="dashboard-shell">
        <section className="dashboard-grid" aria-label="Arabtec employee workspace">
          <WelcomeCard />
          <NewJoinerCard card={cards.new_joiner} />
          <OnboardingProgress />

          <div className="dashboard-column dashboard-column--left" id="company"><CompanyNews card={featuredNews} index={newsIndex} onPrevious={() => setNewsIndex(current => (current + newsCards.length - 1) % newsCards.length)} onNext={() => setNewsIndex(current => (current + 1) % newsCards.length)} /><InternalOpportunities card={cards.opportunity} /></div>
          <div className="dashboard-column"><Announcements card={cards.announcement} /><Activities card={cards.activity} /></div>
          <div className="dashboard-column"><ThisWeek /><QuickAccess /></div>
          <div className="dashboard-column"><IndustryWatch card={cards.industry_watch} /><Policies /></div>
        </section>
        <MobilePreview card={cards.company_news} />
      </main>
      <Roadmap />
      <BriefingFooter />
    </div>
  );
}

function WelcomeCard() {
  return <section className="dash-welcome-card"><p className="dash-eyebrow">Welcome back</p><h1>Good morning,<br /><span>Ahmed.</span></h1><p className="dash-welcome-copy">Here’s what’s happening at Arabtec today.</p><div className="dash-stat-grid"><Stat icon={<ClipboardCheck />} value="2" label="Actions for you" /><Stat icon={<CalendarDays />} value="3" label="Events this week" /><Stat icon={<BellRing />} value="4" label="New updates" /><Stat icon={<UsersRound />} value="7" label="People to meet" /></div></section>;
}

function NewJoinerCard({ card }: { card: DashboardCard }) {
  return <DashboardLink href={card.linkUrl} className="dash-new-joiner"><div className="dash-new-joiner-image">{card.imageUrl ? <img src={card.imageUrl} alt={`New Arabtec colleague ${card.title}`} /> : <div className="dash-empty-media"><UsersRound size={28} /></div>}</div><div className="dash-new-joiner-copy"><p className="dash-eyebrow">{card.eyebrow}</p><h2>{card.title}</h2><span className="dash-red-line" /><p>{card.body}</p><div className="dash-card-pager"><span><ChevronLeft size={15} /> 1 / 4 <ChevronRight size={15} /></span></div></div></DashboardLink>;
}

function OnboardingProgress() {
  const steps = ["Learn about Arabtec", "Meet your team", "Set up your systems", "Site visit", "Follow-up session"];
  return <section className="dash-onboarding-card"><p className="dash-eyebrow">Your onboarding journey</p><div className="dash-progress-heading"><h2>Day 4 of 7</h2><strong>80%</strong></div><div className="dash-progress-track"><span /></div><ul>{steps.map((step, index) => <li key={step} className={index < 3 ? "complete" : index === 3 ? "current" : "pending"}><span>{index < 3 ? "✓" : ""}</span>{step}</li>)}</ul><button type="button" className="dash-red-button">Continue your journey <ArrowRight size={16} /></button></section>;
}

function CompanyNews({ card, index, onPrevious, onNext }: { card: DashboardCard; index: number; onPrevious: () => void; onNext: () => void }) {
  return <section className="dash-card" aria-labelledby="company-news-title"><div className="dash-card-title-row"><h2 id="company-news-title">Company news</h2><span className="dash-pager"><button onClick={onPrevious} aria-label="Previous story"><ChevronLeft size={14} /></button>{index + 1} / 3<button onClick={onNext} aria-label="Next story"><ChevronRight size={14} /></button></span></div><DashboardLink href={card.linkUrl} className="dash-news-feature">{card.imageUrl && <img src={card.imageUrl} alt="" />}<div><p className="dash-eyebrow">{card.eyebrow}</p><h3>{card.title}</h3><p>{card.body}</p><span className="dash-link-label">Read more <ArrowRight size={15} /></span></div></DashboardLink></section>;
}

function Announcements({ card }: { card: DashboardCard }) {
  const items = [card, { eyebrow: "HR", title: "Updated attendance policy", body: "Effective 1 September", linkUrl: null, imageUrl: null }, { eyebrow: "Operations", title: "New project coordination procedure", body: "Available to all site teams", linkUrl: null, imageUrl: null }];
  return <section className="dash-card"><div className="dash-card-title-row"><h2>Announcements</h2></div><div className="dash-list">{items.map((item, index) => <DashboardLink key={`${item.title}-${index}`} href={item.linkUrl} className="dash-announcement-row"><span className={`dash-list-icon dash-list-icon--${index}`}><BellRing size={16} /></span><div><p className="dash-mini-label">{item.eyebrow}</p><h3>{item.title}</h3><p>{item.body}</p></div>{index < 2 ? <span className="dash-unread-dot" /> : <ChevronRight size={16} />}</DashboardLink>)}</div><a href="#resources" className="dash-bottom-link">View all announcements <ArrowRight size={15} /></a></section>;
}

function ThisWeek() {
  const items = [["19", "AUG", "New Joiner Welcome", "09:30 AM · Head Office & Teams"], ["21", "AUG", "Project Controls Knowledge Share", "01:00 PM · Learning Hub"], ["25", "AUG", "Health & Safety Activity", "10:00 AM · All Sites"]];
  return <section className="dash-card"><div className="dash-card-title-row"><h2>This week</h2><a href="#calendar">View all <ArrowRight size={14} /></a></div><div className="dash-week-list">{items.map(item => <a href="#calendar" key={item[2]}><span><b>{item[0]}</b>{item[1]}</span><div><h3>{item[2]}</h3><p>{item[3]}</p></div></a>)}</div></section>;
}

function IndustryWatch({ card }: { card: DashboardCard }) {
  const items = [card, { eyebrow: "Procurement", title: "Latest trends & supplier updates", body: "3 min read", linkUrl: "https://www.arabtec.com", imageUrl: null }, { eyebrow: "Safety", title: "Best practices for site safety", body: "5 min read", linkUrl: "https://www.arabtec.com", imageUrl: null }];
  return <section className="dash-card"><div className="dash-card-title-row"><h2>Industry watch</h2><a href="#industry">View all <ArrowRight size={14} /></a></div><div className="dash-industry-list">{items.map((item, index) => <DashboardLink key={item.title} href={item.linkUrl} className="dash-industry-row"><span><Globe2 size={16} /></span><div><p className="dash-mini-label">{index === 0 ? item.eyebrow : ""}</p><h3>{item.title}</h3><p>{item.body}</p></div></DashboardLink>)}</div></section>;
}

function InternalOpportunities({ card }: { card: DashboardCard }) {
  const jobs = [card, { eyebrow: "Internal move", title: "Commercial Manager", body: "New Alamein · Commercial · Closes 24 Aug", linkUrl: null, imageUrl: null }];
  return <section id="careers" className="dash-card"><div className="dash-card-title-row"><h2>Internal opportunities</h2><span className="dash-open-count">04 Open Positions</span></div><div className="dash-jobs-list">{jobs.map(job => <DashboardLink key={job.title} href={job.linkUrl} className="dash-job-row"><BriefcaseBusiness size={17} /><div><h3>{job.title}</h3><p>{job.body}</p></div><ChevronRight size={16} /></DashboardLink>)}</div><a href="#careers" className="dash-bottom-link">View all opportunities <ArrowRight size={15} /></a></section>;
}

function Activities({ card }: { card: DashboardCard }) { return <section className="dash-card"><div className="dash-card-title-row"><h2>Activities</h2><a href="#calendar">View all <ArrowRight size={14} /></a></div><DashboardLink href={card.linkUrl} className="dash-activity-card">{card.imageUrl ? <img src={card.imageUrl} alt="" /> : <div className="dash-empty-media"><HeartHandshake size={28} /></div>}<div><p className="dash-eyebrow">{card.eyebrow}</p><h3>{card.title}</h3><p>{card.body}</p></div></DashboardLink><div className="dash-dots"><span className="active" /><span /><span /><span /></div></section>; }

function QuickAccess() { const items: Array<[ReactNode, string, string]> = [[<UsersRound />, "HR Services", "#resources"], [<FileText />, "Policies", "#resources"], [<BookOpen />, "Learning", "#resources"], [<Laptop />, "IT Help", "#resources"], [<UsersRound />, "People Directory", "#company"], [<ClipboardCheck />, "Forms", "#resources"], [<ShieldCheck />, "Company Systems", "https://www.arabtec.com"], [<PhoneCall />, "ATS", "#careers"]]; return <section className="dash-card"><div className="dash-card-title-row"><h2>Quick access</h2></div><div className="dash-quick-grid">{items.map(([icon, label, href]) => <a href={href} key={label}>{icon}<span>{label}</span></a>)}<button type="button"><MoreHorizontal /><span>More</span></button></div></section>; }

function Policies() { const items = ["Employee Handbook", "HR Policies", "Forms & Templates", "Company Guidelines"]; return <section id="resources" className="dash-card"><div className="dash-card-title-row"><h2>Policies & resources</h2></div><div className="dash-resource-list">{items.map(item => <a href="https://www.arabtec.com" target="_blank" rel="noreferrer" key={item}><FileText size={16} /><span>{item}</span><ChevronRight size={15} /></a>)}</div><a href="#resources" className="dash-bottom-link">View all resources <ArrowRight size={15} /></a></section>; }

function MobilePreview({ card }: { card: DashboardCard }) { return <aside className="dash-mobile-preview"><p className="dash-eyebrow">Mobile preview</p><div className="dash-phone"><div className="dash-phone-notch" /><div className="dash-phone-screen"><div className="dash-phone-top"><span>☰</span><img src="/manus-storage/arabtec-official-logo_467b325f.svg" alt="" /><BellRing size={15} /></div><p className="dash-eyebrow">Welcome back</p><h2>Good morning,<br /><span>Ahmed.</span></h2><p>Here’s what’s happening at Arabtec today.</p><div className="dash-phone-journey"><p>Your onboarding journey</p><b>Day 4 of 7 <em>80%</em></b><i><span /></i><button>Continue your journey <ArrowRight size={12} /></button></div><div className="dash-phone-news"><p>Company news</p>{card.imageUrl && <img src={card.imageUrl} alt="" />}<h3>{card.title}</h3><span>Read more <ArrowRight size={11} /></span></div><div className="dash-phone-nav"><span>⌂<b>Home</b></span><span>▧<b>Company</b></span><span>♧<b>Careers</b></span><span>•••<b>More</b></span></div></div></div><div className="dash-benefits"><p className="dash-eyebrow">Key benefits</p>{["Personalized employee experience", "Important updates in one place", "Relevant industry insights", "Easy access to what you need", "Stay informed and connected", "Opportunities for growth and development"].map(item => <p key={item}>✓ {item}</p>)}</div></aside>; }

function Roadmap() { return <section className="dash-roadmap"><div><p className="dash-eyebrow">Our modular roadmap</p><div className="dash-roadmap-row">{roadmap.map((item, index) => <div key={item}><span>{index + 1}</span><p>{item}</p>{index < roadmap.length - 1 && <ArrowRight size={16} />}</div>)}</div></div></section>; }
function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) { return <a href="#resources" className="dash-stat"><span>{icon}</span><b>{value}</b><p>{label}</p><em>View all <ArrowRight size={12} /></em></a>; }
function DashboardLink({ href, className, children }: { href: string | null; className: string; children: ReactNode }) { return href ? <a className={className} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{children}</a> : <div className={className}>{children}</div>; }
