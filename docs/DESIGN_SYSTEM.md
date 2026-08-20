# Arabtec Workspace — Design System

Derived from **Arabtec Design System & Build Playbook v1.0 (August 2026)**, supplied as
`docs/reference/Arabtec_Design_System_Playbook.pdf`. Where the playbook is explicit it is
authoritative and quoted. Where it is silent, values are derived from the product-screen
references in the same document (pages 7–14) and recorded here as a derivation, not an invention.

> "The reference target is the Arabtec Employee Internal Dashboard: red-and-white corporate
> identity, dense white cards on a light neutral canvas, strong black headings, and a calm,
> information-first layout." — playbook, §preamble

## Non-negotiables (playbook, "Design extraction notes", p. 15)

1. Preserve the red-and-white corporate identity; ink for hierarchy, light-neutral canvas.
2. Red is the primary brand/action accent. **Never introduce green as a generic primary action colour** — green is reserved for confirmed success states.
3. Reuse strong black headings, thin red rules, dense white cards, subtle borders, calm supporting copy.
4. Mobile-first responsive behaviour; interactive targets **≥ 44 × 44 px**.
5. Use the true transparent SVG/PNG masters — never checkerboard artwork.

Red is used for "identity, primary actions, and emphasis only — never as a large background
fill behind body content."

---

## 1. Colour

The playbook specifies colour in OKLCH with hex approximations. Tokens ship as **hex** for
predictable rendering on older corporate browsers; the OKLCH source is recorded for provenance.

| Token | Value | Playbook source | Usage |
|---|---|---|---|
| `--brand` | `#D8232A` | `oklch(0.55 0.216 27.5)` | Logo, primary buttons, active nav underline, accent rules, the heading dot |
| `--brand-hover` | `#B7000F` | `oklch(0.49 0.20 27.5)` | Primary button hover / pressed |
| `--brand-soft` | `#FFEDEA` | `oklch(0.96 0.02 27.5)` | Icon tile backgrounds, subtle highlight rows |
| `--ink` | `#16181D` | `oklch(0.18 0.01 260)` | Headings, primary text |
| `--body` | `#4A4D53` | `oklch(0.42 0.01 260)` | Paragraphs, descriptions |

Derived neutrals (from the reference screens; not specified in the captured playbook pages):

| Token | Value | Usage |
|---|---|---|
| `--canvas` | `#F4F5F7` | Page background — the "light neutral canvas" |
| `--surface` | `#FFFFFF` | Cards, panels, inputs |
| `--surface-sunken` | `#FAFAFB` | Table headers, inset wells |
| `--muted` | `#6B7078` | Kickers, metadata, timestamps |
| `--line` | `#E4E6EA` | Card and control borders — the "subtle borders" |
| `--line-soft` | `#EDEEF1` | Internal dividers |

Status colours — quiet, single-purpose, never a rainbow dashboard:

| Token | Value | Usage |
|---|---|---|
| `--success` | `#0F5C34` | **Confirmed success only** (published, acknowledged) |
| `--warning` | `#8A5A00` | Needs attention (overdue review, expiring) |
| `--danger` | `#B7000F` | Destructive confirmation, validation errors |
| `--info` | `#245566` | Neutral informational state (scheduled, in review) |

### Contrast (WCAG 2.1 AA, verified)

| Pair | Ratio |
|---|---|
| ink on white / canvas | 17.76 : 1 / 16.28 : 1 |
| body on white / canvas | 8.48 : 1 / 7.77 : 1 |
| muted on white / canvas | 4.98 : 1 / 4.57 : 1 |
| brand on white | 5.01 : 1 |
| white on brand | 5.01 : 1 |
| success / warning / danger on white | 8.07 / 5.93 / 6.95 : 1 |

Every foreground token clears 4.5 : 1 on both the surfaces it is used on.

---

## 2. Typography

**Decision (recorded):** the previous build paired *Space Grotesk* (display) with *IBM Plex Sans*
(body) and *IBM Plex Sans Arabic*. Space Grotesk has **no Arabic companion**, so Arabic headings
fell back to a mismatched face — a direct violation of the brief's requirement that Arabic use a
proper Arabic pair rather than a Latin font forced onto Arabic.

We standardise on the **IBM Plex superfamily**: `IBM Plex Sans` for Latin and `IBM Plex Sans Arabic`
for Arabic. They are designed together, share metrics and weight structure, are already licensed and
already loaded by the app, and give a true bilingual pair. Space Grotesk is dropped.

```
--font-sans:   "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Arial, sans-serif
--font-arabic: "IBM Plex Sans Arabic", "IBM Plex Sans", system-ui, Arial, sans-serif
```

`:lang(ar)` and `[dir="rtl"]` switch to `--font-arabic` and force `letter-spacing: 0` — Arabic is a
connected script and tracking breaks joins.

### Scale

Corporate, tight, no fluid clamps below the display size.

| Token | Size | Line height | Tracking | Use |
|---|---|---|---|---|
| `--text-2xs` | 12px | 1.35 | `.06em` | Badges, table micro-labels |
| `--text-xs` | 13px | 1.4 | `.08em` | Kickers (uppercase), metadata |
| `--text-sm` | 14px | 1.5 | `0` | Secondary body, table cells, controls |
| `--text-base` | 16px | 1.55 | `0` | Body copy, card deks |
| `--text-lg` | 20px | 1.35 | `-.01em` | Card titles |
| `--text-xl` | 24px | 1.25 | `-.015em` | Section headings |
| `--text-2xl` | 32px | 1.15 | `-.02em` | Page headings |
| `--text-display` | `clamp(32px, 4vw, 44px)` | 1.05 | `-.025em` | Hero heading only |

**Rules.** Minimum rendered size is 13px. Negative tracking only at ≥ 20px. Uppercase only for
kickers and table headers, always with `.06–.08em` tracking. Weights used: 400, 500, 600, 700.

### The heading dot

The playbook lists "the heading dot" as a brand-red usage. Reference screens show page headings set
as `Leave Dashboard` + a red full stop. Implemented as `.heading-dot::after { content: "."; color: var(--brand) }`
on page-level headings only — never on card titles.

### The red rule kicker

The signature pattern across every reference screen: a **24 × 3 px brand-red rule**, a 12px gap, then
an uppercase tracked kicker in `--muted`. This replaces the previous 3px ink top-border on cards.

---

## 3. Spacing, radius, elevation

```
--space-1: 4px    --space-4: 16px   --space-7: 48px
--space-2: 8px    --space-5: 24px   --space-8: 64px
--space-3: 12px   --space-6: 32px
```

| Radius | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | Buttons, inputs, badges, selects |
| `--radius-md` | 14px | Cards, panels, modals |
| `--radius-lg` | 20px | Media wells, full-bleed image frames |

No pill radii except the language toggle and status dots.

**Elevation — one step only.** `--shadow-card: 0 1px 2px rgba(22,24,29,.04)` and
`--shadow-raised: 0 4px 16px rgba(22,24,29,.08)` for modals and drawers. No glow, no
glassmorphism, no coloured shadows.

---

## 4. Grid and layout

- **Max width 1280px**, page padding 24px desktop / 16px mobile.
- Employee card grid: **12-column** conceptually, expressed as a 4-track CSS grid.
  - ≥ 1280px → 4 columns · 1024–1279 → 3 · 768–1023 → 2 · < 768 → 1
- **Card size variants**: `1×1` (default), `2×1` (double width), `1×2` (double height). At the
  1-column breakpoint every variant collapses to full width and natural height — no horizontal
  scroll, ever.
- Admin shell: fixed 248px sidebar ≥ 1024px, collapsing to a horizontal section bar below.
- Density: **editorial-calm** on the employee side (generous whitespace, 24px card padding),
  **data-dense** on the admin side (12–14px cell padding, 14px type).

---

## 5. Components

| Component | Specification |
|---|---|
| **Button** | Height 44px (40px for `sm` in dense admin tables, still 44px hit area via padding). Radius 8px. Primary = brand fill, white text. Secondary = white fill, `--line` border, ink text. Ghost = transparent, ink text. Danger = `--danger` fill. Icon + label, 8px gap. |
| **Card** | White, radius 14px, 1px `--line`, `--shadow-card`, 24px padding. Optional red-rule kicker at top. Media well is full-bleed to the card edge with 16:9 ratio, radius clipped to the card's top corners. |
| **Badge** | 12px uppercase, `.06em`, radius 8px, 1px border, transparent fill, coloured ink. One per status. |
| **EmptyState** | One line of 14px `--muted` text, optional single action. **One shared component** — never eight variants of the same sentence. |
| **DataTable** | `--surface-sunken` header, 12px uppercase tracked labels, 1px `--line-soft` row rules, no zebra striping. Below 768px each row becomes a stacked card with visible labels — columns are never hidden. |
| **Modal / Drawer** | Radius 14px, `--shadow-raised`, scrim `rgba(15,18,22,.45)`. Focus trapped, Escape closes, destructive actions require explicit confirmation. |
| **Input / Select / Textarea** | White, radius 8px, 1px `--line`, 44px min height, 12px 14px padding. Focus = 2px brand ring at 2px offset. Inline error text below the field in `--danger`, never toast-only. |
| **Icons** | Lucide, 1.5px stroke, monochrome, 16px inline / 18px controls / 20px headers. |

---

## 6. Motion

```
--ease: cubic-bezier(.2, 0, 0, 1)   /* standard */
--dur-fast: 120ms
--dur: 160ms
```

Fade and slide only. No bounce, no spring, no scale-in. Every transition is disabled under
`prefers-reduced-motion: reduce`.

---

## 7. Bilingual and RTL

- Layout uses **logical properties exclusively** (`margin-inline`, `padding-inline`, `inset-inline`,
  `border-inline-start`). No `left`/`right` in the stylesheet — enforced by `pnpm check:logical-css`.
- Directional icons (arrows, chevrons) mirror under `[dir="rtl"]`.
- Dates and numbers use `Intl` with the active locale and **`timeZone: "Africa/Cairo"`** everywhere.
- Arabic uses Western Arabic numerals (`ar-EG-u-nu-latn`) for dates and counts so that figures stay
  scannable alongside English in a mixed-language office. Recorded as a deliberate decision.
- Every string is authored in both languages, or the Arabic falls back to English **and is flagged
  to the admin** as missing — it is never silently blank.

---

## 8. What this system forbids

Explicitly out of bounds, per the playbook and the brief:

- Green as a primary action colour (success states only)
- Red as a large background fill behind body content
- Gradients, neon, glassmorphism, heavy or coloured drop shadows
- Stock-illustration empty states
- Pill-shaped everything
- Rainbow status dashboards
- Type below 13px
- Interactive targets below 44 × 44 px
- Any CSS flourish not evidenced in the reference screens
