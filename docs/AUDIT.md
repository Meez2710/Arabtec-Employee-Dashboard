# Arabtec Employee Workspace — Audit

**Date:** 20 August 2026
**Auditor:** Product/UX/engineering review of the repository at `Arabtec-Employee-Dashboard-main` and the live deployment at `https://www.hr-arabtecegy.online/`.
**Method:** Full source read (client, server, schema, migrations), live HTTP probing, live JS bundle diffing, baseline typecheck/test run.

---

## 1. Executive summary

The Workspace is a **single-page daily-briefing dashboard with a single publishing console behind it**. The publishing lifecycle underneath it is genuinely good — draft → in review → approved → scheduled → published → unpublished → archived, with per-item history, publish confirmation, live-item protection via private revisions, and scheduled/expiry sweeps. That machinery is the strongest asset in the codebase and must be preserved.

Everything above that machinery is thin. The employee product is **one route** (`/`) rendering nine cards, of which two are permanently hard-coded empty. The admin product is **one route** (`/admin`) rendering one very long page. There is no bilingual *content* model, no roles beyond a single `admin` boolean-in-practice, no global audit log, no acknowledgement, no layout composer, and no media library.

Three findings dominate:

1. **S0 — The live deployment is not this code, and its navigation is broken.** The deployed bundle advertises `Home / Updates / Opportunities / Resources` in both languages but its router only registers `/` and `/404`. Three of four nav destinations dead-end on "Route unavailable". The local repository has *already* removed those nav links (leaving only `Home`) and moved the console from `/admin/1618` to `/admin`, but that work was never deployed. The previous session's own TODO confirms it: *"Push the finalized Workspace console changes to the connected GitHub repository"* is the one unticked line.

2. **S0 — Removing the links is not fixing the product.** `Updates`, `Opportunities` and `Resources` are real, needed destinations for a site-office briefing tool. The current answer to "the link is broken" was to delete the link. The information architecture the product promises does not exist in either lineage.

3. **S1 — The employee home is nine near-identical empty cards.** With no published content, `Home` renders "No update published yet" up to eight times plus a status banner. There is no priority rail, no week-ahead timeline, no distinction between *action required*, *FYI*, and *reference*. Time-to-first-useful-signal is effectively infinite because there is no signal, only frames.

Bilingual support is **chrome-only**: the UI strings have Arabic, the *content* has none. A published announcement is stored in exactly one language and shown identically to Arabic readers. For a workforce that is majority Arabic-first, this is the single largest correctness gap after routing.

The visual language is also now off-target. The current CSS is a square, hairline, high-contrast "newspaper" treatment (radius 0, 3px ink rules, `#e11d2e`). The design playbook supplied as the source of truth specifies the opposite geometry: **dense white cards with soft radii and subtle borders on a light neutral canvas**, brand red `#D8232A` used for identity/action/emphasis only.

**Verdict:** the foundation is sound and worth building on. The product surface needs the IA built out, the content model made bilingual, the console split into a real control plane, and the visual system re-derived from the playbook.

---

## 2. Recon — how the system actually works

| Concern | Finding | Evidence |
|---|---|---|
| Framework | React 19 + Vite 7, TypeScript 5.9 | `package.json` |
| Routing | `wouter`, client-side only | `client/src/App.tsx:12` |
| API | tRPC 11 over Express 4, superjson | `server/routers.ts`, `server/_core/trpc.ts` |
| Data | MySQL via Drizzle ORM | `drizzle/schema.ts`, `server/db.ts` |
| Auth | Manus OAuth; session cookie; user resolved per-request | `server/_core/context.ts:14`, `server/_core/sdk.ts` |
| Roles | `user` / `editor` / `admin` only | `drizzle/schema.ts:3` |
| i18n | React context, UI strings only, sets `lang`/`dir` | `client/src/contexts/LocaleContext.tsx` |
| Styling | One hand-written stylesheet + Tailwind 4 preflight | `client/src/index.css` (273 lines) |
| Components | shadcn/ui present but **almost entirely unused** by the real pages | `client/src/components/ui/*` |
| Hosting | Manus platform; SPA fallback serves `index.html` for every path | live probe |

### Routes actually registered

```
/         → Home            (employee briefing)
/admin    → ManageWorkspace  (console)
/404      → NotFound
*         → NotFound
```

`client/src/App.tsx:12`. There is no `/updates`, `/opportunities`, `/resources`, or update-detail route.

### Content model

One table does all employee-facing work: `workspaceCards` (`drizzle/schema.ts:56`). Fields: `slot`, `eyebrow`, `title`, `body`, `linkUrl`, `imageUrl`, `imageMode`, `sortOrder`, `active`, `status`, `scheduledFor`, `publishedAt`, `expiresAt`, `reviewBy`, `ownerUserId`, plus audit columns. `workspaceHoverCards` holds repeatable disclosures per section. `workspaceContentHistory` holds per-item history.

**Slots are a fixed enum of six**: `new_joiner`, `company_news`, `announcement`, `activity`, `industry_watch`, `opportunity`. "This week" and "Policies & resources" are rendered as *permanently empty* modules with no slot behind them — `client/src/pages/Home.tsx` renders `<EmptyModule title={copy.thisWeek} …/>` and `<EmptyModule title={copy.resources} …/>` unconditionally.

**One card per slot reaches the employee.** `Home.tsx` reduces the published list into a `Partial<Record<DashboardSlot, DashboardCard>>` — last write wins. Publishing a second announcement silently hides the first.

### Publish path

`saveWorkspaceItem` (`server/db.ts:88`) never publishes. If the item is live it writes a **new draft revision** and leaves the live row untouched — a genuinely good safety property. `publishItem` requires `confirmed: true` at the schema level (`workspacePublishItemSchema`), and every transition is guarded by `canPerformWorkspaceAction`. `sweepWorkspacePublicationLifecycle` turns due schedules live and retires expired items.

### Employee visibility rule

`isEmployeeVisible` (`server/db.ts:43`): `active === 1` **and** (`published` or a `scheduled` row whose time has passed) **and** not expired. Draft leakage is correctly prevented at the query layer.

---

## 3. Scorecards

Scored 1–5, where 3 = acceptable for an internal tool, 5 = corporate-tier.

### A. Functionality — **2.0**

| Check | Score | Evidence |
|---|---|---|
| Nav destinations resolve and match labels | **1** | Live bundle ships `updates/opportunities/resources` labels; router has `/` and `/404` only. Local repo deleted the labels instead of building the routes. |
| Empty / loading / error states | 3 | `ErrorBoundary` and `NotFound` exist; loading is a bare `<p>Loading…</p>`; no offline state. |
| Permission-denied state | 4 | `ManageWorkspace.tsx` renders a clear sign-in / not-authorised panel. |
| Publish / unpublish / schedule / expire | **5** | Guarded transitions + confirmation + sweep. The strongest area. |
| Preview-as-employee fidelity | **5** | Renders the real `<Home>` with `previewItems`. Genuinely the same layout. |
| Image upload validation | 3 | MIME allow-list and 5 MB cap enforced server-side (`routers.ts`). No alt-text field; no broken-image fallback. |
| External links | 3 | `target="_blank" rel="noreferrer"` is correct; no "you are leaving the intranet" affordance. |
| EN/AR **content** completeness | **1** | No Arabic content columns exist at all. Chrome translates; content does not. |
| Admin search / filter / sort | **1** | None. One unfiltered, unsorted `<table>` of every item ever created. |
| Layout persistence / collision | **1** | `sortOrder` is an unused number field in the editor. No composer, no size variants, no collision rule. |
| Timezone correctness | **2** | `new Date()` and `getHours()` are the *browser's* zone throughout; `dateLabel` uses `"en"` with no `timeZone`. A viewer outside Cairo sees the wrong day. |
| Accessibility of write actions | 4 | Publish is modal-confirmed; focus rings are strong; destructive archive is *not* confirmed. |

### B. Responsiveness — **3.0**

| Check | Score | Evidence |
|---|---|---|
| Header collapse | 3 | Nav hidden < 700px (`index.css`), but local build has one nav item so nothing collapses. Live build has a menu button. |
| Card grid 1 / 2 / 4 columns | 4 | `repeat(4)` → `repeat(2)` @1080 → `1fr` @700. Clean, no orphan pathology. |
| Size variants reflow | **1** | Variants do not exist. |
| Admin tables on small screens | **2** | Columns 3/4/5 are `display:none` below 700px — the data is *hidden*, not reflowed. Owner and review date become unreachable on mobile. |
| Forms / sticky save bar | **2** | Editor actions scroll away; no sticky bar. |
| Touch targets ≥ 44px | **2** | Buttons are `min-height:36px`; row actions drop to `padding:.4rem` on mobile. Playbook requires ≥ 44px. |
| Drag alternatives | n/a | No drag exists in this lineage. |
| RTL at every breakpoint | 4 | Logical properties used throughout; icon mirroring handled. Real strength. |

### C. Employee UX — **1.5**

Judged as a 07:30 site-office briefing tool.

| Check | Score | Evidence |
|---|---|---|
| "Do I need to do anything today?" in < 3s | **1** | No priority surface. An announcement sits in the grid with identical weight to *Industry watch*. |
| Priority outranks everything | **1** | Announcements are card #2 of 9, same size, same treatment. |
| Week-ahead scannable | **1** | Hard-coded empty module. No dates anywhere. |
| Card content template | **2** | Every section renders the same eyebrow/title/body/link shape. A new joiner and an industry link are visually identical. |
| Quiet empty states | **1** | Up to **eight** "No update published yet" blocks plus a banner. |
| Action required vs FYI vs reference | **1** | No such distinction exists. |
| One-handed mobile reading | 3 | Single column works; no sticky nav; search is an absolutely-positioned overlay at `top:65px`. |
| Cognitive load | 2 | Nine equal frames is nine decisions. |

### D. Admin UX — **2.0**

| Check | Score | Evidence |
|---|---|---|
| "What needs me now" in one screen | **1** | No overview. `reviewOverdue` is computed server-side and shown only as red text in a table cell. |
| Publish a notice in < 60s | 3 | New item → 4 fields → save → publish → confirm. Achievable. |
| Rearrange the home without fear | **1** | Not possible. |
| Preview EN + AR + mobile | **2** | EN/AR preview toggle exists and is good; no breakpoint preview. |
| Statuses unmistakable | 4 | Seven quiet bordered badges, sensible colours. |
| Obvious undo / unpublish | **5** | Unpublish, archive, restore, duplicate all inline per row. Copy explicitly says actions are reversible. |
| Accident prevention | **2** | Publish is confirmed; publishing an item with an empty body, a past expiry, or no Arabic is not prevented. Archive is one unconfirmed click. |

### Trust & security

| Check | Finding |
|---|---|
| Admin URL scheme | Live: `/admin/1618` — an enumerable numeric path. Local: `/admin`. **Already fixed locally, not deployed.** |
| Authorisation | Sound. `adminProcedure` guards every mutation server-side; the client route guard is cosmetic on top of a real server check. |
| Draft leakage | **None.** `isEmployeeVisible` filters at the data layer; `listCards` is the only public content procedure. |
| Session | Cookie via Manus SDK; `logout` clears it. No idle timeout. |
| CSRF | tRPC over `POST` with JSON content-type gives baseline protection; no explicit token. |
| Upload constraints | Type + size enforced server-side. Filename sanitised. No content sniffing. |
| Audit trail | Per-item history only. No global log, no before/after values, no view of "who published what this week". |
| **Repository hazard** | A stray `.git` exists at `$HOME` with remote `gitlab.com/arabtec-group/employee-workspace.git` and zero tracked files. Any `git add -A` from the home directory would stage `~/.ssh`, `~/.claude.json` and every credential on the machine. **Not caused by this project, but dangerous.** |

---

## 4. Severity-ranked issues

### S0 — blocking

| # | Issue | Evidence |
|---|---|---|
| S0-1 | Nav advertises three destinations that do not exist | live bundle vs `App.tsx:12` |
| S0-2 | `/updates`, `/opportunities`, `/resources` are unimplemented | `App.tsx:12` |
| S0-3 | Local repository has never been deployed; live users are on an older, more broken build | `tasks/todo.md` final unticked item; bundle diff |
| S0-4 | Employee content has no Arabic representation | `drizzle/schema.ts:56` |

### S1 — severe

| # | Issue | Evidence |
|---|---|---|
| S1-1 | No priority surface; announcements rank equal to industry links | `Home.tsx` grid order |
| S1-2 | Up to eight identical empty states on one screen | `EmptyModule` × 8 |
| S1-3 | Only one item per slot ever reaches employees; extras silently vanish | `Home.tsx` `cards` reducer |
| S1-4 | "This week" and "Policies & resources" are permanently empty by construction | `Home.tsx` |
| S1-5 | No admin overview; overdue/scheduled/expiring work is invisible | `ManageWorkspace.tsx` |
| S1-6 | Admin queue has no search, filter, or sort | `ManageWorkspace.tsx` |
| S1-7 | Dates use the browser timezone, not Africa/Cairo | `currentEmployee.ts:12`, `ManageWorkspace.tsx:22` |
| S1-8 | Visual system contradicts the supplied playbook (square/hairline vs soft white cards on neutral canvas) | `index.css` vs playbook §1.1 |

### S2 — important

| # | Issue |
|---|---|
| S2-1 | No layout composer; `sortOrder` is a raw number input |
| S2-2 | No card size variants (1×1 / 2×1 / 1×2) |
| S2-3 | Archive is destructive-feeling and unconfirmed |
| S2-4 | No image alt text field; images get generated alt from the title |
| S2-5 | Admin table hides columns on mobile rather than reflowing |
| S2-6 | Touch targets 36px, below the playbook's 44px floor |
| S2-7 | No global audit log |
| S2-8 | Roles are effectively binary; `editor` cannot use the console at all |
| S2-9 | No acknowledgement path for mandatory notices |
| S2-10 | No update detail page — long content must live in an 800-char body or an external link |

### S3 — polish

| # | Issue |
|---|---|
| S3-1 | Loading state is unstyled text |
| S3-2 | No sticky save bar in the editor |
| S3-3 | Reminder sender field is a read-only placeholder |
| S3-4 | `ComponentShowcase`, `OptionB`, `Console`, `AIChatBox`, `Map`, `ManusDialog` are dead weight in the bundle |
| S3-5 | No "last published / updated just now" trust stamp |

---

## 5. "Do not break" inventory

These behaviours are correct and must survive the redesign.

1. **Confirmed publication.** `workspacePublishItemSchema` requires `confirmed: true`; the modal summarises section, go-live, expiry and owner.
2. **Live-item protection.** Editing a published item creates a private draft revision instead of mutating the live row (`server/db.ts:92`).
3. **Guarded transitions.** `canPerformWorkspaceAction` rejects illegal status changes before any write.
4. **Employee visibility filter.** `isEmployeeVisible` — active, live, not expired. No draft ever reaches `listCards`.
5. **Server-side authorisation.** Every mutation sits behind `adminProcedure`; the client guard is decoration.
6. **Preview renders the real page.** `<Home previewItems={…}/>` — not a mock.
7. **Scheduled/expiry sweep.** `sweepWorkspacePublicationLifecycle` is idempotent and writes history.
8. **Per-item history.** Every transition appends to `workspaceContentHistory`.
9. **RTL via logical properties.** `margin-inline`, `padding-inline`, `inset-inline`, plus icon mirroring.
10. **Reduced-motion support.** `@media (prefers-reduced-motion:reduce)` disables transitions and smooth scroll.
11. **Reversible-by-default copy.** "Every action is reversible. Drafts stay private until an administrator confirms publication."
12. **No fabricated content.** A prior pass removed invented names and figures. Every employee-visible number is derived from published rows or absent. Keep it that way.

---

## 6. Baseline state at audit time

```
tsc --noEmit    → clean
vitest run      → 10 files, 31 tests, all passing
pnpm install    → clean (via npx pnpm@10.4.1)
```

The suite covers lifecycle transitions, digest schemas, hover cards, links, greeting, logout, digest access, and an "enterprise policy" typography/contrast check. It does **not** cover routing, i18n content, timezone behaviour, or any React component.
