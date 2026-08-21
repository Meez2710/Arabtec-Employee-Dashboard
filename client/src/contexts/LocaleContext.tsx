import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type WorkspaceLocale = "en" | "ar";
type LocaleContextValue = { locale: WorkspaceLocale; setLocale: (locale: WorkspaceLocale) => void; toggleLocale: () => void; };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // A shared link's ?locale= wins over the stored preference, in both
  // directions — previously only ?locale=ar was honoured, so an English link
  // sent to a colleague still opened in Arabic.
  const [locale, setLocale] = useState<WorkspaceLocale>(() => {
    const requested = new URLSearchParams(window.location.search).get("locale");
    if (requested === "ar" || requested === "en") return requested;
    return window.localStorage.getItem("arabtec-workspace-locale") === "ar" ? "ar" : "en";
  });
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === "ar" ? "rtl" : "ltr";
    root.classList.toggle("font-arabic", locale === "ar");
    window.localStorage.setItem("arabtec-workspace-locale", locale);
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, toggleLocale: () => setLocale(current => current === "en" ? "ar" : "en") }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
