# Mode Landing Themes

Seasonal and time-of-day hero backgrounds for **Road Trip** and **Bucket List** mode landing pages.

## Overview

When users open `/road-trip` or `/bucket-list`, they see a full-bleed hero with themed photography/illustration, the TUDU pin, a mode title, and glass action cards. Background art rotates by **season** and **local time of day**, with a special **Foundation** (UFO night) theme for winter nights.

## Config file

**Path:** `public/config/mode-themes.json`

This JSON is loaded at runtime via `loadModeThemesConfig()` in `src/lib/modeThemes.ts`. Defaults are embedded in code if the fetch fails.

### Structure

| Key | Purpose |
|-----|---------|
| `images` | Maps image keys → public URL paths under `/themes/` |
| `modes.road-trip` / `modes.bucket-list` | Per-mode title, tagline, foundation slot, season×time matrix |
| `foundation` | UFO night art tied to TUDU Foundation characters; used for winter **night** |
| `seasons.{season}.{timeOfDay}` | Image key for each combination |

### Seasons (by local month)

| Season | Months |
|--------|--------|
| Winter | December – February |
| Spring | March – May |
| Summer | June – August |
| Fall | September – November |

### Time of day (by local hour)

| Slot | Hours |
|------|-------|
| Morning | 5:00 – 10:59 |
| Day | 11:00 – 16:59 |
| Dusk | 17:00 – 20:59 |
| Night | 21:00 – 4:59 |

## Theme assets

Images live in `public/themes/`:

| File | Description |
|------|-------------|
| `road-trip-night-ufo.png` | Foundation UFO night scene |
| `road-trip-fall-photo.png` | Autumn road photo |
| `road-trip-winter-dusk.png` | Winter dusk landscape |
| `road-trip-winter-illustrated.png` | Winter illustrated scene |
| `road-trip-fall-illustrated.png` | Fall cream-toned illustration |
| `road-trip-starry-night.png` | Milky Way / starry night |
| `bucket-list-*.png` | Bucket List variants (same art, separate keys) |

## API

```ts
import { getThemeForMode, getSeason, getTimeOfDay } from '../lib/modeThemes'

const theme = getThemeForMode('road-trip')
// → { backgroundImage, title, tagline?, season, timeOfDay, imageKey, usedFoundation }
```

- `getThemeForMode(mode, { date?, forceFoundation? })` — resolve theme for a mode
- `loadModeThemesConfig()` — fetch and cache JSON from `/config/mode-themes.json`
- `getSeason(date?)` / `getTimeOfDay(date?)` — helpers used by the resolver

## Current default (example)

On **July 18** (summer), local **day** hours show:

- **Road Trip:** `road-trip-starry-night` — milky way open-sky adventure
- **Bucket List:** `bucket-list-starry-night`

Winter **night** automatically selects the **Foundation UFO** image and tagline (*"The Foundation is out there"*).

## Routes

| Route | Page |
|-------|------|
| `/road-trip` | Road Trip hero landing |
| `/road-trip/plan` | Plan destination (stub + existing trip view) |
| `/road-trip/surprise` | Surprise Me stub |
| `/road-trip/from-bucket-list` | Bucket list picker → plan |
| `/bucket-list` | Bucket List hero landing |
| `/bucket-list/mine` | My Lists hub |
| `/bucket-lists/discover` | Swipe discovery feed (unchanged) |

## Admin Portal plan (future)

1. **Theme editor** in Admin Portal — upload/replace images, assign to season×time slots per mode
2. **Preview** — simulate date/time and mode before publish
3. **Foundation toggle** — schedule UFO theme for campaigns (e.g. character launches)
4. **Publish pipeline** — write updated JSON to CDN / `public/config/mode-themes.json`
5. **A/B slots** — optional override keys for experiments without changing season defaults

Until Admin Portal ships, edit `public/config/mode-themes.json` directly and redeploy.

## Related code

- `src/components/mode-landing/ModeLandingPage.tsx` — shared hero layout
- `src/pages/RoadTripLandingPage.tsx` — Road Trip cards
- `src/pages/BucketListLandingPage.tsx` — Bucket List cards
- `src/lib/modeThemes.ts` — resolver logic
