import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");
const home = read("client/src/pages/Home.tsx");
const header = read("client/src/components/briefing/BriefingHeader.tsx");
const locale = read("client/src/contexts/LocaleContext.tsx");
const stylesheet = read("client/src/index.css");
const packageJson = read("package.json");

function allTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? allTsxFiles(resolve(directory, entry.name)) : entry.name.endsWith(".tsx") ? [resolve(directory, entry.name)] : []);
}

describe("Workspace Phase 4 accessibility and RTL policy", () => {
  it("delivers managed detail content through a native keyboard and touch accessible disclosure rather than a hover overlay", () => {
    expect(home).toContain('<details className="dash-card-details">');
    expect(home).toContain("<summary>{copy.viewDetails}");
    expect(home).not.toContain("dash-hover-overlay");
    expect(stylesheet).not.toContain(".dash-hover-overlay");
    expect(stylesheet).toContain(".dash-card-details summary");
  });

  it("does not add focus to non-interactive content cards and exposes no dead quick-access controls", () => {
    expect(home).not.toMatch(/tabIndex=\{0\}/);
    expect(home).not.toContain("function QuickAccess");
    expect(header).toContain('<form className="dashboard-search" role="search"');
    expect(header).toContain("onSearch(draft.trim())");
    expect(header).not.toMatch(/href="#(?:company|careers|resources)"/);
  });

  it("keeps the native detail disclosure reachable by Tab with visible focus and native Enter/Space activation", () => {
    expect(home).toContain("<details className=\"dash-card-details\">");
    expect(home).toContain("<summary>{copy.viewDetails}");
    expect(stylesheet).toContain("summary:focus-visible");
    expect(stylesheet).toContain(".dash-card-details summary:focus-visible");
    expect(home).not.toContain("tabIndex={0}");
  });

  it("provides a non-empty alternative for every image in the client codebase", () => {
    const emptyAlternatives = allTsxFiles(resolve(projectRoot, "client/src")).flatMap(file => {
      const source = readFileSync(file, "utf8");
      return source.includes('alt=""') ? [file] : [];
    });
    expect(emptyAlternatives).toEqual([]);
  });

  it("sets persisted document language and direction from the locale switch and applies Arabic typography", () => {
    expect(locale).toContain('root.lang = locale');
    expect(locale).toContain('root.dir = locale === "ar" ? "rtl" : "ltr"');
    expect(locale).toContain('window.localStorage.setItem("arabtec-workspace-locale", locale)');
    expect(header).toContain("toggleLocale");
    expect(home).toContain("const arabic: Copy");
    expect(stylesheet).toContain(':lang(ar)');
    expect(stylesheet).toContain('letter-spacing:0!important');
  });

  it("runs the logical-directionality guard as a build prerequisite and permits no physical left/right properties", () => {
    expect(packageJson).toContain('"prebuild": "pnpm check:logical-css"');
    expect(execFileSync("node", ["tasks/logical-css-audit.mjs"], { cwd: projectRoot, encoding: "utf8" })).toContain("PASS logical CSS audit");
  });
});
