/**
 * Arabtec Workspace design reminder:
 * This comparison control is intentionally small and explicit so the two homepage directions can be evaluated without disrupting the employee experience.
 */
import { Check, LayoutPanelTop, PanelsTopLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export function LayoutOptionNav() {
  const [location] = useLocation();
  const optionA = location === "/" || location === "/option-a";
  return (
    <div className="border-b border-ink/15 bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8 lg:px-12">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.13em] text-muted-foreground">Layout comparison · choose a direction</p>
        <div className="flex gap-2">
          <Link href="/option-a" className={`layout-option-link ${optionA ? "layout-option-link--active" : ""}`}><PanelsTopLeft size={14} /> Option A {optionA && <Check size={13} />}</Link>
          <Link href="/option-b" className={`layout-option-link ${!optionA ? "layout-option-link--active" : ""}`}><LayoutPanelTop size={14} /> Option B {!optionA && <Check size={13} />}</Link>
        </div>
      </div>
    </div>
  );
}
