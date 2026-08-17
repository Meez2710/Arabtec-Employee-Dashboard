import { Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";

type BriefingHeaderProps = { query?: string; onSearch?: (query: string) => void; };

export function BriefingHeader({ query = "", onSearch = () => undefined }: BriefingHeaderProps) {
  const { locale, toggleLocale } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSearch(draft.trim()); };
  const copy = locale === "ar" ? { home: "الرئيسية", search: "ابحث في محتوى مساحة العمل المنشور", openSearch: "فتح البحث", language: "English" } : { home: "Home", search: "Search published Workspace content", openSearch: "Open search", language: "العربية" };
  return <header className="dashboard-header"><div className="dashboard-header-inner"><a href="#home" className="dashboard-brand"><img src="/manus-storage/arabtec-official-logo_467b325f.svg" alt="Arabtec" /><span>arabtec</span></a><nav className="dashboard-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}><a className="is-active" href="#home">{copy.home}</a></nav><div className="dashboard-actions">{searchOpen && <form className="dashboard-search" role="search" onSubmit={submitSearch}><Search size={14} aria-hidden="true" /><input autoFocus value={draft} onChange={event => setDraft(event.target.value)} placeholder={copy.search} aria-label={copy.search} /><button type="submit" className="dashboard-search-submit">{locale === "ar" ? "بحث" : "Search"}</button></form>}<button type="button" className="dashboard-icon-button" onClick={() => setSearchOpen(value => !value)} aria-label={copy.openSearch} aria-expanded={searchOpen}><Search size={18} /></button><button type="button" className="dashboard-language-switch" onClick={toggleLocale} aria-label={locale === "ar" ? "Switch language to English" : "تبديل اللغة إلى العربية"}>{copy.language}</button></div></div></header>;
}
