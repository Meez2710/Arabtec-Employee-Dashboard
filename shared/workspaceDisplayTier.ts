/**
 * Editorial hierarchy tier for the News Grid Hierarchy layout.
 *
 * Single source of truth for both client and server. This is an additive,
 * nullable axis alongside `cardSize` (grid footprint) and `severity`
 * (priority-rail urgency) — see docs/ACTION_PLAN.md "News Grid Hierarchy".
 *
 * - "lead": the single most prominent item on a page/section; full-bleed treatment,
 *   independent of cardSize.
 * - "standard": default editorial weight; keeps its existing cardSize footprint choice.
 * - "brief": compact list-row treatment; ignores cardSize.
 *
 * `displayTier` is optional/nullable everywhere it appears. A missing value must
 * resolve to "standard" via `tierOf()` at read time — never via a SQL backfill —
 * so nothing already published changes appearance without an explicit admin action.
 */
export const workspaceDisplayTiers = ["lead", "standard", "brief"] as const;

export type DisplayTier = (typeof workspaceDisplayTiers)[number];

export type DisplayTierSource = {
  displayTier?: DisplayTier | null;
};

export const DEFAULT_DISPLAY_TIER: DisplayTier = "standard";

/** Resolves the effective tier for an item, defaulting a missing/null value to "standard". */
export function tierOf(item: DisplayTierSource): DisplayTier {
  return item.displayTier ?? DEFAULT_DISPLAY_TIER;
}
