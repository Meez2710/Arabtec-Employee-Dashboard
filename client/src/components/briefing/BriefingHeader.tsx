/**
 * Arabtec Executive Briefing design reminder:
 * Use a restrained editorial masthead, heavy rules, sharp details, and a single signal-red action.
 */
import { CalendarDays, ChevronDown, Languages, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type BriefingHeaderProps = {
  isArabic: boolean;
  onToggleLanguage: () => void;
};

export function BriefingHeader({ isArabic, onToggleLanguage }: BriefingHeaderProps) {
  const copy = isArabic
    ? {
        home: "الرئيسية",
        digest: "الملخص اليومي",
        readiness: "الجاهزية",
        search: "بحث",
        language: "EN",
        date: "الإثنين، 18 أغسطس 2026",
      }
    : {
        home: "Home",
        digest: "Daily digest",
        readiness: "Readiness",
        search: "Search",
        language: "العربية",
        date: "Monday, 18 August 2026",
      };

  return (
    <header className="border-b-2 border-ink bg-paper/95 px-4 py-4 backdrop-blur md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/manus-storage/arabtec-angular-mark_3d43127c.png"
            alt="Arabtec"
            className="h-9 w-9 object-contain"
          />
          <div className="leading-none">
            <p className="font-display text-[1.15rem] font-bold tracking-[-0.06em] text-ink">arabtec</p>
            <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Workspace · executive briefing
            </p>
          </div>
        </div>

        <nav aria-label={isArabic ? "التنقل الرئيسي" : "Primary navigation"} className="order-3 flex w-full items-center gap-5 border-t border-ink/20 pt-3 text-sm font-semibold md:order-2 md:w-auto md:border-0 md:pt-0">
          <button className="briefing-nav-item briefing-nav-item--active" type="button">
            {copy.home}
          </button>
          <button className="briefing-nav-item" type="button">
            {copy.digest}
          </button>
          <button className="briefing-nav-item" type="button">
            {copy.readiness}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 border-e border-ink/20 pe-3 text-xs text-muted-foreground sm:flex">
            <CalendarDays size={15} aria-hidden="true" />
            <span>{copy.date}</span>
          </div>
          <Button variant="outline" size="sm" className="briefing-icon-button" aria-label={copy.search}>
            <Search size={17} />
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleLanguage} className="briefing-language-button">
            <Languages size={16} aria-hidden="true" />
            <span>{copy.language}</span>
          </Button>
          <Button size="sm" className="briefing-user-button" aria-label={isArabic ? "فتح قائمة الحساب" : "Open account menu"}>
            <span>LH</span>
            <ChevronDown size={15} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
