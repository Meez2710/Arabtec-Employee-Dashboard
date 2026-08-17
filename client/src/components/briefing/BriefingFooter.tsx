/**
 * Arabtec Executive Briefing design reminder:
 * Keep the closing line compact and operational, with the same editorial restraint as the header.
 */
export function BriefingFooter() {
  return (
    <footer className="mt-14 border-t-2 border-ink bg-ink px-4 py-6 text-paper md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-[13px]">
        <p className="font-display text-[15px] font-bold tracking-normal">arabtec workspace</p>
        <p className="text-paper/80">Employee workspace · internal communications</p>
      </div>
    </footer>
  );
}
