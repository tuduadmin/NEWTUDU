# Savepoint — 2026-07-18

Tag: `savepoint-jul-18-2026`

## What is included

Snapshot of the TUDU Vite + React app as of 2026-07-18: discover flow, bucket list (including discovery/completed/story routes), host event tools, landing/marketing pages, onboarding, and shared app chrome.

### Routes (`src/App.tsx`)

| Path | Page |
|------|------|
| `/` | Landing |
| `/signup`, `/signin` | Auth |
| `/discover` | Discover |
| `/host`, `/host/scan`, `/host/profile`, `/host/hidden-gem` | Host events |
| `/road-trip` | Road trip |
| `/bucket-list`, `/bucket-list/:id`, `/bucket-list/story/:id`, `/bucket-lists/discover` | Bucket list |
| `/my-tudu`, `/my-tudu/settings`, `/settings` | Profile & settings |
| `/friends`, `/search`, `/following` | Social |
| `/terms-of-service`, `/cookie-policy` | Legal |
| `/onboarding/*` | Onboarding steps |

### Locked features (do not change without approval)

See `FEATURE-LOCKS.md`:

- **Header / footer / location:** `AppHeaderBar`, `Footer`, `src/lib/location.ts` (Icon | Location | Settings layout)
- **Host (locked pages):** `EventManagerPage`, `TicketScannerPage`, `EditPublicProfilePage`, `AddHiddenGemPage`

## Tier model plan (product direction)

| Tier | Capability (planned) |
|------|----------------------|
| **Free (unverified)** | Core consumer features; limited or no public event hosting |
| **Verified** | Identity verified; **up to 2 public events** |
| **Paid tiers** | Trusted Host / Pioneer (and future tiers per `docs/TUDU-MASTER-SPEC.md`): expanded hosting, Travel Pass, schedule tiers, card border tiers |

Exact perk matrix to be finalized against paid-tier checklist in master spec.

## How to restore this savepoint

```bash
cd path/to/tudu
git fetch --tags   # if using a remote later
git checkout savepoint-jul-18-2026
```

To return to latest work on your branch after inspecting the savepoint:

```bash
git checkout master   # or your working branch name
```

## Notes

- `node_modules/` and `dist/` are not tracked (see `.gitignore`).
- No `.env` or secret files were included in this snapshot.
