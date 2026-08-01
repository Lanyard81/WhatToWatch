# WhatToWatch — Session Handoff

**Date:** 2026-08-02
**Repo:** https://github.com/Lanyard81/WhatToWatch (main branch, public)
**Live:** https://lanyard81.github.io/WhatToWatch/
**Firebase project:** `watchtracker-80372`

This document is written for whoever (human or Claude) picks this project up next. It covers what exists, how it got here, what's genuinely unfinished, and where the sharp edges are.

---

## 1. What this app is

A household movie/TV watch-tracker PWA for 2–3 people, built to the pattern of a sibling app called "The Kitchen." Core loop: search TMDB → add to Want to Watch → optionally move to Watching → mark Watched with a date, rating, tags, notes. Shared in real time across household members via Firestore.

## 2. Tech stack

- **Frontend:** React 19 + TypeScript + Vite, deployed as an installable PWA (`vite-plugin-pwa`, `generateSW` mode)
- **Backend:** Firebase Firestore (data) + Firebase Auth (Google + email/password)
- **Metadata:** TMDB API (`v3`), client-side calls with the API key embedded in the bundle (this is normal/expected — TMDB v3 keys and Firebase web config are not secrets, protection is via Firestore security rules, not key secrecy)
- **Hosting:** GitHub Pages via `gh-pages` npm package (`npm run deploy` builds + pushes `dist/` to the `gh-pages` branch)
- **Fonts:** Self-hosted via `@fontsource` (Bricolage Grotesque + Instrument Sans) — deliberately not loaded from Google Fonts CDN, to preserve offline PWA capability
- **No test suite.** No CI. Verification throughout this project was manual: `npm run build` (tsc + vite) for type/build correctness, and browser inspection for anything visual. This is a known gap — see §6.

## 3. Environment / secrets

- `.env` (gitignored, **not** in the repo) holds `VITE_FIREBASE_*` and `VITE_TMDB_API_KEY`. Copy `.env.example` and fill in real values to run locally.
- Firebase CLI (`firebase-tools`) is installed globally on this machine and already authenticated as `dlivermore.au@gmail.com` — `firebase deploy --only firestore:rules` and `firestore:indexes` work directly from this environment without needing interactive login again (that hurdle is already cleared).
- GitHub CLI (`gh`) is authenticated as `Lanyard81` — `git push` and `gh-pages` deploys work directly.

## 4. How to run / deploy

```bash
npm install
npm run dev          # local dev server, http://localhost:5173/WhatToWatch/
npm run build         # tsc -b && vite build — the only automated check that exists
npm run deploy         # build + publish dist/ to gh-pages branch
firebase deploy --only firestore:rules      # after editing firestore.rules
firebase deploy --only firestore:indexes    # after editing firestore.indexes.json
```

Standard workflow used all session: edit → `npm run build` (must be clean) → browser sanity check on the **login page only** (see §6 on why) → `git add -A -- ':!.env'` → commit → push → `npm run deploy`.

## 5. What's been built (chronological, so the "why" is traceable)

### Phase 1 — core loop
Auth (Google + email/password), household creation, TMDB search-and-add, Want to Watch / Watched lists, mark-watched-with-date flow, PWA install, GitHub Pages deploy.

### Phase 2 — ratings & tags
Shared vs. individual rating modes (household setting), 1–10 rating picker, "would rewatch" toggle, free-text tags with household-wide autocomplete suggestions.

### Household growth
- Shareable invite links (`/join/{householdId}`) — the household ID itself is the invite token (unguessable Firestore auto-ID, never exposed via `list` queries). Security rule (`isSelfJoin()` in `firestore.rules`) lets a non-member append *only their own* uid to `memberIds`, nothing else.
- "Leave household" (Settings → Danger zone) so someone who accidentally created their own household can leave it and use an invite link instead.
- Fallback "add by user ID" for when link-sharing isn't convenient.

### Feature backlog from a self-directed review
"Currently watching" status/tab, notes field, random-pick-for-tonight (with runtime filter), stats page, CSV import (Letterboxd/IMDb export format), plain-text bulk-add (paste a list of titles, TMDB-matched), copy-watched-list-as-text, search by actor (TMDB person search → combined credits).

### Design system (two passes — read this carefully, the second superseded the first)
1. **First pass:** a from-scratch design token system (purple/blue/green/rose accent presets, Fraunces display font) built after a formal dual-agent Impeccable design critique (scored 20/40 — full report at `.impeccable/critique/2026-08-01T13-27-39Z__whattowatch-app-wide-review.md`).
2. **Second pass — current state:** the user asked for a restyle to match a sibling app "The Kitchen." This **replaced** the Fraunces/purple system entirely with:
   - **"Olive Grove" token system** — earthy green/mustard palette, given as exact hex values by the user, all independently contrast-verified (not eyeballed) via a small Node script computing WCAG contrast ratios.
   - **4 colour schemes** (Settings → Appearance): Olive Grove (default), Terracotta, Indigo Dusk, Rosewood. Each scheme swaps only the primary/accent hues over the same neutral scale — not 4 fully independent 16-token palettes — which kept the design maintainable while still being genuinely different-looking. Every pairing in all 4 schemes was contrast-verified the same way.
   - **Bricolage Grotesque + Instrument Sans**, self-hosted.
   - **Radius scale** (`--radius-xs/sm/md/lg/pill`) and **elevation system** (`--elev1/elev2/rim/pressed`) applied throughout — structural cards/buttons/tab bar get soft shadow + rim, dense list rows (title cards, search results) stay flat, active tab/FAB get the stronger elevation.
   - **Navigation restructure:** bottom tab bar cut to 3 items (Want to Watch / Watching / Watched); Settings demoted to a 44×44 icon in a new persistent `TopBar`; a floating action button (bottom-right, mustard) replaces the old "Add" tab, deliberately kept as a floating corner button per explicit instruction (not inline like Kitchen's own pattern).
   - **Contextual back button** on the detail page — tracks where you actually navigated from via router state, instead of a single hardcoded guess.

## 6. Known limitations / things NOT done

This is the important section. Read before assuming something works.

- **No live end-to-end testing by Claude, ever, in this entire project.** Every authenticated screen (everything except the login page) was built and verified only via: (a) `npm run build` type-checking, (b) reading the rendered login page in a sandboxed browser tool, and (c) occasional targeted `getComputedStyle`/`getBoundingClientRect` JS execution for specific CSS questions (poster carousel sizing, theme token values). Claude **cannot sign in** — entering credentials/completing OAuth on the user's behalf is off-limits by design. Every other screen (Want to Watch, Watching, Watched, Search, Settings, Detail, Stats, Join) has been visually confirmed **only by the human user**, via screenshots they pasted into chat, not by Claude directly. **Treat any authenticated-screen bug report from the user as the first real signal for that code path** — it may not have been exercised at all beyond compiling.
- **No "remove member" feature.** You can invite (link or UID) and leave, but there's no way for an existing member to kick someone else out. Documented as a known gap in the Settings copy itself.
- **No invite-link revocation.** The household ID is the permanent invite token; there's no rotating/expiring mechanism. Low risk at 2–3 person scale, worth flagging if the household ever wants tighter control.
- **One household per account**, hard assumption throughout (`HouseholdContext` picks the first household where `memberIds array-contains` the uid). `JoinPage` explicitly blocks joining a second household rather than supporting it.
- **CSV import capped at 150 rows**, no cancel/abort button on a long-running sequential TMDB-matching loop. Same cap and same gap on the plain-text bulk-add feature (200 lines there).
- **Import/bulk-add match confidence is best-effort.** Ambiguous titles (remakes, common names) can silently match the wrong TMDB entry. Both features surface what they matched to for spot-checking, but nothing more sophisticated (no fuzzy-match confidence score, no "did you mean" disambiguation UI).
- **`--faint` and `--disabled-text` tokens sit right at the 4.5:1 WCAG floor** (4.51–4.53:1 measured) in the Olive Grove scheme, by the user's own design intent — not a bug, but zero margin for error if anyone nudges those hex values later without re-checking.
- **`--head-mut` token is defined but deliberately unused** for small headings — it measured 3.78:1 against `card` in light mode, which fails normal-text AA. It's there for a future use case that's unambiguously large/bold text, not wired into anything currently.
- **No automated tests, no CI, no linting gate beyond `oxlint` being available but not enforced.**
- **No offline testing performed.** Firestore persistent local cache (`persistentLocalCache`) is enabled in `src/lib/firebase.ts`, and the PWA precaches its own shell, but nobody has actually turned off wifi and confirmed lists render from cache.
- **No episode-level TV tracking** — a show is "watched" as a single binary state, deliberately, per the original spec's own scoping note ("don't over-engineer episode tracking unless you actually want that").
- **Theme/scheme verification method note:** testing color scheme CSS cascade through the *running React app* by manually setting `data-scheme` via JS console failed silently — React's own `useEffect` in `ThemeContext` resyncs the attribute back to its state on any re-render, overwriting manual test changes. The fix was building an isolated static HTML test page (outside React, referencing the same compiled CSS) to verify cascade behavior directly. If you need to debug theme CSS again, use that technique, not live DOM poking on the running app.
- **Bundle size warning on every build** (`Some chunks are larger than 500 kB`) — never addressed, not a functional issue, just unoptimized code-splitting (Firebase SDK + all font weights in one chunk). Fine at this app's traffic scale.

## 7. Failed approaches (so they aren't retried blindly)

- **`firebase login` via non-interactive Bash** — fails outright ("Cannot run login in non-interactive mode"). OAuth-based CLI logins need a real interactive terminal; the user had to run this themselves.
- **`signInWithPopup` inside the sandboxed preview browser tool** — appeared to hang with no popup ever appearing. This was a tooling limitation of the sandboxed browser, not a real bug — confirmed once the user tested `signInWithPopup` in their actual Chrome and it worked. Don't diagnose "popup auth is broken" from behavior observed only in the agent's sandboxed browser.
- **`signInWithRedirect` on Safari** — genuinely broken, not a tooling artifact. Safari's tracking-prevention drops session state during the redirect round-trip to Firebase's auth domain. Switched to `signInWithPopup` as the primary (and now only) Google sign-in method for this reason.
- **Firestore security rule using `+` for list concatenation** (`after == before + [uid]`) — compiled with warnings from Firebase's own rules linter about ambiguous typing on list operators; replaced with `after.size() == before.size() + 1 && after.hasAll(before)`, which is unambiguous and compiles clean.
- **Firestore security rule using `get()` to self-reference the document being queried**, inside a rule meant to filter a `list`/collection query (`where('memberIds', 'array-contains', uid)`) — caused persistent `permission-denied` even though the equivalent `get()` (single-document read) worked fine. Fixed by switching to `resource.data.memberIds` directly for the `list`/`get` rules on `households`, reserving `get()`-based cross-document checks for rules on subcollections (titles, ratings, tags) where it's genuinely needed and known to work.
- **Bulk-importing the user's own pasted movie list via a one-off Firebase Admin SDK script** — considered, then abandoned in favor of building a proper in-app "paste a list" feature. Reasoning: obtaining Admin SDK credentials non-interactively would have needed either a fragile `gcloud auth application-default login --no-launch-browser` device-code dance, or bypassing Firestore security rules entirely with elevated access outside the app's own auth flow. Building the feature into the app itself (client-side, using the user's own authenticated session, respecting the same security rules as everything else) was both safer and more useful going forward — see `BulkAddSection.tsx`.
- **Testing colour-scheme CSS by setting `data-scheme` via `javascript_tool` on the live running app** — see §6, React silently overwrote it. Static isolated test page worked; live-app DOM poking didn't, when the value being tested is also owned by React state.

## 8. Suggested next steps, roughly in priority order

1. **Get real device testing done.** Every authenticated screen needs a pass on an actual phone (the target platform) in both light and dark, across at least 2 of the 4 colour schemes. This has never happened from Claude's side — only from the human user's own spot checks via pasted screenshots.
2. **Decide on member removal.** If this app is going to be used by anyone outside full mutual trust, "no way to remove a member" is the sharpest edge in the current permission model.
3. **Consider a lightweight automated check** — even just a GitHub Action running `npm run build` on push would catch the class of TS/build errors this session caught manually every time, for free.
4. **Revisit CSV import / bulk-add row caps and abort control** if real usage ever approaches 150–200 items (a big multi-year Letterboxd export could exceed this).
5. **If contrast ever needs adjusting** (new theme, tweaked hex), re-run the same verification pattern used throughout this session: a short Node script computing WCAG contrast via relative luminance, not eyeballing hex codes. The formula's in every commit message that touched color, and in `.impeccable/critique/` history.

## 9. File map (for orientation)

```
src/
  lib/
    firebase.ts       Firebase init (persistent local cache enabled)
    tmdb.ts            All TMDB API calls: title search, person search, credits, details
    csv.ts             Minimal CSV parser (Letterboxd/IMDb import)
    errorMessages.ts   Firebase error code → plain-language copy
  context/
    AuthContext.tsx        Firebase Auth wrapper (Google popup + email/password)
    HouseholdContext.tsx   Realtime household doc, create/join/leave/addMember
    ThemeContext.tsx       Light/dark/system + 4-scheme colour picker, persisted to localStorage
    PendingDeleteContext.tsx   5s undo-delete toast pattern, used household-wide
  hooks/               One hook per Firestore query shape (titles, single title, ratings,
                        members, household tags, existing-tmdb-ids-for-dup-check, etc.)
  components/          Shared UI: TitleCard, PosterCarousel, BottomNav, TopBar,
                        FloatingActionButton, PageHeader, Skeleton, TagInput, SignInForm,
                        icons.tsx (shared SVG icon set), BulkAddSection, ImportHistorySection
  pages/               One per route — see App.tsx for the route table
firestore.rules         Security rules — read the comments, they explain non-obvious
                         choices (self-join pattern, list-vs-get rule split, ratings
                         doc-ID-as-permission-check)
firestore.indexes.json  Composite indexes (status + addedAt/watchedAt)
.impeccable/critique/   Persisted design critique report from the Impeccable skill run
```

---

*If you're an AI picking this up cold: read `firestore.rules` in full before touching auth/household logic — several rules encode fixes for permission-denied bugs that aren't obvious from the rule alone without the comments. And don't trust that an authenticated screen works just because it compiles — see §6.*
