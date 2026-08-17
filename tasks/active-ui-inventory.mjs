import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = resolve(projectRoot, "client/src");
const extensions = [".tsx", ".ts", ".jsx", ".js"];

function resolveLocalModule(fromFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/") ? resolve(clientRoot, specifier.slice(2)) : resolve(dirname(fromFile), specifier);
  const candidates = [base, ...extensions.map(extension => `${base}${extension}`), ...extensions.map(extension => resolve(base, `index${extension}`))];
  return candidates.find(candidate => existsSync(candidate)) ?? null;
}

function importedSpecifiers(source) {
  return [...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map(match => match[1]);
}

export function getActiveUiInventory() {
  const entry = resolve(clientRoot, "App.tsx");
  const pending = [entry];
  const visited = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const source = readFileSync(current, "utf8");
    for (const specifier of importedSpecifiers(source)) {
      const next = resolveLocalModule(current, specifier);
      if (next && !visited.has(next)) pending.push(next);
    }
  }
  return [...visited].map(file => relative(projectRoot, file)).filter(file => file.startsWith("client/src/")).sort();
}

export function readActiveUiSources() {
  return Object.fromEntries(getActiveUiInventory().map(file => [file, readFileSync(resolve(projectRoot, file), "utf8")]));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const inventory = getActiveUiInventory();
  console.log(`ACTIVE_UI_FILES ${inventory.length}`);
  for (const file of inventory) console.log(file);
}
