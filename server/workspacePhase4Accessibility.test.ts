import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");
const home = read("client/src/pages/Home.tsx");
const card = read("client/src/components/workspace/WorkspaceCard.tsx");
const shell = read("client/src/components/workspace/AppShell.tsx");
const detail = read("client/src/pages/UpdateDetail.tsx");
const locale = read("client/src/contexts/LocaleContext.tsx");
const copyDictionary = read("client/src/lib/workspaceCopy.ts");
const stylesheet = read("client/src/index.css");
const packageJson = read("package.json");

function allTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? allTsxFiles(resolve(directory, entry.name)) : entry.name.endsWith(".tsx") ? [resolve(directory, entry.name)] : []);
}

describe("Workspace Phase 4 accessibility and RTL policy", () => {
  it("delivers detail content through a real linked page rather than a hover overlay", () => {
    // Detail content now has its own shareable route, which is strictly more
    // accessible than an in-card disclosure: it is a link, it has a URL, and it
    // works with the keyboard, a screen reader, and the browser's back button.
    expect(card).toContain('href={`/updates/${item.id}`}');
    expect(detail).toContain('useRoute("/updates/:id")');
    for (const source of [home, card, shell, detail, stylesheet]) {
      expect(source).not.toContain("dash-hover-overlay");
    }
    expect(stylesheet).not.toMatch(/:hover[^{]*\{[^}]*(?:display\s*:\s*block|visibility\s*:\s*visible)/);
  });

  it("keeps every interactive surface reachable by Tab with a visible focus ring", () => {
    expect(stylesheet).toContain(":focus-visible");
    expect(stylesheet).toContain("outline:2px solid var(--brand)");
    // Cards are links, not focus-trapped divs with synthetic tab stops.
    expect(home).not.toMatch(/tabIndex=\{0\}/);
    expect(card).not.toMatch(/tabIndex=\{0\}/);
    expect(shell).toContain('className="ws-skip"');
  });

  it("meets the 44px interactive target floor from the design playbook", () => {
    expect(stylesheet).toContain("min-block-size:44px");
    // The one smaller control keeps a 44px hit area via its pseudo-element.
    expect(stylesheet).toContain(".ws-btn--sm::after");
  });

  it("gives every image either a real description or an explicit decorative marking", () => {
    const offenders = allTsxFiles(resolve(projectRoot, "client/src")).flatMap(file => {
      const source = readFileSync(file, "utf8");
      const images = source.match(/<img\b[^>]*>/g) ?? [];
      return images.filter(tag => !/\balt=/.test(tag)).map(tag => `${file}: ${tag}`);
    });
    expect(offenders).toEqual([]);

    // Content imagery draws its description from the record, never a hardcoded string.
    expect(card).toContain("alt={localised.imageAlt ?? \"\"}");
    expect(detail).toContain("alt={localised.imageAlt ?? \"\"}");
    // And alt text is a publish gate, so a live image can never lack one.
    expect(read("shared/publishReadiness.ts")).toContain('field: "imageAlt"');
  });

  it("degrades a broken image instead of leaving a torn layout", () => {
    expect(card).toContain("onError");
    expect(detail).toContain("onError");
  });

  it("sets persisted document language and direction from the locale switch and applies Arabic typography", () => {
    expect(locale).toContain("root.lang = locale");
    expect(locale).toContain('root.dir = locale === "ar" ? "rtl" : "ltr"');
    expect(locale).toContain('window.localStorage.setItem("arabtec-workspace-locale", locale)');
    expect(shell).toContain("toggleLocale");
    // Copy lives in one bilingual dictionary rather than per-page literals.
    expect(copyDictionary).toContain("en:");
    expect(copyDictionary).toContain("ar:");
    expect(home).toContain("copy.home");
    expect(stylesheet).toContain(":lang(ar)");
    expect(stylesheet).toContain("letter-spacing:0!important");
  });

  it("pairs Arabic with a real Arabic face rather than forcing a Latin font onto it", () => {
    expect(stylesheet).toContain('--font-arabic: "IBM Plex Sans Arabic"');
    expect(read("client/index.html")).toContain("IBM+Plex+Sans+Arabic");
    expect(stylesheet).not.toContain("Space Grotesk");
  });

  it("runs the logical-directionality guard as a build prerequisite and permits no physical left/right properties", () => {
    expect(packageJson).toContain('"prebuild": "pnpm check:logical-css"');
    expect(execFileSync("node", ["tasks/logical-css-audit.mjs"], { cwd: projectRoot, encoding: "utf8" })).toContain("PASS logical CSS audit");
  });
});
