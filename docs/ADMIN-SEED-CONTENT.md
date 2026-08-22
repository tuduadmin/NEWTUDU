# Admin Seed Content

Platform-seeded discover deck content — events and attraction cards.

## Source spec ("color chat")

No file literally named "color chat" exists in the repo. The card-border color system comes from **Tudu-DIRECTION** / `_extracted_direction.txt` (ADMIN DASHBOARD section):

| Border | Meaning |
|--------|---------|
| *(none)* | Verified users |
| **Green** | Trusted Host (partner calendars) |
| **Orange** | Pioneer subscription |
| **Blue** | Trusted Host subscription |
| **Gold / white** | Hidden Gems (restaurants, entertainment businesses) |
| **Teal** | **Attractions** — admin-entered deck filler until traction |

Key direction quotes:

- *"Need the ability to create ATTRACTIONS CARD. Basic card that always stays on card deck. Only admin can create these cards for now. TEAL border."*
- *"TEAL will be attractions we enter into TUDU. These can be added and can fill the deck until traction."*
- *"Need the ability to add events to peoples cards or send for approval"*

This implementation covers admin seed events + teal attraction cards. Approval workflow is future work.

## Data model

### Seeded events (`tudu_host_events`)

Extended `HostEvent` fields:

```ts
seededByAdmin?: boolean
createdByAdminId?: string
```

Created via `createAdminSeededEvent()` in `src/lib/adminSeed.ts`. Tier checks skipped when `adminSeed` is passed to `saveHostEventFromWizard()`.

### Attractions (`tudu-attractions`)

```ts
interface Attraction {
  id: string
  title: string
  subtitle?: string
  description: string
  images: string[]       // up to 3
  location: { city, venue?, lat?, lng? }
  category: string
  tags: string[]
  cardType: 'attraction' | 'hidden-gem' | 'place'
  visibility: 'public' | 'private'
  featured: boolean
  seededByAdmin: true
  createdAt: string
  createdByAdminId?: string
}
```

CRUD: `src/lib/attractions.ts`

## Discover deck integration

`getDiscoverEventsPool()` in `src/data/discoverEvents.ts` returns:

1. **Public attractions** (featured first) — teal ring, ATTRACTION badge
2. **Live/upcoming public host events** — including admin-seeded (tier bypass at publish)
3. **Static seed cards** — original mock events

Discover page UI is unchanged except:

- Optional `ring-2 ring-cyan-400/55` for `borderColor: 'teal'`
- Cyan **ATTRACTION** badge variant

## Demo flow

1. Sign in at `/admin/signin` (`admin@tudu.ca` / `admin123`)
2. **Attractions** → Add a public attraction (e.g. "Wanuskewin Heritage Park", Saskatoon)
3. **Seed Events** → Create → target `demo@tudu.ca`, public, auto-publish live
4. Open `/discover` (refresh if already open) — swipe deck shows teal attraction cards and seeded events

## Future

- Filter attractions out when user filters mature
- Send-for-approval flow for seeded events on behalf of hosts
- Gift unlimited events per user (direction doc)
