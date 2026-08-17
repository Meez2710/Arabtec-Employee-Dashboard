/**
 * Arabtec Workspace homepage.
 * Every employee-facing content card is driven by published Workspace records. Missing or deleted records render a neutral empty state; no placeholder people, projects, announcements, or milestones are invented.
 */
import { type ReactNode, useMemo } from "react";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Globe2,
  HeartHandshake,
  Laptop,
  MoreHorizontal,
  PhoneCall,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { BriefingFooter } from "@/components/briefing/BriefingFooter";
import { BriefingHeader } from "@/components/briefing/BriefingHeader";
import { getWelcomeMessage } from "@/config/currentEmployee";
import { trpc } from "@/lib/trpc";

type DashboardSlot = "new_joiner" | "company_news" | "announcement" | "activity" | "industry_watch" | "opportunity";
type DashboardCard = { eyebrow: string; title: string; body: string; linkUrl: string | null; imageUrl: string | null };
type DashboardHoverCard = DashboardCard;

export default function Home() {
  const { data: storedCards } = trpc.workspace.listCards.useQuery(undefined, { retry: false });
  const { data: storedHoverCards } = trpc.workspace.listHoverCards.useQuery(undefined, { retry: false });
  const cards = useMemo(() => {
    const next: Partial<Record<DashboardSlot, DashboardCard>> = {};
    storedCards?.forEach(card => { next[card.slot as DashboardSlot] = { eyebrow: card.eyebrow, title: card.title, body: card.body, linkUrl: card.linkUrl, imageUrl: card.imageUrl }; });
    return next;
  }, [storedCards]);
  const hoverBySlot = useMemo(() => {
    const next: Partial<Record<DashboardSlot, DashboardHoverCard>> = {};
    storedHoverCards?.forEach(card => { if (!next[card.parentSlot as DashboardSlot]) next[card.parentSlot as DashboardSlot] = { eyebrow: card.eyebrow, title: card.title, body: card.body, linkUrl: card.linkUrl, imageUrl: card.imageUrl }; });
    return next;
  }, [storedHoverCards]);
  const metrics = useMemo(() => {
    const cards = storedCards ?? [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const announcements = cards.filter(card => card.slot === "announcement" && new Date(card.createdAt).getTime() >= sevenDaysAgo).length;
    const opportunities = cards.filter(card => card.slot === "opportunity").length;
    return [
      ...(announcements > 0 ? [{ icon: <BellRing />, value: announcements, label: "Announcements in the last 7 days" }] : []),
      ...(opportunities > 0 ? [{ icon: <BriefcaseBusiness />, value: opportunities, label: "Open opportunities" }] : []),
    ];
  }, [storedCards]);

  return <div id="home" className="dashboard-page"><BriefingHeader /><main className="dashboard-shell"><p className="dashboard-demo-label">Introductory demo · published content will appear when a Workspace Admin adds it</p><section className="dashboard-grid" aria-label="Arabtec employee workspace"><WelcomeCard metrics={metrics} /><ManagedCard title="Announcements" icon={<BellRing />} card={cards.announcement} hoverCard={hoverBySlot.announcement} /><EmptyModule title="This week" icon={<CalendarDays />} /><ManagedCard title="New joiners" icon={<UsersRound />} card={cards.new_joiner} hoverCard={hoverBySlot.new_joiner} media /><ManagedCard title="Company news" icon={<FileText />} card={cards.company_news} hoverCard={hoverBySlot.company_news} media /><ManagedCard title="Activities" icon={<HeartHandshake />} card={cards.activity} hoverCard={hoverBySlot.activity} media /><ManagedCard title="Industry watch" icon={<Globe2 />} card={cards.industry_watch} hoverCard={hoverBySlot.industry_watch} /><ManagedCard title="Internal opportunities" icon={<BriefcaseBusiness />} card={cards.opportunity} /><QuickAccess /><EmptyModule title="Policies & resources" icon={<BookOpen />} /></section></main><BriefingFooter /></div>;
}

function WelcomeCard({ metrics }: { metrics: Array<{ icon: ReactNode; value: number; label: string }> }) {
  const welcome = getWelcomeMessage();
  return <section className="dash-card dash-welcome-card"><p className="dash-eyebrow">Welcome</p><h1>{welcome.greeting}.</h1><p className="dash-welcome-date">{welcome.dateLabel}</p><p>Official employee communications will appear here when a Workspace Admin publishes them.</p>{metrics.length > 0 ? <div className="dash-derived-metrics">{metrics.map(metric => <div key={metric.label}><span>{metric.icon}</span><strong>{metric.value}</strong><p>{metric.label}</p></div>)}</div> : <NoUpdate />}</section>;
}

function ManagedCard({ title, icon, card, hoverCard, media = false }: { title: string; icon: ReactNode; card?: DashboardCard; hoverCard?: DashboardHoverCard; media?: boolean }) {
  if (!card) return <EmptyModule title={title} icon={icon} />;
  const content = <>{media && card.imageUrl && <img className="dash-card-media" src={card.imageUrl} alt="" />}<p className="dash-eyebrow">{card.eyebrow}</p><h2>{card.title}</h2><p className="dash-card-body">{card.body}</p>{card.linkUrl && <span className="dash-link-label">Open update <ArrowRight size={14} /></span>}</>;
  return <section className="dash-card dash-hoverable" tabIndex={0}><div className="dash-card-title-row"><h3>{title}</h3><span>{icon}</span></div>{card.linkUrl ? <a className="dash-card-content" href={card.linkUrl} target="_blank" rel="noreferrer">{content}</a> : <div className="dash-card-content">{content}</div>}<HoverOverlay card={hoverCard} /></section>;
}

function EmptyModule({ title, icon }: { title: string; icon: ReactNode }) { return <section className="dash-card dash-empty-card"><div className="dash-card-title-row"><h3>{title}</h3><span>{icon}</span></div><NoUpdate /></section>; }
function NoUpdate() { return <div className="dash-empty-state"><span>—</span><p>No update published yet</p></div>; }

function QuickAccess() {
  const items: Array<[ReactNode, string]> = [[<UsersRound />, "People directory"], [<FileText />, "Policies"], [<BookOpen />, "Learning"], [<Laptop />, "IT help"], [<ShieldCheck />, "Company systems"], [<PhoneCall />, "Support"], [<MoreHorizontal />, "More"]];
  return <section className="dash-card"><div className="dash-card-title-row"><h3>Quick access</h3></div><div className="dash-quick-grid">{items.map(([icon, label]) => <button type="button" key={label} aria-label={`${label} is not yet configured`}>{icon}<span>{label}</span></button>)}</div></section>;
}

function HoverOverlay({ card }: { card?: DashboardHoverCard }) { if (!card) return null; const content = <>{card.imageUrl && <img src={card.imageUrl} alt="" />}<p className="dash-eyebrow">{card.eyebrow}</p><h2>{card.title}</h2><p>{card.body}</p><span>Open details <ArrowRight size={14} /></span></>; return card.linkUrl ? <a className="dash-hover-overlay" href={card.linkUrl} target="_blank" rel="noreferrer">{content}</a> : <div className="dash-hover-overlay">{content}</div>; }
