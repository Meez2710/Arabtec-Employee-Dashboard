import type { ReactNode } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/workspaceCopy";

export function Kicker({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  return <p className={bare ? "ws-kicker ws-kicker--bare" : "ws-kicker"}>{children}</p>;
}

type BadgeTone = "neutral" | "critical" | "important" | "success" | "info";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={tone === "neutral" ? "ws-badge" : `ws-badge ws-badge--${tone}`}>{children}</span>;
}

/**
 * The single empty state for the whole product. One quiet line.
 * `hint` is only ever passed for console-side surfaces.
 */
export function EmptyState({ message, hint, action }: { message?: string; hint?: string; action?: ReactNode }) {
  const { locale } = useLocale();
  return (
    <div className="ws-empty">
      <p>{message ?? copy.empty.default[locale]}</p>
      {hint ? <p className="ws-meta">{hint}</p> : null}
      {action}
    </div>
  );
}

export function LoadingState() {
  const { locale } = useLocale();
  return <p className="ws-loading" role="status" aria-live="polite">{copy.states.loading[locale]}</p>;
}
