import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getActiveUiInventory } from "./active-ui-inventory.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const stylesheet = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");
const activeUiFiles = getActiveUiInventory();
const sourceByFile = Object.fromEntries(activeUiFiles.map(file => [file, readFileSync(resolve(projectRoot, file), "utf8")]));

const colors = {
  paper: "#f7f8f9", surface: "#ffffff", offWhite: "#fcfcfc", mutedSurface: "#f8f9fa", managementTile: "#f5f6f7", controlSurface: "#f4f5f6",
  ink: "#15161a", signalText: "#c8172a", muted: "#4a5056", profileAvatar: "#243b48", tableSurface: "#f1f3f4", selectedSurface: "#fff5f6", success: "#29563a", scheduled: "#73580b", approved: "#245566", buttonBorder: "#b9c0c5",
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
  ["body default text", ["body"], colors.ink, colors.paper],
  ["header brand and utility text", [".dashboard-brand", ".dashboard-icon-button", ".dashboard-mobile-menu", ".dashboard-profile"], colors.ink, colors.surface],
  ["active navigation text", [".dashboard-nav"], colors.signalText, colors.surface],
  ["notification badge text", [".dashboard-bell span"], colors.surface, colors.signalText],
  ["profile avatar text", [".dashboard-profile-avatar"], colors.surface, colors.profileAvatar],
  ["search input text", [".dashboard-search input"], colors.ink, colors.surface],
  ["search and language control text", [".dashboard-search-submit", ".dashboard-language-switch"], colors.ink, colors.surface],
  ["Workspace status label", [".dashboard-demo-label"], colors.muted, colors.paper],
  ["module icon color", [".dash-card-title-row > span", ".dash-derived-metrics span", ".dash-quick-grid button svg"], colors.signalText, colors.surface],
  ["eyebrow and date text", [".dash-eyebrow", ".dash-welcome-card h1 span", ".dash-welcome-date", ".dash-link-label"], colors.signalText, colors.surface],
  ["welcome copy", [".dash-welcome-card > p:not(.dash-eyebrow)"], colors.muted, colors.surface],
  ["card content and quick-access text", [".dash-card-content", ".dash-quick-grid button"], colors.ink, colors.surface],
  ["card body and metric metadata", [".dash-card-body", ".dash-derived-metrics p"], colors.muted, colors.surface],
  ["empty-state text", [".dash-empty-state", ".dash-empty-state span"], colors.muted, colors.offWhite],
  ["hover-overlay text", [".dash-hover-overlay", ".dash-hover-overlay p:not(.dash-eyebrow)"], colors.surface, colors.ink],
  ["inline detail summary and linked-detail text", [".dash-card-details summary", ".dash-card-details-content a"], colors.signalText, colors.surface],
  ["primary action text", [".dash-red-button"], colors.surface, colors.signalText],
  ["manager header text", [".manage-shell header > p:not(.dash-eyebrow)", ".manage-login > p"], colors.muted, colors.paper],
  ["manager section control text", [".manage-grid > aside > button", ".manage-media-choice button", ".manage-media-choice label", ".manage-add-hover", ".manage-cancel", ".manage-delete"], colors.ink, colors.controlSurface],
  ["manager active control text", [".manage-grid > aside > button.is-active", ".manage-media-choice button.is-active", ".manage-media-choice label.is-active"], colors.signalText, colors.controlSurface],
  ["manager form labels and inputs", [".manage-form label"], colors.muted, colors.surface],
  ["manager input content", [".manage-form input", ".manage-form textarea"], colors.ink, colors.surface],
  ["hover-tile default text", [".manage-hover-tile"], colors.ink, colors.managementTile],
  ["hover-tile muted text", [".manage-hover-tile--add", ".manage-hover-tile small"], colors.muted, colors.managementTile],
  ["manager form helper text", [".manage-helper"], colors.muted, colors.surface],
  ["manager preview supporting text", [".manage-preview > p", ".manage-preview > span", ".manage-preview-count"], colors.muted, colors.surface],
  ["bulk importer supporting text", [".bulk-employee-head > div > p:not(.dash-eyebrow)", ".bulk-employee-actions > p"], colors.muted, colors.mutedSurface],
  ["bulk count text", [".bulk-employee-count"], colors.signalText, colors.mutedSurface],
  ["bulk drop-zone text", [".bulk-employee-drop"], colors.ink, colors.surface],
  ["bulk drop-zone supporting text", [".bulk-employee-drop > span"], colors.muted, colors.surface],
  ["bulk validation-error text", [".bulk-employee-error"], colors.signalText, colors.surface],
  ["bulk image-control text", [".bulk-employee-image button"], colors.surface, colors.ink],
  ["not-found and error icon color", [".not-found-panel > svg", ".error-boundary-panel > svg"], colors.signalText, colors.surface],
  ["not-found and error panel text", [".not-found-panel > p:not(.dash-eyebrow)", ".error-boundary-panel > p:not(.dash-eyebrow)"], colors.muted, colors.surface],
  ["error diagnostic text", [".error-boundary-details"], colors.muted, colors.mutedSurface],
  ["console table header text", [".console-table th"], colors.muted, colors.tableSurface],
  ["console table body text", [".console-table td"], colors.muted, colors.surface],
  ["console item text", [".console-item-button"], colors.ink, colors.surface],
  ["console neutral status", [".console-status"], colors.muted, colors.surface],
  ["console published status", [".console-status--published"], colors.success, colors.surface],
  ["console scheduled status", [".console-status--scheduled", ".console-status--in_review"], colors.scheduled, colors.surface],
  ["console approved status", [".console-status--approved"], colors.approved, colors.surface],
  ["console archived status", [".console-status--archived", ".console-status--unpublished"], colors.muted, colors.surface],
  ["console action text", [".console-row-actions button", ".console-editor-actions > button", ".console-confirm-actions > button"], colors.ink, colors.surface],
  ["console hovered action text", [".console-row-actions button:hover", ".console-editor-actions > button:hover", ".console-confirm-actions > button:hover"], colors.signalText, colors.surface],
  ["console form input text", [".console-form-grid input", ".console-form-grid select", ".console-form-grid textarea"], colors.ink, colors.surface],
  ["console reminder configuration text", [".console-reminder-settings input"], colors.ink, colors.controlSurface],
  ["console empty-editor text", [".console-empty-editor"], colors.muted, colors.surface],
  ["console preview text", [".console-preview-bar", ".console-preview-bar button"], colors.surface, colors.ink],
];

const sourcePairs = [
  ["footer wordmark", "client/src/components/briefing/BriefingFooter.tsx", "text-[15px]", colors.paper, colors.ink],
  ["footer supporting text", "client/src/components/briefing/BriefingFooter.tsx", "text-paper/80", blend(colors.paper, colors.ink, 0.8), colors.ink],
  ["tooltip text", "client/src/components/ui/tooltip.tsx", "text-[13px]", colors.surface, colors.ink],
  ["notification text", "client/src/components/ui/sonner.tsx", '"--normal-text": "#15161a"', colors.ink, colors.surface],
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
