# Savepoint - 2026-07-18 (Phase 2)

Tag: `savepoint-jul-18-2026-phase2`

Branch: `feature/orgs-and-tiers`

Previous savepoint: `savepoint-jul-18-2026` (discover, bucket list, host events baseline)

## What is included since the first savepoint

Phase 1 + Phase 2 org/tier and private/public event work (localStorage demo):

- **Account model** (`src/lib/account.ts`): verification status, user tiers, posting-as personal vs Host Account, public-event caps, org membership helpers
- **Auth seeding** (`src/lib/auth.ts`, `src/main.tsx`): demo account starts unverified; account bootstrap on load
- **Private vs public events**: create flow, share tokens, Discover pool merges live/upcoming public host events (`src/data/discoverEvents.ts`)
- **Host Account (organization)**: create org with required backup admin, team page (transfer ownership, invites, backup admin)
- **UI**: `CreateEventModal`, `ShareEventModal`, `VerificationBadge`; Event Manager post-as switcher and org card updates
- **Docs**: `docs/TIERS-AND-ORGS.md` (tier matrix, flows, localStorage keys)

### New or updated routes (`src/App.tsx`)

| Path | Page |
|------|------|
| `/verify-phone` | Phone verification (SMS demo) |
| `/host/create-org` | Create Host Account |
| `/host/team` | Team, invites, ownership transfer, backup admin |
| `/event/private/:id` | Private event invite (by id) |
| `/e/:shareToken` | Private event invite (share link) |

Existing routes from the first savepoint (discover, bucket list, host scan/profile/hidden-gem, onboarding, etc.) are unchanged unless noted in git history for this commit.

### Locked features

Still governed by `FEATURE-LOCKS.md` (header/footer/location and locked host pages). Phase 2 extends Event Manager and adds new host/account routes above.

## How to restore this savepoint

```bash
cd path/to/tudu
git fetch --tags   # if using a remote later
git checkout savepoint-jul-18-2026-phase2
```

To continue development on the feature branch after inspecting the tag:

```bash
git checkout feature/orgs-and-tiers
```

To return to the earlier baseline only:

```bash
git checkout savepoint-jul-18-2026
```

## Notes

- `node_modules/` and `dist/` are not tracked (see `.gitignore`).
- No `.env` or secret files were included in this snapshot.
- Next planned work after this savepoint: create event screenshots.
