# Savepoint - 2026-07-18 (Create Event Wizard)

Tag: `savepoint-jul-18-2026-create-event-wizard`

Branch: `feature/orgs-and-tiers`

Previous savepoint: `savepoint-jul-18-2026-phase2` (orgs, tiers, private/public events)

## What is included

Five-step create event wizard (localStorage draft) **before** ticketing mode picker and attendee checklists:

| Step | Component | Content |
|------|-----------|---------|
| 1 | `BasicsStep` | Title, venue, address, about, photos |
| 2 | `ScheduleStep` | Date, time, recurrence, visit duration |
| 3 | `CategoryStep` | Primary/secondary categories, tags |
| 4 | `FinalStep` | Tier-based ticketing only, age, amenities |
| 5 | `ReviewStep` | Card preview, review checklist, visibility, publish |

### Key files in this snapshot

- `src/pages/host/CreateEventPage.tsx` — wizard shell
- `src/components/create-event/*` — step components + layout/stepper
- `src/hooks/useCreateEventForm.ts` — draft persistence (`tudu_create_event_draft`)
- `src/data/eventCategories.ts` — category/amenity data
- `src/lib/account.ts` — `HostEventFormData`, `saveHostEventFromWizard`
- `FEATURE-LOCKS.md` — wizard files locked; Event Manager wired to `/host/create-event`

### Routes

| Path | Page |
|------|------|
| `/host/create-event` | 5-step create event wizard |

## How to restore this savepoint

```bash
cd path/to/tudu
git checkout savepoint-jul-18-2026-create-event-wizard
```

To continue on the feature branch after inspecting:

```bash
git checkout feature/orgs-and-tiers
```

## Notes

- Step 4 at this savepoint uses a single multi-tier price editor (free = $0 tiers).
- Ticketing mode picker (`free_rsvp`, `free_donation`, `sell`, `external`) and attendee checklists are **post-savepoint** work.
- Not pushed to remote per project convention.
