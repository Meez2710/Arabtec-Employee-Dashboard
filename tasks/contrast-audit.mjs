import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getActiveUiInventory } from "./active-ui-inventory.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const stylesheet = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");
const activeUiFiles = getActiveUiInventory();
const sourceByFile = Object.fromEntries(activeUiFiles.map(file => [file, readFileSync(resolve(projectRoot, file), "utf8")]));

const colors = {
  // Playbook §1.1 plus the neutrals derived from the reference screens.
  canvas: "#f4f5f7", surface: "#ffffff", surfaceSunken: "#fafafb", brandSoft: "#ffedea",
  ink: "#16181d", body: "#4a4d53", muted: "#6b7078",
  brand: "#d8232a", brandHover: "#b7000f",
  success: "#0f5c34", warning: "#8a5a00", danger: "#b7000f", info: "#245566",
  line: "#e4e6ea",
};

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(foreground, background, opacity) {
  const channels = hex => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
  const [foregroundChannels, backgroundChannels] = [channels(foreground), channels(background)];
  const mixed = foregroundChannels.map((channel, index) => Math.round(channel * opacity + backgroundChannels[index] * (1 - opacity)));
  return `#${mixed.map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
}

const cssTextPairs = [
  ["body default text", ["body"], colors.ink, colors.canvas],
  // `color:inherit` reset — controls take the ink they are placed on.
  ["form control colour reset", ["button,input,select,textarea"], colors.ink, colors.surface],
  ["skip link", [".ws-skip"], colors.surface, colors.ink],
  ["kicker label", [".ws-kicker"], colors.muted, colors.surface],
  ["page heading", [".ws-heading", ".ws-subheading", ".ws-modal h2"], colors.ink, colors.canvas],
  ["lede and body copy", [".ws-lede", ".ws-article__body"], colors.body, colors.canvas],
  ["metadata text", [".ws-meta", ".ws-stamp", ".ws-external"], colors.muted, colors.canvas],
  ["secondary button text", [".ws-btn"], colors.ink, colors.surface],
  ["primary button text", [".ws-btn--primary"], colors.surface, colors.brand],
  ["danger button text", [".ws-btn--danger"], colors.surface, colors.danger],
  ["inline link text", [".ws-linkish", ".ws-card__cta"], colors.brandHover, colors.surface],
  ["card title", [".ws-card__title", ".ws-priority__title", ".ws-week__title"], colors.ink, colors.surface],
  ["card dek and article body", [".ws-card__dek", ".ws-priority__body"], colors.body, colors.surface],
  ["card meta", [".ws-card__meta", ".ws-week__where"], colors.muted, colors.surface],
  ["card link wrapper", [".ws-card a.ws-card__link"], colors.ink, colors.surface],
  ["avatar initials", [".ws-avatar"], colors.brandHover, colors.brandSoft],
  ["neutral badge", [".ws-badge"], colors.muted, colors.surface],
  ["critical badge", [".ws-badge--critical"], colors.danger, colors.brandSoft],
  ["important badge", [".ws-badge--important"], colors.warning, colors.surface],
  ["success badge and acknowledgement", [".ws-badge--success", ".ws-priority__done"], colors.success, colors.surface],
  ["info badge", [".ws-badge--info"], colors.info, colors.surface],
  ["empty state", [".ws-empty", ".ws-loading"], colors.muted, colors.surface],
  ["brand wordmark", [".ws-brand", ".adm__brand"], colors.ink, colors.surface],
  ["primary navigation", [".ws-nav a"], colors.body, colors.surface],
  ["active navigation", [".ws-nav a:hover", ".ws-nav a.is-active", ".ws-back:hover"], colors.ink, colors.surface],
  ["header icon controls", [".ws-icon-btn"], colors.ink, colors.surface],
  ["header search input", [".ws-search input"], colors.ink, colors.surface],
  ["footer wordmark", [".ws-footer"], colors.surface, colors.ink],
  ["footer supporting text", [".ws-footer-note"], colors.line, colors.ink],
  ["mobile navigation", [".ws-mobile-nav a"], colors.muted, colors.surface],
  ["active mobile navigation", [".ws-mobile-nav a.is-active", ".adm__nav a.is-active"], colors.danger, colors.brandSoft],
  ["week day label", [".ws-week__day"], colors.muted, colors.surface],
  ["today week label", [".ws-week__row.is-today .ws-week__day"], colors.brandHover, colors.surface],
  ["back link", [".ws-back"], colors.body, colors.canvas],
  ["filter chip", [".ws-chip"], colors.body, colors.surface],
  ["active filter chip", [".ws-chip.is-active"], colors.danger, colors.brandSoft],
  ["form label", [".ws-field > span"], colors.ink, colors.surface],
  ["form hint", [".ws-field__hint"], colors.muted, colors.surface],
  ["form error", [".ws-field__error"], colors.danger, colors.surface],
  ["form input text", [".ws-input"], colors.ink, colors.surface],
  ["table header", [".ws-table th"], colors.muted, colors.surfaceSunken],
  ["table cell", [".ws-table td"], colors.body, colors.surface],
  ["table row title", [".ws-table__title"], colors.ink, colors.surface],
  ["table row subtitle", [".ws-table__title span"], colors.muted, colors.surface],
  ["responsive table label", [".ws-table td::before"], colors.muted, colors.surface],
  ["modal term", [".ws-modal dt"], colors.muted, colors.surface],
  ["modal definition", [".ws-modal dd"], colors.ink, colors.surface],
  ["modal warning", [".ws-modal__warn"], colors.danger, colors.brandSoft],
  ["console navigation", [".adm__nav a"], colors.body, colors.surface],
  ["console navigation hover", [".adm__nav a:hover"], colors.ink, colors.surfaceSunken],
  ["console navigation count", [".adm__nav-count"], colors.surface, colors.brand],
  ["console identity", [".adm__who strong"], colors.ink, colors.surface],
  ["console role", [".adm__who span"], colors.muted, colors.surface],
  ["console composer grip", [".adm__composer-grip"], colors.muted, colors.surface],
  ["console composer title", [".adm__composer-label strong"], colors.ink, colors.surface],
  ["console composer section", [".adm__composer-label span"], colors.muted, colors.surface],
  ["console KPI value", [".adm__kpi strong"], colors.ink, colors.surface],
  ["console KPI label", [".adm__kpi span"], colors.muted, colors.surface],
  ["console attention heading", [".adm__attention-group h3"], colors.ink, colors.surface],
  ["console attention row", [".adm__attention-list button"], colors.body, colors.surface],
  ["console attention row hover", [".adm__attention-list button:hover"], colors.ink, colors.surfaceSunken],
  ["console attention note", [".adm__attention-list em"], colors.muted, colors.surface],
  ["console language tag", [".adm__lang-tag"], colors.muted, colors.surface],
  ["console save bar status", [".adm__savebar-status"], colors.muted, colors.surface],
  ["console publish blockers", [".adm__gates li"], colors.danger, colors.brandSoft],
  ["console publish warnings", [".adm__warns li"], colors.warning, colors.surfaceSunken],
  ["console history action", [".adm__history strong"], colors.ink, colors.surface],
  ["console history detail", [".adm__history span", ".adm__history p"], colors.muted, colors.surface],
  ["console preview bar", [".adm__preview-bar"], colors.surface, colors.ink],
  ["console preview active control", [".adm__preview-bar .ws-btn.is-active"], colors.ink, colors.surface],
  ["console preview control", [".adm__preview-bar .ws-btn"], colors.surface, colors.ink],
  ["console access heading", [".adm__login-panel h1"], colors.ink, colors.surface],
  ["console access copy", [".adm__login-panel p"], colors.body, colors.surface],
  ["not-found heading", [".ws-centered__panel h1"], colors.ink, colors.surface],
  ["not-found copy", [".ws-centered__panel p"], colors.body, colors.surface],
  ["error diagnostic", [".ws-diagnostic"], colors.muted, colors.surfaceSunken],
];

const sourcePairs = [
  ["tooltip text", "client/src/components/ui/tooltip.tsx", "text-[13px]", colors.surface, colors.ink],
  ["notification text", "client/src/components/ui/sonner.tsx", '"--normal-text": "#15161a"', "#15161a", colors.surface],
];

const cssColorRules = [...stylesheet.matchAll(/([^{}]+)\{([^{}]*?(?:^|;)\s*color:[^{}]*)\}/g)].map(match => match[1].trim());
const unmappedCssRules = cssColorRules.filter(rule => !cssTextPairs.some(([, selectors]) => selectors.some(selector => rule.includes(selector))));
const disallowedTextUtilities = Object.entries(sourceByFile).flatMap(([file, source]) => {
  const matches = source.match(/text-xs|text-\[(?:[0-9]|1[0-2])px\]|text-\[0\.[0-9]+rem\]|tracking-\[-|tracking-tight/g) ?? [];
  return matches.map(match => `${file}: ${match}`);
});

let hasFailure = false;
for (const [label, selectors, foreground, background] of cssTextPairs) {
  const ratio = contrastRatio(foreground, background);
  const passed = ratio >= 4.5;
  console.log(`${passed ? "PASS" : "FAIL"} | CSS | ${label} | selectors: ${selectors.join(", ")} | ${ratio.toFixed(2)}:1`);
  hasFailure ||= !passed;
}
for (const [label, file, utility, foreground, background] of sourcePairs) {
  const found = sourceByFile[file]?.includes(utility);
  const ratio = contrastRatio(foreground, background);
  const passed = found && ratio >= 4.5;
  console.log(`${passed ? "PASS" : "FAIL"} | SOURCE | ${label} | ${file} :: ${utility} | ${ratio.toFixed(2)}:1`);
  hasFailure ||= !passed;
}

console.log(`ACTIVE_UI_FILE_COUNT ${activeUiFiles.length}`);
console.log(`CSS_COLOR_RULE_COUNT ${cssColorRules.length}`);
console.log(`UNMAPPED_CSS_TEXT_RULES ${unmappedCssRules.length}`);
for (const rule of unmappedCssRules) console.log(`UNMAPPED_CSS_RULE ${rule}`);
console.log(`DISALLOWED_TEXT_UTILITIES ${disallowedTextUtilities.length}`);
for (const utility of disallowedTextUtilities) console.log(`DISALLOWED_TEXT_UTILITY ${utility}`);

if (unmappedCssRules.length || disallowedTextUtilities.length) hasFailure = true;
if (hasFailure) process.exitCode = 1;
