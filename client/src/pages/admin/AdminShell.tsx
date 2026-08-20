import type { ReactNode } from "react";
import { Link } from "wouter";
import type { WorkspaceCapability } from "@shared/workspaceCapabilities";
import { consoleSections, type ConsoleSection } from "./adminShared";

type AdminShellProps = {
  section: ConsoleSection;
  capabilities: readonly WorkspaceCapability[];
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  attentionCount?: number;
  children: ReactNode;
};

export function AdminShell({ section, capabilities, user, attentionCount = 0, children }: AdminShellProps) {
  const allowed = consoleSections.filter(entry => capabilities.includes(entry.capability));
  return (
    <div className="adm">
      <aside className="adm__side">
        <Link href="/" className="adm__brand">
          <img src="/brand/arabtec-mark.svg" alt="" width={34} height={22} />
          <span>Workspace console</span>
        </Link>
        <nav className="adm__nav" aria-label="Console sections">
          {allowed.map(entry => (
            <Link
              key={entry.key}
              href={entry.key === "overview" ? "/admin" : `/admin/${entry.key}`}
              className={section === entry.key ? "is-active" : undefined}
              aria-current={section === entry.key ? "page" : undefined}
            >
              {entry.label}
              {entry.key === "overview" && attentionCount > 0 && <span className="adm__nav-count">{attentionCount}</span>}
            </Link>
          ))}
        </nav>
        <div className="adm__who">
          <strong>{user?.name || user?.email || "Signed in"}</strong>
          <span>{user?.role ?? "no access"}</span>
        </div>
      </aside>
      <div className="adm__main">{children}</div>
    </div>
  );
}
