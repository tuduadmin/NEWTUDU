# Event Card Border Colors

Thin **1px solid** borders on Discover deck cards. Layout, typography, and gold-standard card styling are unchanged — only the border line indicates tier/type.

Source: Tudu-DIRECTION / `_extracted_direction.txt` (ADMIN DASHBOARD section). The color-scheme PDF was not machine-readable; values below match direction docs and `src/lib/eventCardColors.ts`.

## Border types

| Border | CSS color | Meaning |
|--------|-----------|---------|
| **Grey** | `#9ca3af` | Unverified personal hosts |
| **Teal** | `#14b8a6` | Verified hosts — phone verified |
| **Partner pink** | `#c02e8d` | Admin attractions — deck filler (Partner tier accent) |
| **Green** | `#22c55e` | Trusted Host (partner calendars) |
| **Orange** | `#f97316` | Pioneer subscription |
| **Blue** | `#3b82f6` | Trusted Host subscription |
| **Gold** | `#eab308` | Hidden Gems — restaurants & entertainment |

Legacy `none` borders normalize to **teal** on read.

## Implementation

- **Discover page** — `DiscoverPage.tsx` applies `border: 1px solid` via `getDiscoverCardBorderStyle()`. Thick `ring-*` classes removed.
- **Pool mapping** — `getDiscoverEventsPool()` in `discoverEvents.ts` sets `borderColor` per card; host events can override with `discoverBorderType` on `HostEvent`.
- **Admin seed form** — `/admin/seed-events/create` shows legend + border type picker.
- **Admin attractions** — partner-pink indicator on list + legend panel; hidden-gem card type maps to gold on deck.

## PDF / direction summary

From `_extracted_direction.txt` (ADMIN DASHBOARD):

- Grey = unverified personal hosts
- Teal = verified hosts (phone verified)
- Partner pink = admin-entered attractions to fill deck until traction
- Green = Trusted Host partner (calendar pull)
- Orange = Pioneer subscription
- Blue = Trusted Host subscription
- Gold (white) = Hidden Gems (full-time restaurants/entertainment)

Trusted Host / Hidden Gem perk: see distant bucket-list saves for promo outreach (`src/lib/distantSaves.ts`).

## Do not change

Per `FEATURE-LOCKS.md`: do not restyle the discover deck beyond these thin borders — no thick rings, no layout changes.
