# TUDU Tiers & Host Accounts

Phase 1–2 foundation for account verification, public-event limits, Host Accounts (organizations), and private vs public event flows (localStorage demo).

## Tier Model

| Level | Verification | Tier key | Public events | Permissions |
|-------|-------------|----------|---------------|-------------|
| Free unverified | None | `free` + `unverified` | **0** | Search, buy tickets, **private events only** |
| Verified (phone) | SMS demo | `verified` + `phone_verified` | **2 max** | Above + limited public discover listing |
| Paid Tier 1 (stub) | Phone verified | `tier1` | **10 max** | More public events, analytics stub |
| Paid Tier 2 (stub) | Phone verified | `tier2` | **50 max** | Highest public cap, analytics stub |

### Types (`src/lib/account.ts`)

- `VerificationStatus`: `'unverified' | 'phone_verified'`
- `UserTier`: `'free' | 'verified' | 'tier1' | 'tier2'`
- `AccountType`: `'personal' | 'organization_member'`
- `PostingAs`: `'personal' | hostAccountId`

## User vs Host Account

| Entity | Purpose |
|--------|---------|
| **User** | Personal login (Jamie) — attend, save, post personal small events |
| **HostAccount** (`Organization` in code) | Business entity that **owns** events, profile, analytics |

- Users can be **members** of a Host Account without "being" the business
- Events belong to **HostAccount OR User (personal)**, never both:
  - `hostAccountId` set → posted as Host Account
  - `hostAccountId` null → personal event with `postedAsUserId` + `displayName`
- `postingAs` on account controls Event Manager "Post as" switcher

## Private vs Public Events

| Type | Example | Discover | Share |
|------|---------|----------|-------|
| **Private** | House party | **Never** in card deck | Web Share API, copy link, `/e/:shareToken` |
| **Public** | Garage sale | **Yes** when `live` or `upcoming` | Discover feed only |

Enforcement in `createHostEvent()`:

- Unverified → blocked with *"Verify phone to post public events"*
- At cap → blocked with *"Upgrade for more public events"*
- Private events → unlimited for all tiers; get `shareToken` on create

Public live/upcoming events are merged into the Discover card deck via `getDiscoverEventsPool()` in `src/data/discoverEvents.ts` (static seed cards + dynamic host events).

## Host Account Team

### Entity: `Organization` (alias `HostAccount`)

- `id`, `name`, `category`, `logoInitial`, `profile?`, `createdBy`, `createdAt`
- **`backupAdminEmail`** (required on create)

### Roles: `OrganizationMember`

| Role | Description |
|------|-------------|
| **Owner** | Primary owner; full control, can transfer ownership |
| **Admin** | Manage team & events; eligible for ownership transfer |
| **Staff** | Operate events (future) |
| **Viewer** | Read-only (future) |

Every Host Account **must** have:

1. **Primary Owner** (creator)
2. **Backup Admin** (required second email on create — auto-invited as Admin)

Team actions on `/host/team` (Owner only):

- **Transfer ownership** → target must be Admin; owner becomes Admin
- **Remove member** → cannot remove backup admin without replacement
- **Designate backup admin** → updates `backupAdminEmail`, sends invite if needed

## Routes

| Route | Purpose |
|-------|---------|
| `/host/create-org` | Create Host Account (name, category, backup admin email) |
| `/host/team` | Members, invites, transfer ownership, backup admin |
| `/event/private/:id` | Private event invite page (by id) |
| `/e/:shareToken` | Private event invite page (share link) |
| `/verify-phone` | SMS demo verification |

## localStorage Keys

| Key | Contents |
|-----|----------|
| `tudu_accounts` | User account records (+ `postingAs`) |
| `tudu_organizations` | Host Account entities (+ `backupAdminEmail`) |
| `tudu_org_members` | User ↔ org ↔ role (+ `isBackupAdmin`) |
| `tudu_org_invites` | Pending/accepted invites |
| `tudu_host_events` | Events (+ `hostAccountId`, `shareToken`, `displayName`) |

## Demo User

- `demo@tudu.ca` / `password123`
- Starts **unverified** (`seedDemoAccount()` on app load)
- Clear `tudu_accounts` in devtools to reset verification state

## UI Surfaces

- **Verification badge**: My Tudu profile, Event Manager org card
- **Post as switcher**: Event Manager — Me (personal) | Host Account name(s)
- **Create Event modal**: Private vs public explanations; private → ShareEventModal
- **ShareEventModal**: Web Share, Copy Link, message/Instagram via share sheet
- **Public slots**: Event Manager org card + Create Event modal

## Test Flows

### House party (private)

1. Sign in → `/host` → Post as **Me**
2. Create Event → **Private** → "Jamie's House Party"
3. Share modal opens → Copy Link or Share
4. Open `/e/:token` → invite-only page, **not** in Discover

### Garage sale (public)

1. Verify phone at `/verify-phone` (code `123456`)
2. `/host` → Create Event → **Public** → "Community Garage Sale"
3. Event published as `live` → appears in Discover card deck via `getDiscoverEventsPool()`

## Future Phases

- Real SMS provider (Twilio/etc.)
- Stripe billing for `tier1` / `tier2`
- Role-based permissions on host actions
- Discover feed from API
- Host Account logo upload & public profile sync
- RSVP on private event page
