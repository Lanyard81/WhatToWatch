# What To Watch

Household movie & TV watch tracker. React + Vite PWA, Firebase (Auth + Firestore), TMDB for metadata, deployed to GitHub Pages.

Ratings use a 1-10 scale.

## Phase 1 status

Core loop is built: sign in, create/join a household, search TMDB, add to Want to Watch,
mark watched with a date, view both lists. Ratings, tags, and "would rewatch" land in Phase 2.

The app throws on load until real Firebase keys are in `.env` — that's expected, not a bug
(Firebase's `getAuth()` fails fast on a placeholder API key).

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project (Spark/free plan is enough).
2. **Build → Authentication → Get started → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database → Create database** → start in production mode, pick a region.
4. **Project settings → General → Your apps → Add app → Web**. Copy the `firebaseConfig` values.
5. **Authentication → Users → Add user** — create an account for yourself and one for your housemate (email + password each).

## 2. Get a TMDB API key

1. Sign up at [themoviedb.org](https://www.themoviedb.org/), then **Settings → API → Request an API key** (choose "Developer").
2. Copy the **API Key (v3 auth)** value.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase config values and TMDB key.

## 4. Install and run

```bash
npm install
npm run dev
```

Open the printed local URL. Sign in with one of the accounts you created in Firebase Auth.
The first person to sign in creates the household; from **Settings**, add the second person's
user ID (shown on their own Settings page once they sign in) to bring them into the household.

## 5. Deploy Firestore security rules

Install the Firebase CLI once, then deploy rules from this repo:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

Rules restrict all household data to signed-in users listed in that household's `memberIds`.

## 6. Deploy to GitHub Pages

`vite.config.ts` is set up with `base: '/WhatToWatch/'`, matching this repo's name
([github.com/Lanyard81/WhatToWatch](https://github.com/Lanyard81/WhatToWatch)). If you ever
rename the repo, update `base` (and the PWA manifest's `start_url`/`scope`) to match.

```bash
npm run deploy
```

`npm run deploy` builds and publishes `dist/` to the `gh-pages` branch via the `gh-pages` package.
Enable GitHub Pages for that branch in the repo's Settings → Pages.

On your phone, open the deployed URL in Chrome/Safari and use "Add to Home Screen" to install
it as a PWA.

## Project structure

```
src/
  lib/          firebase.ts, tmdb.ts — external service clients
  context/      AuthContext, HouseholdContext — realtime auth/household state
  hooks/        useTitles — realtime Firestore list query
  pages/        one file per route
  components/   TitleCard, BottomNav
firestore.rules
```
