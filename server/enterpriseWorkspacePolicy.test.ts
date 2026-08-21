import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const inventoryOutput = execFileSync("node", ["tasks/active-ui-inventory.mjs"], { cwd: projectRoot, encoding: "utf8" });
const activeUiFiles = inventoryOutput.split("\n").filter(line => line.startsWith("client/src/"));
const sourceByFile = Object.fromEntries(activeUiFiles.map(file => [file, readFileSync(resolve(projectRoot, file), "utf8")]));
const activeUiSource = Object.values(sourceByFile).join("\n");
const homeSource = sourceByFile["client/src/pages/Home.tsx"];
const stylesheet = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

describe("enterprise Workspace policy", () => {
  it("derives employee card content and figures from workspace records rather than fixed demo values", () => {
    expect(homeSource).toContain("trpc.workspace.listCards.useQuery");
    expect(homeSource).toContain("trpc.workspace.listSections.useQuery");
    // Nothing employee-facing may be a literal. Every card, count, and date is
    // read from published records or is absent.
    expect(activeUiSource).not.toMatch(/\b(Ahmed|Mohamed|Tarek|Marina)\b/);
    expect(homeSource).not.toMatch(/const (?:demo|sample|placeholder)[A-Za-z]*\s*=/i);
  });

  it("derives every active client module from the routed app-shell import graph", () => {
    expect(inventoryOutput).toMatch(/ACTIVE_UI_FILES \d+/);
    expect(activeUiFiles).toContain("client/src/App.tsx");
    expect(activeUiFiles).toContain("client/src/pages/Home.tsx");
    expect(activeUiFiles).toContain("client/src/pages/ManageWorkspace.tsx");
    expect(activeUiFiles).toContain("client/src/pages/NotFound.tsx");
    expect(activeUiFiles).toContain("client/src/components/ui/sonner.tsx");
    expect(activeUiFiles).toContain("client/src/components/ui/tooltip.tsx");
    // Every promised destination is a real routed page.
    for (const page of ["Updates", "UpdateDetail", "Opportunities", "Resources"]) {
      expect(activeUiFiles).toContain(`client/src/pages/${page}.tsx`);
    }
    expect(Object.keys(sourceByFile)).toEqual(activeUiFiles);
  });

  it("keeps the derived active interface inventory above the 13px floor and removes forbidden card scroll behavior", () => {
    expect(stylesheet).not.toMatch(/font-size:\s*(?:[0-9]|1[0-2])px/);
    expect(activeUiSource).not.toMatch(/text-xs|text-\[(?:[0-9]|1[0-2])px\]|text-\[0\.[0-9]+rem\]|tracking-\[-|tracking-tight/);
    // A fixed ratio belongs on a media well and nowhere else: the original rule
    // existed to stop cards being forced square and scrolling internally.
    const ratioRules = [...stylesheet.matchAll(/([^{}]+)\{[^{}]*aspect-ratio\s*:[^{}]*\}/g)].map(match => match[1].trim());
    expect(ratioRules).toEqual([".ws-card__media"]);
    const cardRules = stylesheet.match(/\.ws-card(?:[\w\s>.:_-]*)\{[^}]*\}/g) ?? [];
    expect(cardRules.join("\n")).not.toMatch(/overflow(?:-x|-y)?\s*:\s*(?:auto|scroll)/);
  });

  it("maps every actual CSS text rule and shared app-shell text utility to a verified contrast pairing", () => {
    const auditOutput = execFileSync("node", ["tasks/contrast-audit.mjs"], { cwd: projectRoot, encoding: "utf8" });
    expect(auditOutput).toContain(`ACTIVE_UI_FILE_COUNT ${activeUiFiles.length}`);
    expect(auditOutput).toMatch(/CSS_COLOR_RULE_COUNT \d+/);
    expect(auditOutput).toContain("UNMAPPED_CSS_TEXT_RULES 0");
    expect(auditOutput).toContain("DISALLOWED_TEXT_UTILITIES 0");
    expect(auditOutput).toContain("tooltip text");
    expect(auditOutput).toContain("notification text");
  });

  it("uses the playbook brand tokens and reduced-motion behavior", () => {
    // Playbook §1.1: brand red, ink, and body text.
    expect(stylesheet).toContain("--brand:#d8232a");
    expect(stylesheet).toContain("--ink:#16181d");
    expect(stylesheet).toContain("--body-text:#4a4d53");
    // Red is an accent, never a page background.
    expect(stylesheet).not.toMatch(/(?:^|;)\s*background:\s*var\(--brand\)\s*;[^}]*min-block-size:100vh/);
    expect(stylesheet).toContain("@media (prefers-reduced-motion:reduce)");
    expect(stylesheet).toContain("transition:none!important");
  });

  it("removes obsolete mockup components that could reintroduce unverified names and figures", () => {
    for (const filename of ["BriefingMetrics.tsx", "DailyDigestPanel.tsx", "DecisionBoard.tsx", "ExecutiveHero.tsx", "ReadinessPanel.tsx"]) {
      expect(existsSync(resolve(projectRoot, "client/src/components/briefing", filename))).toBe(false);
    }
  });
});
