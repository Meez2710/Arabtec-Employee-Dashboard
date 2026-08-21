import type { ReactNode } from "react";
import { Link } from "wouter";
import { Languages, LogOut } from "lucide-react";
import type { WorkspaceCapability } from "@shared/workspaceCapabilities";
import { useLocale } from "@/contexts/LocaleContext";
import { consoleText } from "@/lib/consoleCopy";
import { consoleSections, type ConsoleSection } from "./adminShared";

type AdminShellProps = {
  section: ConsoleSection;
  capabilities: readonly WorkspaceCapability[];
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  attentionCount?: number;
  onSignOut: () => void;
  children: ReactNode;
};

export function AdminShell({ section, capabilities, user, attentionCount = 0, onSignOut, children }: AdminShellProps) {
  const { locale, toggleLocale } = useLocale();
  const c = consoleText(locale);
  const allowed = consoleSections.filter(entry => capabilities.includes(entry.capability));
  const role = user?.role as keyof typeof c.roles | undefined;

  return (
    <div className="adm">
      <aside className="adm__side">
        <Link href="/" className="adm__brand">
          <img src="/brand/arabtec-mark.svg" alt="" width={34} height={22} />
          <span>{c.brand}</span>
        </Link>
        <nav className="adm__nav" aria-label={c.sectionsNav}>
          {allowed.map(entry => (
            <Link
              key={entry.key}
              href={entry.key === "overview" ? "/admin" : `/admin/${entry.key}`}
              className={section === entry.key ? "is-active" : undefined}
              aria-current={section === entry.key ? "page" : undefined}
            >
              {c.nav[entry.key]}
              {entry.key === "overview" && attentionCount > 0 && <span className="adm__nav-count">{attentionCount}</span>}
            </Link>
          ))}
        </nav>
        <div className="adm__who">
          <button type="button" className="ws-btn ws-btn--sm adm__lang" onClick={toggleLocale} aria-label={c.switchLanguageLabel} lang={locale === "en" ? "ar" : "en"}>
            <Languages size={14} aria-hidden="true" /> {c.switchLanguage}
          </button>
          <strong>{user?.name || user?.email || c.signedIn}</strong>
          <span>{role ? c.roles[role] ?? role : c.noAccess}</span>
          <button type="button" className="ws-btn ws-btn--sm" onClick={onSignOut}>
            <LogOut size={14} aria-hidden="true" /> {c.signOut}
          </button>
        </div>
      </aside>
      <div className="adm__main">{children}</div>
    </div>
  );
}
