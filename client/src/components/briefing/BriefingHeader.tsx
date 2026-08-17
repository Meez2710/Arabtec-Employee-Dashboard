/**
 * Arabtec Workspace design reminder:
 * This is an open employee homepage: compact editorial navigation, paper canvas, carbon rules, and no account or authentication controls.
 */
import { Search } from "lucide-react";

export function BriefingHeader() {
  return (
    <header className="border-b-2 border-ink bg-paper px-4 py-4 md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
        <a href="#today" className="flex items-center gap-3 text-ink no-underline">
          <img src="/manus-storage/arabtec-angular-mark_3d43127c.png" alt="Arabtec" className="h-9 w-9 object-contain" />
          <div className="leading-none">
            <p className="font-display text-[1.2rem] font-bold tracking-[-0.065em]">arabtec</p>
            <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">employee workspace</p>
          </div>
        </a>

        <nav aria-label="Employee workspace sections" className="order-3 flex w-full items-center gap-4 overflow-x-auto border-t border-ink/20 pt-3 text-[0.72rem] font-bold uppercase tracking-[0.08em] sm:gap-6 md:order-2 md:w-auto md:border-0 md:pt-0">
          <a className="workspace-nav-link workspace-nav-link--active" href="#today">Today</a>
          <a className="workspace-nav-link" href="#onboarding">Onboarding</a>
          <a className="workspace-nav-link" href="#opportunities">Careers</a>
          <a className="workspace-nav-link" href="#company-news">Company news</a>
          <a className="workspace-nav-link" href="#calendar">Calendar</a>
        </nav>

        <a href="#industry-watch" aria-label="Find an item in the workspace" className="flex h-9 w-9 items-center justify-center border border-ink bg-white text-ink transition hover:bg-ink hover:text-white">
          <Search size={17} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
