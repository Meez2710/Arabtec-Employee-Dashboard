/**
 * Arabtec Workspace design reminder:
 * The shared header mirrors the supplied reference: a compact white utility bar, clear section navigation, and functional employee actions.
 */
import { Bell, ChevronDown, Mail, Menu, Search } from "lucide-react";
import { useState } from "react";

export function BriefingHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-inner">
        <a href="#home" className="dashboard-brand"><img src="/manus-storage/arabtec-official-logo_467b325f.svg" alt="Arabtec" /><span>arabtec</span></a>
        <nav className="dashboard-nav" aria-label="Primary navigation"><a className="is-active" href="#home">Home</a><a href="#company">Company</a><a href="#careers">Careers</a><a href="#resources">Resources</a></nav>
        <div className="dashboard-actions">
          {searchOpen && <label className="dashboard-search"><Search size={14} /><input autoFocus placeholder="Search Workspace" onBlur={() => setSearchOpen(false)} /></label>}
          <button type="button" className="dashboard-icon-button" onClick={() => setSearchOpen(value => !value)} aria-label="Search Workspace"><Search size={18} /></button>
          <button type="button" className="dashboard-icon-button" aria-label="Open notifications"><Bell size={18} /></button>
          <button type="button" className="dashboard-icon-button" aria-label="Open messages"><Mail size={18} /></button>
          <button type="button" className="dashboard-profile" aria-label="Open employee menu"><span className="dashboard-profile-avatar">—</span><span className="hidden sm:inline">Employee</span><ChevronDown size={14} /></button>
          <button type="button" className="dashboard-mobile-menu" aria-label="Open menu"><Menu size={19} /></button>
        </div>
      </div>
    </header>
  );
}
