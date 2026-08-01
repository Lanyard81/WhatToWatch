---
target: WhatToWatch app-wide review
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-01T13-27-39Z
slug: whattowatch-app-wide-review
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good micro-feedback ("Adding…", "Copied!") but loading states are bare "Loading…" text, no skeletons |
| 2 | Match System / Real World | 1 | Raw Firebase error codes and a literal `firebase deploy --only firestore:rules` string shown to end users |
| 3 | User Control and Freedom | 3 | Cancel buttons everywhere, 5s undo-toast on delete — genuinely solid |
| 4 | Consistency and Standards | 2 | Filter bar is `<select>`s on Watched but `<button>`s on Search; view toggle exists only on Want to Watch; `.badge-tv` hardcodes a color outside the theme token system |
| 5 | Error Prevention | 3 | Duplicate-add blocked, destructive actions confirmed |
| 6 | Recognition Rather Than Recall | 2 | Fallback invite path requires manually copy-pasting a raw Firebase UID |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, no bulk actions, nothing for a returning power user beyond what a first-timer gets |
| 8 | Aesthetic and Minimalist Design | 2 | Not cluttered, but "minimal" here means undesigned — one flat style stamped on every screen |
| 9 | Error Recovery | 1 | Same leak as #2 — dev-facing strings, no friendly recovery guidance |
| 10 | Help and Documentation | 2 | Scattered `.hint` text helps in spots; no onboarding for a first-time joiner |
| **Total** | | **20/40** | **Acceptable — significant improvements needed** |

#### Design Specificity Verdict

**LLM assessment**: Generic. Strip the TMDB posters and the word "household" and this is indistinguishable from a to-do app or a CRM list. Every screen shares one card pattern, one button system, one border-radius, one accent color applied identically everywhere, and zero typographic personality (`system-ui` at 16px throughout, no display face for hero moments). The only two places the product's actual identity — a cozy, personal, two-person ritual — shows through are the 🎲 "what should we watch tonight" picker and the poster-carousel toggle. Settings in particular reads as an admin console: raw Firebase UIDs, raw error codes, a wall of uppercase `<h3>` labels separated by margin alone.

**Deterministic scan**: `detect.mjs` returned exit 0 / zero findings against `src/`. Caveat, not a clean bill of health: the detector's fuller HTML/CSS-cascade engine only runs on `.html` files; this project has none (pure React source), so the scan fell through to a narrower regex-only pass. Treat this as "nothing the shallow scanner catches," not "no issues."

**Visual overlays**: Not available — no live overlay could be injected (see Assessment B limitations below). In its place, Assessment B substituted a manual static CSS audit plus live `getComputedStyle`/`getBoundingClientRect` reads against the one page reachable without authentication (Login), which turned up concrete, numeric findings folded into Priority Issues below.

#### Overall Impression

Functionally the app is in good shape — the gut reaction from both assessments is that nothing is *broken*, but nothing *looks designed* either. The single biggest opportunity: pick one deliberate visual identity (a household "wordmark" moment, a poster-forward default view, warmer typography) and let it run through every screen, instead of the current flat, interchangeable component system. Close behind: fix the accent-color contrast failures, which are a real accessibility problem baked into all four color presets, worse in dark mode.

#### What's Working

1. **The runtime-filtered random picker** ("what should we watch tonight?" on Want to Watch) is a feature no generic list app has — the clearest signal that this is built for movie night, not task management.
2. **The undo-toast on delete** (5s window, mounted above the router so it survives navigation) is a thoughtfully forgiving pattern for a shared tool where one person's delete affects everyone else.
3. **Contrast for body text is genuinely strong** — `--text`/`--bg` pairs measured 7.8–20:1 across light and dark, well past WCAG AA. The problem is isolated to accent-colored elements, not the whole palette.

#### Priority Issues

**[P1] Accent-on-white button text fails WCAG AA contrast, systemically.**
- **Why it matters**: Every primary button, and the active rating-pick state, renders white text on a solid accent background. Measured contrast: purple 4.39:1 light / 2.64:1 dark, blue 3.82 / 2.52, green 2.65 / **1.85**, rose 3.98 / 2.82 — every combination fails the 4.5:1 AA threshold, and dark-mode green is barely above half the required ratio. This sits on every screen's primary call-to-action.
- **Fix**: Add an `--on-accent` token per preset (near-black or near-white chosen per-preset for contrast, not a blanket white), or darken/desaturate the accent values specifically for solid-fill contexts while keeping the lighter values for text-on-background use (which already passes at 6.3–9.7:1 in dark mode).
- **Suggested command**: `/impeccable audit` (accessibility) then `/impeccable colorize` to rebuild the token set.

**[P1] No distinct visual identity — reads as generic CRUD software.**
- **Why it matters**: The product's value is entirely social/emotional (a shared ritual between 2–3 people), and the interface currently communicates none of that. This is the literal thing you flagged asking for a revamp.
- **Fix**: Make posters-by-default the primary Want to Watch view (not an opt-in toggle), surface the household name as a visible identity element outside Settings, differentiate Watching from Want to Watch with a distinct "in progress" visual motif, and introduce one expressive display typeface for hero moments (h1 on Login, title on Detail) distinct from the UI sans.
- **Suggested command**: `/impeccable typeset`, `/impeccable colorize`, `/impeccable layout`.

**[P1] Developer-facing strings and UID-based invite leak into the real product.**
- **Why it matters**: `HouseholdContext.tsx` shows `'Firestore rejected this request — have the security rules been deployed? (firebase deploy --only firestore:rules)'` directly to end users on permission errors; sign-in failures show raw codes like `auth/wrong-password`; the fallback invite path is "copy your raw Firebase UID and text it to someone." A non-technical household member seeing a `firebase deploy` command will conclude the app is broken.
- **Fix**: Map every auth/Firestore error code to plain-language copy; log technical detail to console only; demote "Add by user ID" to an "Advanced" disclosure behind the already-good invite-link flow.
- **Suggested command**: `/impeccable clarify`.

**[P2] Settings is one undifferentiated 9-section wall.**
- **Why it matters**: Household info, ratings, appearance, stats link, CSV import, invite link, add-by-UID, your-UID, and leave/sign-out are separated only by margin and small-caps labels. Finding "invite my partner" requires scanning past CSV-import instructions and leave-household warnings on a screen the household will use often.
- **Fix**: Group into visually distinct cards (Household / Appearance / Data / Danger Zone), collapse rare actions (CSV import, add-by-UID) behind expandable disclosures, isolate Leave/Sign-out into a clearly separated danger zone.
- **Suggested command**: `/impeccable layout`.

**[P2] Inconsistent patterns and a theme-token bypass.**
- **Why it matters**: The filter bar is `<select>` dropdowns on Watched but `<button>` toggles on Search; the list/posters view toggle exists only on Want to Watch, not Watching or Watched, despite all three rendering the same `TitleCard`; `.badge-tv` hardcodes `#3aa0ff`/`rgba(59,170,255,.12)` outside the `--accent` token system, so it doesn't respond to the user's chosen accent or theme the way `.badge-movie` correctly does. Separately, empty states ("Nothing on your list yet — search to add something.") and loading states (bare "Loading…" text) are placeholder-grade — this is literally Jordan-the-first-timer's first real screen after setup.
- **Fix**: Standardize the filter control pattern app-wide, extend the view toggle to all three lists, add `--badge-tv`/`--badge-tv-bg` tokens, replace empty states with a real CTA button + icon, replace text loading states with skeleton cards sized to `.title-card`.
- **Suggested command**: `/impeccable polish`, `/impeccable onboard`.

#### Persona Red Flags

**Jordan (First-Timer)**: Lands on a bare Login screen visually identical to any auth form. After joining, lands on an empty Want to Watch list with only a hint sentence — no onboarding, no highlighted path forward. `HouseholdSetupPage` opens with a dense disclaimer paragraph before the actual form field.

**Sam (Accessibility)**: The button-contrast failures above hit Sam hardest — white-on-accent text at 1.85–2.82:1 in dark mode is very hard to read for low-vision users. Font sizes throughout `index.css` are px, not rem, so they won't scale with OS-level text-size accessibility settings the way rem values would; the smallest sizes (10–11px, nav labels and badges) are already tight before any zoom is applied.

**Riley (Stress Tester)**: `TitleDetailPage`'s delete flow calls `requestDelete` then immediately navigates away — if you hit back within the 5-second undo window and reopen the same title, it loads normally with zero visual indication it's pending deletion. Small but real: a "deleted" item can flash back as if nothing happened.

#### Minor Observations

- `TitleCard`'s meta line concatenates year/runtime/genre into one middot-joined string with no wrapping consideration for long genre lists on narrow screens.
- "Copy as text" export (Watched page) is a genuinely nice feature with no visual distinction from lower-stakes buttons around it.
- CSV import runs up to 150 sequential network calls with no cancel/abort control — a long-running mobile operation with no way out.
- `--danger` red (#d33) fails AA contrast in dark mode (3.91:1) — the delete-confirm text and error messages use this.
- Spacing scale is mostly a clean 2/4px grid, with one outlier: `.view-toggle button { padding: 7px 12px }`.
- Font-size scale has 10 distinct values with no coherent ratio (five separate sizes packed into 10–14px alone) — reads as picked ad hoc per component.
- Touch targets on Login measured 45px/43px tall (Google button/inputs vs. submit button) — a 2px inconsistency from box-model differences between `.secondary` and primary button styles, not a hard failure but worth aligning.

#### Questions to Consider

1. If the whole point is "cozy, personal, two-person household," what's the *one* visual decision — posters-by-default, a household wordmark, warmer imagery — that would most signal "movie night" instead of "database"?
2. Delete gets a confirm step *and* a 5-second undo toast; marking something Watched — the actual finish line of the core loop — gets total silence. Intentional, or just never designed?
3. Is a flat single-accent icon nav the right shell for a PWA meant to be opened casually and often, together — or should the home screen feel more like a shared poster wall than a list app?
