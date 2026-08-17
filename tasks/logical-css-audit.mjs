import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const stylesheetPath = resolve(projectRoot, "client/src/index.css");
const stylesheet = readFileSync(stylesheetPath, "utf8");
const physicalPatterns = [
  /\b(?:margin|padding|border)-(?:left|right)\s*:/gi,
  /\b(?:left|right)\s*:/gi,
  /\btext-align\s*:\s*(?:left|right)\b/gi,
];
const violations = physicalPatterns.flatMap(pattern => [...stylesheet.matchAll(pattern)].map(match => ({ token: match[0], index: match.index ?? 0 })));

if (violations.length) {
  console.error("Physical directional CSS properties are not allowed. Use logical properties instead.");
  for (const violation of violations) {
    const line = stylesheet.slice(0, violation.index).split("\n").length;
    console.error(`client/src/index.css:${line} ${violation.token}`);
  }
  process.exitCode = 1;
} else {
  console.log("PASS logical CSS audit: no physical left/right directional properties found.");
}
