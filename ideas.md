# Arabtec Executive Briefing — Reference-Led Design Spec

## Ground-Truth Reference

The supplied Arabtec Workspace blueprint is the ground-truth visual specification. The Executive Briefing & Daily Digest must preserve its **editorial construction-site confidence**: pale concrete canvas, black grotesk typography, Arabtec red action signals, heavy horizontal rules, hairline dividers, dense information rhythm, and deliberate asymmetry. The interface must never drift into a generic dashboard, rounded-card SaaS aesthetic, neon treatment, or gradient-heavy marketing page.

## Design Movement

**Swiss editorial systems with construction-site wayfinding.** The design reads like a concise operational briefing: factual, sturdy, typographic, and decisively hierarchical.

## Core Principles

1. Put live operational information before decoration: what changed, what needs attention, and what will happen next are visible without scanning through panels.
2. Use black rules, red status edges, compact all-caps labels, and generous whitespace as the hierarchy system rather than heavy cards or shadows.
3. Design mobile screens as field-ready briefings, prioritizing due actions and the daily digest summary above the fold.
4. Make every directional layout choice logical-property based so Arabic can mirror without a second visual language.

## Color Philosophy

The canvas is a cool off-white resembling drafting paper or precast concrete. Carbon black carries all structural text and rules. **Arabtec signal red** is scarce and meaningful: attention, active navigation, warning, and operational counts. A restrained amber and green appear only for status semantics and always pair with readable wording.

## Layout Paradigm

Use an editorial **briefing rail** rather than a dashboard grid. A thin red vertical rail anchors the primary story, while long horizontal rules divide briefing modules. The desktop view is asymmetric: priority decisions and actions occupy the left reading column; compact digest items and updates occupy the right. On smaller screens this becomes a deliberate vertical briefing sequence instead of a compressed desktop layout.

## Signature Elements

1. A red inline-start rail beside page-intro and due-action content.
2. Heavy black rules framing module headers and separator bands.
3. Status rows with a colored inline-start edge, a compact status label, and a numeric or time reference.

## Interaction Philosophy

Interactions are direct and operational. Tabs, controls, and digest expansion use immediate state changes, visible focus, and short feedback rather than ornamental motion. The design speaks in compact action verbs: review, send, open, mark, filter.

## Animation

Use only transform and opacity. Tab transitions, digest disclosure, and press feedback should complete in 120–220ms using a decisive ease-out. Respect reduced-motion preferences. Do not animate layout dimensions or introduce entrance choreography that delays the briefing.

## Typography System

Use **Space Grotesk** for strong headlines, labels, and numeric emphasis; use **IBM Plex Sans** for readable operational copy; use **IBM Plex Sans Arabic** for Arabic text. Labels use uppercase with measured tracking in Latin only. Arabic copy uses zero letter-spacing and natural right alignment.

## Brand Essence

**A daily operational briefing that gives Arabtec leadership a fast, accountable view of people readiness and company communication.**

Personality: **decisive, grounded, accountable**.

## Brand Voice

Headlines state the decision or operational signal. CTAs are clear verbs and microcopy names the practical outcome.

Examples:

- “Three joiners start next week. Two decisions are still open.”
- “Send the Thursday digest after the owner review is complete.”

## Employee Workspace Correction

The employee-facing homepage must be **open and content-first**. Do not request sign-in, surface role controls, or present editorial workflows. Do not use generated photography. The first screen must orient an employee with a welcome message, the date, local conditions, immediate announcements, and the day’s priorities.

The primary communication modules are **Onboarding**, **Internal Job Ads**, **Company News**, **Announcements**, **Official Holidays & Events**, and **Industry News**. These modules should feel like a well-organized internal newspaper: one clear lead story, an announcement rail, purposeful metadata, and compact lists that explain what is new and why it matters. Use abstract graphic accents, line icons, typography, dates, and status rules instead of decorative imagery.

## Wordmark & Logo

Use a compact red angular construction mark paired with the `arabtec` wordmark treatment from the supplied reference. The mark is a bold graphic symbol, never a generic circular app icon.

## Signature Brand Color

**Arabtec Signal Red — #E11D2E**.

## Final Employee Dashboard Reference

The supplied dashboard reference now defines the production information architecture: compact top navigation; personal welcome with small operational counters; a secondary middle/right new-joiner card; onboarding progress; company news; announcements; weekly activities; industry watch; internal opportunities; quick access; resources; and a concise roadmap. The new-joiner image must support, not dominate, the welcome content and can be replaced through the administrator-managed card media field.

Every editorial destination is a reusable content card with a title, description, optional external link, and optional uploaded image or link-derived preview image. Public employees only browse and follow these cards. Content administration is isolated from the public dashboard and remains server-side role-gated.
