import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, BriefcaseBusiness, Home as HomeIcon, Newspaper, Search, X } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/workspaceCopy";

const navItems = [
  { href: "/", key: "home", Icon: HomeIcon },
  { href: "/updates", key: "updates", Icon: Newspaper },
  { href: "/opportunities", key: "opportunities", Icon: BriefcaseBusiness },
  { href: "/resources", key: "resources", Icon: BookOpen },
] as const;

type AppShellProps = {
  children: ReactNode;
  query?: string;
  onQueryChange?: (value: string) => void;
  /** Console preview renders the same shell without the sticky chrome. */
  embedded?: boolean;
};

export function AppShell({ children, query, onQueryChange, embedded = false }: AppShellProps) {
  const { locale, toggleLocale } = useLocale();
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchable = typeof onQueryChange === "function";

  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <div className="ws-page">
      <a className="ws-skip" href="#ws-main">{locale === "ar" ? "تخطٍ إلى المحتوى" : "Skip to content"}</a>
      <header className="ws-header">
        <div className="ws-header-inner">
          <Link href="/" className="ws-brand">
            <img src="/brand/arabtec-mark.svg" alt="" width={40} height={26} />
            <span>{copy.brand[locale]}</span>
          </Link>
          <nav className="ws-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? "is-active" : undefined} aria-current={isActive(item.href) ? "page" : undefined}>
                {copy.nav[item.key][locale]}
              </Link>
            ))}
          </nav>
          <div className="ws-actions">
            {searchable && searchOpen && (
              <div className="ws-search" role="search">
                <Search size={16} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query ?? ""}
                  onChange={event => onQueryChange?.(event.target.value)}
                  placeholder={copy.actions.search[locale]}
                  aria-label={copy.actions.search[locale]}
                />
              </div>
            )}
            {searchable && (
              <button
                type="button"
                className="ws-icon-btn"
                onClick={() => { if (searchOpen) onQueryChange?.(""); setSearchOpen(open => !open); }}
                aria-label={searchOpen ? copy.actions.closeSearch[locale] : copy.actions.openSearch[locale]}
                aria-expanded={searchOpen}
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
            )}
            <button type="button" className="ws-icon-btn ws-lang" onClick={toggleLocale} aria-label={copy.actions.switchLanguageLabel[locale]} lang={locale === "en" ? "ar" : "en"}>
              {copy.actions.switchLanguage[locale]}
            </button>
          </div>
        </div>
      </header>

      <main className="ws-main" id="ws-main">{children}</main>

      {!embedded && (
        <nav className="ws-mobile-nav" aria-label={locale === "ar" ? "التنقل السريع" : "Quick navigation"}>
          {navItems.map(({ href, key, Icon }) => (
            <Link key={href} href={href} className={isActive(href) ? "is-active" : undefined} aria-current={isActive(href) ? "page" : undefined}>
              <Icon size={20} aria-hidden="true" />
              {copy.nav[key][locale]}
            </Link>
          ))}
        </nav>
      )}

      <footer className="ws-footer">
        <div className="ws-footer-inner">
          <strong>{copy.footer.line[locale]}</strong>
          <p className="ws-footer-note">{copy.footer.detail[locale]}</p>
        </div>
      </footer>
    </div>
  );
}
