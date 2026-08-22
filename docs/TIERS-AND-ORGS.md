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

## Organization Departments

One org profile, multiple departments — each hosts its own events.

**Example:** Kindersley Fire Department
- Departments: Social Club, Public Education, Safety Committee, Kindersley Fire
- Social Club hosts private events for firefighters + some public events
- Instead of 4 separate org profiles → one org, switch department when creating events

### Types (`src/lib/account.ts`)

```ts
interface OrgDepartment {
  id: string
  name: string
  description?: string
  createdAt: string
}

interface Organization {
  // existing fields...
  departments: OrgDepartment[]
}
```

Events posted under a department store `departmentId` + `departmentName`. Events without a department are **org-wide (General)**.

### Manage departments

| Surface | Route |
|---------|-------|
| Host portal | `/host/departments` — add/edit/remove (Owner & Admin) |
| Control Room | `/admin/organizations/:orgId` — Departments section on Overview |
| Team page | Link to departments from `/host/team` |

### Create Event — Post as department

When **Organization** mode + create event:
1. Select org via **Post as** selector
2. **Department (optional)** dropdown — "General (org-wide)" or a specific department
3. Event stores `departmentId` + `departmentName` on save

Helper copy: *e.g. Social Club, Public Education — leave as General for org-wide events.*

### Event Manager

- Filter events by department (dropdown) when in org mode
- Department badge on event cards
- Link to `/host/departments` from org profile card

### Team & access (stub)

All org members see all departments initially. Future: assign team members to departments with department-scoped roles.

### Public profile

- Org name shown prominently on profile header
- Department pills listed when org has departments
- Upcoming events grouped by department (or "Department: Social Club" on individual cards)
- Discover cards show `Org Name · Department` in host label when set

## Routes

| Route | Purpose |
|-------|---------|
| `/host/create-org` | Create Host Account (name, category, backup admin email) |
| `/host/profile` | Edit personal or org public profile |
| `/host/view/personal/:userId` | Public personal host profile (visitor view) |
| `/host/view/:orgId` | Public organization host profile (visitor view) |
| `/host/team` | Members, invites, transfer ownership, backup admin |
| `/host/departments` | Add/edit/remove org departments (Social Club, Public Education, etc.) |
| `/event/private/:id` | Private event invite page (by id) |
| `/e/:shareToken` | Private event invite page (share link) |
| `/verify-phone` | SMS demo verification |

## localStorage Keys

| Key | Contents |
|-----|----------|
| `tudu_accounts` | User account records (+ `postingAs`) |
| `tudu_organizations` | Host Account entities (+ `backupAdminEmail`, `departments[]`) |
| `tudu_org_members` | User ↔ org ↔ role (+ `isBackupAdmin`) |
| `tudu_org_invites` | Pending/accepted invites |
| `tudu_host_events` | Events (+ `hostAccountId`, `departmentId`, `departmentName`, `shareToken`, `displayName`) |
| `tudu_host_slideshows` | Org profile carousel slides (+ optional `personal:{email}` key) |
| `tudu_personal_host_profiles` | Personal host avatar, bio, social links |
| `tudu_org_host_profiles` | Org logo, bio, social links |
| `tudu-host-context` | Event Manager context: `personal` or org id |

## Demo User

- `demo@tudu.ca` / `password123`
- Starts **unverified** (`seedDemoAccount()` on app load)
- Clear `tudu_accounts` in devtools to reset verification state

## UI Surfaces

- **Verification badge**: My Tudu profile, Event Manager org card
- **Personal ↔ Organization toggle**: Event Manager header — segmented control persists in `tudu-host-context` (`personal` | org id). Personal mode shows personal events and profile; Organization mode shows org events, team, hidden gems, slideshow.
- **Post as selector**: Create Event wizard — **Personal (Your Name)** first, then orgs; defaults to Personal; copy: *Posting as you — no business account needed*
- **Team & Admins** (`/host/team`): Simple add-member form, member table (name, email, role, actions), backup admin callout, transfer ownership stub. Platform admin team remains at `/admin/organizations/:orgId/team`.
- **Departments** (`/host/departments`): Add/edit/remove departments for the active org. Linked from Event Manager and Team page.
- **Create Event modal**: Private vs public explanations; private → ShareEventModal
- **ShareEventModal**: Web Share, Copy Link, message/Instagram via share sheet
- **Public slots**: Event Manager org card + Create Event modal
- **Public host profile** (`/host/view/personal/:userId`, `/host/view/:orgId`): Visitor-facing cream/orange card — avatar, name, tier badge, bio, social icons, media carousel, upcoming public events. Preview from Edit Profile or Event Manager.

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
- Stripe billing for Pioneer / Trusted Host — see [TIER-PRICING-STRATEGY.md](./TIER-PRICING-STRATEGY.md)
- Role-based permissions on host actions
- Department-scoped team roles (assign members to departments)
- Discover feed from API
- Host Account logo upload & public profile sync
- RSVP on private event page
