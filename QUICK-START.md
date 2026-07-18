# Tudu Quick Start

## Flow

**Landing → Sign In → Onboarding → Discover**

1. Open the landing page on your phone or desktop.
2. Tap **Sign In** (header) or **Find Something To Do** (routes to sign-in when logged out).
3. Sign in with the demo account below.
4. Complete onboarding (Interests → Budget → Distance → Timeframe → Friends), or tap **Skip onboarding**.
5. Land on **Discover** (Things Tudu card deck) with bottom navigation.

Returning users who already finished onboarding skip straight to `/discover` after sign-in.

## Demo account

| Field    | Value           |
|----------|-----------------|
| Email    | `demo@tudu.ca`  |
| Password | `password123`   |

## Phone testing

Dev server (with `--host`) — Vite uses the next free port if 5173 is taken:

```
http://172.16.1.78:5175/
```

(Also check terminal output; default is port 5173 → `http://172.16.1.78:5173/`)

Start the server:

```bash
npm run dev -- --host
```

## All routes

| Route | Page |
|-------|------|
| `/` | Landing |
| `/signin` | Sign In |
| `/signup` | Sign Up |
| `/onboarding/interests` | Onboarding — Interests |
| `/onboarding/budget` | Onboarding — Budget |
| `/onboarding/distance` | Onboarding — Distance |
| `/onboarding/timeframe` | Onboarding — Timeframe |
| `/onboarding/friends` | Onboarding — Friends |
| `/discover` | Things Tudu (card deck) |
| `/bucket-lists/discover` | Bucket list discovery feed |
| `/host` | Host Events |
| `/road-trip` | Road Trip |
| `/bucket-list` | Bucket Lists |
| `/bucket-list/:id` | Bucket list detail |
| `/bucket-list/story/:id` | Completed story slideshow |
| `/bucket-list/completed` | Redirect → completed discover tab |
| `/my-tudu` | My Tudu profile |
| `/my-tudu/settings` | Settings |
| `/search` | Search & follow |
| `/following` | Following list |
| `/friends` | Find friends (standalone) |
| `/terms-of-service` | Terms of Service |
| `/cookie-policy` | Cookie Policy |

Unknown paths redirect to `/`.

## Step-by-step phone test path

1. **`/`** — Landing loads; logo links home; footer Terms & Cookie Policy work.
2. Tap **Find Something To Do** → **`/signin`** (when logged out).
3. Sign in with demo credentials → **`/onboarding/interests`** (first visit) or **`/discover`** (onboarding complete).
4. Walk onboarding or skip → **`/discover`** with bottom nav + locked header.
5. Bottom nav: **Host** → **`/host`**, **Road Trip** → **`/road-trip`**, **Bucket List** → **`/bucket-list`**, **My Tudu** → **`/my-tudu`**.
6. From Discover, open bucket list discovery → **`/bucket-lists/discover`**.
7. Open a list → **`/bucket-list/:id`** (header + bottom nav).
8. Settings gear → **`/my-tudu/settings`**.
9. Sign out from settings, return to landing; **Host Events** → **`/signin`** when logged out.

## Build

```bash
npm run build
```
