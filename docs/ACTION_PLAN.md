# Arabtec Employee Workspace — Enhancement Action Plan

Sequenced implementation plan. Owner for every workstream is the implementing engineer.
Effort: **S** ≤ half a day · **M** ≈ 1–2 days · **L** ≈ 3–5 days.

Related: [`AUDIT.md`](AUDIT.md) · [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)

---

## Product decisions taken (conservative default, per brief)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Evolve the existing content model; do not replace it.** New columns are additive and nullable. | The publish lifecycle is the best part of the system. A rewrite would risk it for no gain. |
| D2 | **Bilingual content via parallel columns** (`titleAr`, `bodyAr`, `eyebrowAr`, `imageAltAr`) rather than a translations table. | Two fixed languages, one row per item. A join table buys flexibility the product does not need and costs every read. |
| D3 | **Arabic falls back to English when missing, and the gap is surfaced to admins.** | A blank card is worse than an English card. Silence is the failure mode we are removing. |
| D4 | **Sections become data, not an enum in the page.** `This week` and `Policies & resources` get real slots. | They are currently rendered permanently empty by construction — the single most visible defect on Home. |
| D5 | **Many items per section**, ordered, not one-per-slot. | Publishing a second announcement currently hides the first. Silent data loss. |
| D6 | **Roles: `viewer` < `editor` < `publisher` < `admin`.** Additive to the existing enum; `user` retained as the default non-console role. | The brief's four roles map cleanly. Existing `admin` accounts keep every capability. |
| D7 | **Africa/Cairo is the only business timezone.** All "today / this week / overdue / expired" logic is computed in Cairo regardless of viewer locale. | A site engineer in Cairo and a reviewer abroad must agree on what "today" means. |
| D8 | **Acknowledgement is server-persisted**, not localStorage. | An acknowledgement that cannot be reported on is theatre. |
| D9 | **Keep `/admin`; add a redirect from `/admin/1618`.** | The enumerable id is already gone locally; the redirect protects any bookmark on the deployed build. |
| D10 | **Drop Space Grotesk; standardise on the IBM Plex superfamily.** | Space Grotesk has no Arabic companion. See DESIGN_SYSTEM §2. |
| D11 | **Western Arabic numerals in Arabic locale.** | Mixed-language office; figures stay comparable across both views. |
| D12 | **The console is fully bilingual, like the employee side.** | Initially deferred: the console was pinned to LTR English because all of its copy was English and inheriting RTL produced ".Overview" with reversed KPI order. Reversed on request — every console string now lives in `client/src/lib/consoleCopy.ts` as an English/Arabic pair, and a test fails the build if any pair ships untranslated. The console follows the reader's language and direction, with its own switch in the sidebar. |
| D15 | **A section with several published items becomes one card that moves between them.** | The original product showed one card per section; the first rebuild gave every item its own card, which was correct about not hiding content but lost the section-shaped dashboard the reference screens show. The card now holds every item in its section with visible previous/next controls, a position counter, dots, and a live region for screen readers. Nothing is hidden and nothing is silently replaced. |
| D16 | **Shell max width is 1760px, not 1280px.** | On a 1900px display a 1280 cap left roughly 330px dead either side and made the cards read as small relative to the page. Reading-width blocks (article body, priority notice) stay capped at 72ch so line length does not suffer. |
| D13 | **Employee responsive rules are container queries, not media queries.** | The console's mobile preview previously only narrowed the box: media queries still answered to the 1440px browser window, so "Mobile" showed a squeezed desktop layout — worse than no preview, because it looked authoritative. With `container-type: inline-size` on the employee shell, the same rules answer to the previewed width, so the preview is truthful. In the app itself the container is the viewport, so behaviour is unchanged. |
| D14 | **Hover cards are retained in the schema and API but no longer surfaced.** | The many-items-per-section model replaces what `workspaceHoverCards` was working around. Dropping the table would be a destructive migration for no user-visible gain, so the data and its tested schema stay; only the dead client UI was removed. |

### Migration and rollback

All schema work is **additive** — new nullable columns and new tables only. No column is dropped,
renamed, or retyped, and no existing row is rewritten.

- **Forward:** `pnpm db:push` applies the generated migration.
- **Rollback:** the previous build ignores the new columns entirely; they are nullable with safe
  defaults, so reverting the application code is a complete rollback. Dropping the added columns is
  optional cleanup, not a requirement.
- **Enum extension** (`users.role`, `workspaceCards.slot`) is `ALTER TABLE … MODIFY` adding values.
  Existing values remain valid; rollback only requires that no row has been assigned a new value —
  the migration therefore does not backfill any row to a new enum value.

---

## Workstream 1 — Information architecture · **L**

### Employee

| Route | Purpose |
|---|---|
| `/` | Daily briefing — priority rail, today/this-week strip, card grid |
| `/updates` | Chronological official updates, filterable by section |
| `/updates/:id` | Shared update detail — full body, media, source, acknowledgement |
| `/opportunities` | Internal mobility board — location, function, closing date |
| `/resources` | Policies, forms, handbooks, contacts — grouped by type |

### Admin — `/admin/*`

| Route | Purpose |
|---|---|
| `/admin` | Overview — KPIs and "needs attention" |
| `/admin/content` | Queue + editor, search/filter/sort, bulk actions |
| `/admin/layout` | Visual home composer with live preview |
| `/admin/media` | Library, alt text, usage |
| `/admin/people` | Admins, roles, owners |
| `/admin/sections` | Enable/disable, EN/AR labels, default sizes |
| `/admin/audit` | Global audit log |
| `/admin/settings` | Sender, timezone, feature flags |

**Acceptance:** every nav label resolves to a route that renders useful content with zero published
items; no client route falls through to `NotFound` unless the path is genuinely unknown; `/admin/1618`
redirects to `/admin`.

---

## Workstream 2 — Design tokens and primitives · **M**

Implement DESIGN_SYSTEM.md as CSS custom properties plus a small primitive set:
`AppShell`, `TopNav`, `Card`, `Badge`, `Button`, `EmptyState`, `DataTable`, `Drawer`, `Modal`,
`Kicker`, `Field`.

**Acceptance:** no hard-coded hex outside the token block; every interactive target ≥ 44px; AA
contrast verified for every foreground/background pair; `pnpm check:logical-css` passes.

---

## Workstream 3 — Employee experience · **L**

- Priority rail that renders **only** when something is actionable, above everything else.
- Compact "Today / This week" strip driven by real dated items in Africa/Cairo.
- Card grid honouring `1×1 / 2×1 / 1×2` variants.
- Per-section content templates (announcement severity, joiner photo/role/start date, opportunity
  location/function/closing date, resource type/last-updated/owner, industry watch source/why).
- Update detail page.
- **One** shared empty state — a single line, never eight paragraphs.
- Acknowledge / mark-as-read on priority notices, server-persisted.
- "Last published" trust stamp.

**Acceptance:** with zero content Home shows one calm line, not eight. With one urgent announcement
the priority rail is the first thing on screen at 390px. Every card exposes kicker, title, dek, date,
source and a clear CTA.

---

## Workstream 4 — Admin control plane · **L**

- Split shell with sidebar; sticky save/publish bar in the editor.
- Schema-driven required fields per section type.
- EN/AR side-by-side editing with a "copy structure" helper.
- Live employee preview at desktop / tablet / mobile × EN / AR.
- Publish validation gates: title present in active languages, section selected, go-live ≤ expire,
  alt text required when an image is present, confirmation summarising audience/section/schedule.
- Bulk archive/unpublish, duplicate across sections, restore from archive.
- Layout composer with **visible buttons, keyboard move, and drag** — never a hidden 2-second hold.
- Overview surfacing overdue reviews, scheduled today, expired-but-live, missing Arabic.

**Acceptance:** an admin publishes a notice in under 60 seconds; cannot publish an item that fails a
gate; can reorder Home and see the result before saving; sees everything needing attention on one screen.

---

## Workstream 5 — Roles, audit, hardening · **M**

- Four roles with server-enforced capability checks on **every** mutation.
- `publisherProcedure` for publish/unpublish/schedule; `editorProcedure` for content writes.
- Global audit log capturing actor, action, entity, before/after, timestamp.
- Destructive actions confirmed in the UI.

**Acceptance:** an `editor` account cannot publish through the API, not merely through the UI. Every
publish-grade action appears in `/admin/audit`.

---

## Workstream 6 — Quality bar · **M**

Keyboard-complete, visible focus, AA contrast, reduced-motion, semantic headings, table headers,
inline form errors, locale-aware dates, no layout shift on the greeting/date block.

**Acceptance:** typecheck clean, test suite green and extended to cover routing, timezone, i18n
fallback and role enforcement; `pnpm build` succeeds.

---

## News Grid Hierarchy — editorial display tiers · **M**

### Current card-size model (as built)

- `CardSize = "1x1" | "2x1" | "1x2"` — stored on `workspaceCards.cardSize` (DB), mirrored in
  `WorkspaceItem.cardSize` (`client/src/lib/workspaceContent.ts`) and `workspaceCardSchema.cardSize`
  (`server/workspaceSchemas.ts`). Default `"1x1"`.
- `sizeClass(item)` resolves the value (defaulting missing to `"1x1"`) to a CSS class
  (`is-1x1` / `is-2x1` / `is-1x2`) applied in `WorkspaceCard.tsx`.
- `cardSize` is a **footprint-only** concept — how many grid cells a card occupies. It carries no
  editorial-hierarchy meaning: a `2x1` announcement and a `2x1` opportunity are visually equal weight.
  There is no concept of "this is the most important item on the page" distinct from its size, and no
  compact/list treatment smaller than `1x1`.

### Implemented additive model: `displayTier`

Adds an editorial-hierarchy axis alongside (not replacing) `cardSize`, modelled on the same
additive/nullable pattern as `cardSize` and `severity` (D1, `drizzle/0004_peaceful_jack_flag.sql`).

- `DisplayTier = "lead" | "standard" | "brief"`, defined once in `shared/workspaceDisplayTier.ts` and
  imported by both the server (`server/workspaceSchemas.ts`) and the client
  (`client/src/lib/workspaceContent.ts`) — one source of truth, per D1's additive-schema convention.
- `workspaceCards.displayTier` is a **new nullable enum column**, no default, added via a standalone
  migration (`drizzle/0006_lead_standard_brief_tier.sql`) that only adds a column — it does not modify
  or reorder any existing enum (`cardSize`, `severity`, `slot`, `status`, `role`, etc.).
- `tierOf(item)` resolves the effective tier, defaulting a missing/null value to `"standard"` —
  mirroring `severityOf()`. This means **no published item changes tier** until an admin explicitly
  sets one; the default is resolved in code, never backfilled in SQL (consistent with the existing
  "Migration and rollback" rule above).
- Tier semantics:
  - `"lead"` — the single most prominent item, full-bleed/hero treatment, independent of `cardSize`.
  - `"standard"` — current default behaviour; keeps its existing `cardSize` footprint choice.
  - `"brief"` — compact list-row treatment; ignores `cardSize` entirely.

**Status:** schema/type layer landed (branch `feature/news-grid-hierarchy`): migration `0006`,
`drizzle/schema.ts`, `shared/workspaceDisplayTier.ts`, `server/workspaceSchemas.ts`,
`client/src/lib/workspaceContent.ts`. Visual treatment per tier (Home zoning, `WorkspaceCard.tsx`,
responsive breakpoints, admin layout composer) is not yet implemented.

### Open questions (not yet resolved — defaults assumed until confirmed)

| # | Question | Default assumed if unanswered |
|---|---|---|
| Q1 | How is at-most-one `"lead"` per page/section enforced — DB constraint, publish-gate validation, or render-time ("first by `sortOrder` wins, rest treated as `standard`")? | Render-time: first `lead` by `sortOrder` wins; no publish-time block on a second `lead`. |
| Q2 | Does `"standard"` keep the full `1x1/2x1/1x2` `cardSize` choice, or does tier constrain which sizes are available? | Full `cardSize` choice retained for `standard`. |
| Q3 | Is `"brief"` granularity per-item, or can an admin mark a whole section as brief-only? | Per-item; no section-level override in this iteration. |

---

## Sequence

| Step | Workstream | Why here |
|---|---|---|
| 1 | Schema + server foundation (WS1/WS5 data) | Everything else depends on the model |
| 2 | Design tokens + primitives (WS2) | Every subsequent view uses them |
| 3 | Routing repair + employee pages (WS1/WS3) | The S0 defect; highest user value |
| 4 | Employee Home restyle (WS3) | Depends on 2 and 3 |
| 5 | Admin shell + Overview (WS4) | Depends on 1 and 2 |
| 6 | Admin editor + preview (WS4) | Depends on 5 |
| 7 | Layout composer (WS4) | Depends on 6 |
| 8 | Roles + audit enforcement (WS5) | Hardens everything above |
| 9 | RTL + responsive pass (WS6) | Verifies the whole surface |
| 10 | Empty/error/loading polish + copy (WS6) | Last, once all surfaces exist |
| 11 | News Grid Hierarchy tiers (new) | Schema/types landed; visual treatment lands after Home restyle (4) so lead/standard/brief have a stable grid to sit in |

---

## Out of scope

Deliberately excluded, and why:

- **Readership analytics** — no instrumentation exists and adding a tracker to an internal comms tool
  is a privacy decision for People & Culture, not an engineering one. `/admin/insights` ships as
  publish activity derived from the audit log instead.
- **Email delivery** — the sender credential is still not provisioned. The configuration surface is
  built and stays inert until a sender exists, exactly as the current build intends.
- **Deployment** — the Manus platform deploy is outside this repository's control. See "Deployment"
  in the delivery notes.
- **Readership instrumentation** — see above; `/admin/audit` carries publish activity instead.
