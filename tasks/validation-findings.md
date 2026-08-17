# Authenticated Console Validation Findings

The `/console` route completed Manus authentication with an **Admin** session and rendered the protected daily-digest review surface. The console displays the expected editorial sidebar, editable release metadata and content blocks, audience review summary, save-draft and submit-for-review controls, and the Admin-only publish control.

The initial loading state resolves once the authentication session and protected digest query complete. The build and test checks are tracked separately in the project TODO history.

## Employee Workspace Correction

The corrected homepage renders without sign-in, account controls, generated photography, or console entry points. Desktop validation confirms the intended sequence: welcome and date, daily signals, important announcement, company news, onboarding, internal opportunities, official events, and an industry context panel. Mobile validation confirms the same content collapses into a readable single-column employee feed with functional notice dismissal and opportunity expansion controls available in the UI.

## Split Onboarding Hero Redesign

Desktop validation confirms the first fold is now divided into a copy-led onboarding welcome on the left and an adjacent dark, horizontally scrollable onboarding-story gallery on the right. The generated gallery artwork is abstract and architectural rather than employee photography. Company news follows immediately in three distinct visual cards, paired with a high-contrast announcement board. Mobile validation confirms the same hierarchy becomes a readable vertical feed; the gallery remains horizontally scrollable and the cards retain their visual differentiation.

## Two-Option Layout Comparison

Both option routes compile and render at desktop and mobile widths. **Option A** implements the requested desktop arrangement: fixed welcome copy, two independently automated vertical feeds for onboarding and company news, and a fixed calendar/index/upcoming-activity rail. It remains usable on mobile, but its two continuous feeds produce a comparatively long mobile page. **Option B** uses a manual onboarding carousel, a stable news list, and a compact utility rail; it presents the same content with a shorter, clearer mobile reading sequence. The comparison control is available at the top of both options.

## New-Joiner Card Rebalance

Desktop validation confirms the new-joiner card now occupies the far-right supporting slot at the same one-column footprint as the welcome, onboarding, and weekly-activity cards. Its photo and copy are scaled down, keeping the broad dashboard focused on the whole employee experience. Mobile validation confirms the compact card follows the welcome and weekly activity surfaces without dominating the vertical reading sequence.

## Square Cards and Managed Hover Cards

The top dashboard row is now composed of equal square modules: welcome, announcements, weekly activities, and the supporting new-joiner card. The newcomer portrait uses contain sizing, preserving the full image rather than using a narrow face crop. Company news, announcements, industry watch, activities, and employee cards now carry accessible hover/focus overlays backed by repeatable hover-card data. The Admin page displays existing hover-card tiles and an **Add hover card** action that opens an empty square editor supporting text, HTTPS link previews, and image uploads.
