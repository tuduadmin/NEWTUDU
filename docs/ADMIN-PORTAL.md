# TUDU Admin Portal — Control Room

Professional platform admin ("TUDU Control") separate from the consumer brand. Slate/charcoal UI with cyan/teal accents, data-dense tables, and operational tooling.

## Access

| Field | Value |
|-------|-------|
| URL | `/admin/signin` |
| Email | `admin@tudu.ca` |
| Password | `admin123` |

Gate: `isPlatformAdmin()` in `src/lib/auth.ts`.

## Design system

Tokens live in `src/styles/admin.css` (imported via `index.css`):

| Token | Value | Use |
|-------|-------|-----|
| `--admin-bg` | `#0f1419` | Shell background |
| `--admin-surface` | `#1a2332` | Panels, sidebar |
| `--admin-border` | `#2d3748` | Borders |
| `--admin-accent` | `#06b6d4` | Primary actions (not consumer orange) |
| `--admin-success` | `#10b981` | Status OK |
| `--admin-warning` | `#f59e0b` | Inactive / pending |
| `--admin-danger` | `#f43f5e` | Reports / delete |
| `--admin-radius` | `4px` | Max corner radius — no pills |

Shared UI: `src/components/admin/AdminUI.tsx`

## Routes

| Route | Section |
|-------|---------|
| `/admin/signin` | Admin login |
| `/admin` | **Analytics** — KPI grid, growth chart, activity feed, geographic filters (country / province / city) |
| `/admin/people` | **Users & Organizations** — Users or Organizers tabs (defaults to Users) |
| `/admin/people?view=users` | Users list (same as legacy `/admin/users`) |
| `/admin/people?view=orgs` | Organizers / host organizations (same as legacy `/admin/organizations`) |
| `/admin/people?view=orgs&tab=pending` | Pending org verification queue |
| `/admin/users` | Redirects to `/admin/people?view=users` (bookmarks preserved) |
| `/admin/users/:userId` | Full user activity — profile, events, saves, RSVPs, bucket lists, road trips |
| `/admin/messages` | Inbox, compose (single + batch/broadcast), threads, quick poke templates |
| `/admin/events` | Events registry, metrics, detail drawer |
| `/admin/feedback` | Reports & feedback queue |
| `/admin/organizations` | Redirects to `/admin/people?view=orgs` (bookmarks preserved) |
| `/admin/organizations/:orgId` | Organization overview (approval, KPIs, event posts by tab) |
| `/admin/organizations/:orgId/team` | Org-scoped team & access |
| `/admin/organizations/:orgId/hidden-gems` | Org hidden gems CRUD (gold deck border) |
| `/admin/organizations/:orgId/slideshow` | Org profile slideshow — image/video slides with captions (localStorage) |
| `/admin/team-access` | Global org memberships, remove user from org, ownership transfer stub |
| `/admin/employees` | Internal TUDU team roster — roles, departments, status |
| `/admin/security` | Auth logs, suspicious activity, bans, API key stubs |
| `/admin/safety` | Community safety incidents, moderation log, feedback cross-links |
| `/admin/seed-events` | Seeded events list |
| `/admin/seed-events/create` | Create seed event |
| `/admin/hidden-gems` | Hidden gems registry — all org gems with links to per-org CRUD |
| `/admin/attractions` | Attraction CRUD (teal deck cards) |
| `/admin/bucket-lists` | Bucket list monitor — visual preview, edit, delete |
| `/admin/bucket-lists/create` | Create or edit platform bucket lists (cover, owner avatars, items with image/video, playlists, reels preview) |
| `/admin/road-trip` | Road trip plans — view/edit/delete saved itineraries |
| `/admin/host-events` | Host-created events KPI dashboard + link to events registry |
| `/admin/miles` | TUDU Miles economy — earn rates, wallet balances, redemption stub |
| `/admin/rewards` | TUDU Rewards tracker — kudos ledger, boost/merch redemptions (500 kudos = 1 boost) |
| `/admin/tudu-black` | TUDU BLACK luxury tier — waitlist, tier benefits, program config (demo stub) |
| `/admin/themes` | Mode theme toggles |
| `/admin/tiers` | Tier & pricing config — subscriptions, micro-transactions, badges, live preview |
| `/admin/settings` | Feature flags + sidebar layout (incl. Boosts, Travel Pass, extra events shop) |

## Sidebar navigation

Default order grouped by section (headers render in the Control Room sidebar):

1. **Analytics** — Analytics dashboard
2. **People** — Users & Orgs, Messages, Feedback
3. **Card Deck** — Events, Seed Events, Hidden Gems, Attractions
4. **TUDU Features** — Bucket List, Road Trip, Host Events, TUDU Miles, TUDU Rewards, TUDU BLACK
5. **Operations** — Employees, Security, Safety
6. **Platform** — Themes, Tiers, Legal, Team & Access, Settings

Source of truth: `src/lib/adminSidebarNav.ts` (`DEFAULT_ADMIN_NAV_ITEMS`, `section` field on each item).

The sidebar renders **uppercase section headers** (`admin-label`, muted slate/cyan) above each group. Headers are not individually draggable — only nav links reorder. When custom order splits a section, a new header appears at each section boundary so labels follow their items.

### Custom order (`/admin/settings` → Sidebar layout)

Admins can reorder sidebar links with **Move up** / **Move down** controls. Changes apply immediately to the Control Room sidebar (no save button). The Settings panel shows the same section headers (non-draggable) above each contiguous group.

| Detail | Value |
|--------|-------|
| Storage key | `tudu-admin-sidebar-order` (array of route paths) |
| Reset | **Reset to default** restores built-in order |
| New routes | Inserted at their default index when missing from saved order |
| Legacy paths | `/admin/users` and `/admin/organizations` in saved order migrate to `/admin/people` |

## Users & Organizations (`/admin/people`)

Single Control Room section combining the former **Users** and **Organizations** sidebar items.

| View tab | Query | Content |
|----------|-------|---------|
| **Users** | `?view=users` (default) | User base table with search, tier, verification, country, status filters, manage drawer |
| **Organizers** | `?view=orgs` | Host organizations — search, status, country filters; sub-tabs for all orgs and pending verification |

Legacy list routes redirect with the matching filter: `/admin/users` → `?view=users`, `/admin/organizations` → `?view=orgs`. Visiting `/admin/people` or `?view=all` normalizes to `?view=users`. Detail routes unchanged: `/admin/users/:userId`, `/admin/organizations/:orgId/*`.

Implementation: `AdminPeoplePage.tsx` + `AdminUsersPanel.tsx` + `AdminOrganizationsPanel.tsx`.

## Demo category events

Load **20 demo events** (18 wizard categories + 2 bonus) from the Analytics dashboard:

1. Sign in at `/admin/signin`
2. Open `/admin` (Analytics)
3. Click **Load demo events** (once per browser — flag `tudu_demo_events_v1`)

Also seeds demo bucket lists and road trips for `demo@tudu.ca`. Events use `seededByAdmin: true`, picsum stock photos (3 per event), mixed public/private, free/paid ticketing, keywords, and border tiers (green/orange/blue/gold/teal/none).

Implementation: `src/lib/demoEventsSeed.ts`

Top bar: **TUDU Control** + LOCAL badge + admin email + subtle **Sync data** (not a primary CTA).

## Tier & pricing (`/admin/tiers`)

Single source of truth: `src/lib/tierConfig.ts` (persisted to localStorage key `tudu-admin-tier-config`). Consumer page `/host/subscription` reads the same config via `getTierConfig()`.

| Section | Editable fields |
|---------|-----------------|
| **Verified Host** | Unverified limit, verified public cap, platform %, flat fee |
| **Pioneer** | Monthly/annual/was price, public cap, boosts/mo, fees, launch discount toggle |
| **Trusted Host** | Monthly/annual/was price, public cap, boosts, business listing, fees |
| **Micro-transactions** | Boost single/3-pack, extra event single/5-pack, Travel Pass weekly/monthly |
| **Display** | Badge label, pill Tailwind classes, border color, summary; Partner invite-only flag |
| **Live preview** | Renders `SubscriptionPlansPanel` with unsaved draft config |
| **Analytics (stub)** | Users per tier + estimated MRR |

Related feature flags on `/admin/settings`: Event Boosts shop, Extra events shop, Travel Pass.

See [TIER-PRICING-STRATEGY.md](./TIER-PRICING-STRATEGY.md) for pricing rationale.

## Activity & MAU / DAU

### User model

`UserAccount` in `src/lib/account.ts` includes:

- `lastActiveAt` — ISO timestamp, updated on sign-in and route changes
- `joinedAt` — set when account is created
- `homeCity` / `homeRegion` — location for recommendations and distant-save tracking
- `country` / `province` — geographic fields for analytics filters (synced from home city when unset)
- `gender` — optional user-provided (settings or admin)
- `birthYear` — derived from DOB for age bracket analytics
- `suspended` — cannot post/create events; can still browse
- `banned` — sign-in rejected; platform-wide disable

### Analytics dashboard

Platform Analytics at `/admin` uses sub-tabs with SVG pie charts (`AdminPieChart.tsx`) and drill-down tables. All tabs respect the **Country / Province / City** filter bar at the top.

| Tab | Content |
|-----|---------|
| **Overview** | KPI grid, growth line chart, activity feed, top cities/keywords |
| **Users** | Pie: by country, tier, verification; user drill-down table |
| **Events** | Pie: category, status, visibility, seeded vs host; event drill-down |
| **Geography** | Pie: users by country, province/state; top cities list |
| **Engagement** | Pie: card opens vs saves vs passes, RSVP conversion, MAU vs inactive; card opens KPIs (Trusted Host signal); keywords + activity types |
| **Tickets** | KPI: sold, revenue, cancelled, avg price; pie: tickets by category; top events table |

**Geographic filters** — filter bar applies across all Analytics sub-tabs:

| Filter | Options |
|--------|---------|
| Country | All Countries, Canada, United States, United Kingdom, + values from user/event data |
| Province / State | Depends on country (SK, AB, BC, ON for Canada; US states when US selected) |
| City | All cities from accounts and events (optional third filter) |

Filters auto-apply on change. KPI cards, growth chart, activity feed, pie charts, drill-down tables, and top-city lists all respect the selection.

**Data linking (Phase 1 — localStorage):**

| Domain | Fields / sources |
|--------|------------------|
| Users | `UserAccount.country`, `province`, `homeCity`, `tier`, `verificationStatus`, `lastActiveAt` |
| Events | `HostEvent` city/province/country, `primaryCategory`, `status`, `visibility`, `seededByAdmin`, `seedApprovalStatus` |
| Engagement | `savedEvents`, `distantSaves`, event metrics (views/saves/opens), activity log, keyword stats, ticket transactions |
| Ticket sales | `tudu-ticket-transactions` (paid/cancelled), `HostEvent.ticketTiers[].sold` + `priceCents` |

Helpers: `src/lib/analyticsGeo.ts` (filters), `getAnalytics(filters)` + `get*PieAnalytics()` in `src/lib/adminAnalytics.ts`.

**How to test:** see [ANALYTICS-TESTING.md](./ANALYTICS-TESTING.md).

**Phase 2:** Supabase will replace localStorage reads; filter helpers and pie UI unchanged.

Users table (`/admin/people`, Users filter) columns: City, Age, Gender, Status.

Settings page (`/my-tudu/settings`) lets users set optional gender; DOB from signup feeds age brackets.

Storage: `tudu_accounts` in localStorage.

### User moderation

| Action | Effect | Where |
|--------|--------|-------|
| **Suspend** | Blocks creating/posting events; browse OK | Users & Orgs → Users → Suspend (confirmation) |
| **Ban** | Blocks sign-in entirely | Users & Orgs → Users → Ban account (confirmation) |
| **Org removal** | Removes org team membership only; personal account kept | Team & Access → Remove from org |

Activity log types: `user_suspend`, `user_ban`, `access_change`.

### Distant saves (Trusted Host insight)

When a user saves an event to bucket list, `recordEventSave()` stores saver home city vs event city (`tudu_event_saves`).

- Host Event Manager — “Saves from outside your area”
- Admin Events detail drawer — same list + promo code field on events/attractions

### Team & Access

`/admin/team-access` — view all org memberships (Owner, Admin, Staff, Viewer). Remove user from org without deleting account. Transfer ownership demo stub (first Admin on team).

Per-organization team management: `/admin/organizations/:orgId/team` (same actions, scoped to one org).

Example: user fired from Kindersley Museum → removed from org team, loses host access to that org, keeps personal TUDU account.

### Organization approval

`/admin/people?view=orgs` — list host accounts with row actions **Approve** / **Reject**. Legacy `/admin/organizations` redirects here.

Rejecting an organization opens a dialog (same pattern as Feedback resolve):

- **Reason for rejection** (required) — short admin note; fills the `{reason}` placeholder in the message template.
- **Message to organization owner** — editable default template (`tudu-org-reject-template` in localStorage):
  `Hi {orgName}, thank you for applying to TUDU. Unfortunately we cannot approve your organization at this time because: {reason}. You may reapply after addressing these items.`
- **Reject & notify** is disabled until a reason is entered.
- Delivery: in-app notification (default on) → org owner’s My Tudu → Notifications (`type: org_rejected`); optional email stub.

Stored on the organization record: `approvalStatus: 'rejected'`, `rejectedAt`, `rejectedBy`, `rejectionReason`, `rejectionMessage`.

Org overview (`/admin/organizations/:orgId`) shows rejection details when status is rejected. Approve clears rejection metadata.

### Organization hidden gems

`/admin/organizations/:orgId/hidden-gems` — manage ongoing places and businesses owned by a host organization.

- Storage: `tudu-hidden-gems` in localStorage (`src/lib/hiddenGems.ts`)
- Also lists legacy host events / attractions flagged as hidden gems for that org
- Fields: title, description, photo URLs, city/venue, category, tags, promo code, public/private visibility
- Actions: create (admin on behalf of org), edit, publish/unpublish, feature on deck, delete
- Metrics: views, saves, distant saves (same keys as events via `getEventMetrics()`)
- Discover: public + published gems merge into `getDiscoverEventsPool()` with thin **gold** border (1px)

Org list (`/admin/people?view=orgs`) shows hidden gem count badge and links to Team & Access and Hidden Gems.

### Organization event posts

`/admin/organizations/:orgId` (Overview tab) lists all host events for that organization from `tudu_host_events`, grouped by tab:

| Tab | Logic |
|-----|-------|
| **Drafts** | `status === 'draft'` (unpublished) |
| **Upcoming** | Published, start date in the future |
| **Live** | Published, currently between start and end (or start passed, end not passed) |
| **Past** | End date passed, or `status === 'past'` |

Table columns: title, status, visibility, date/time, views, saves, RSVPs. Row actions: View (drawer), Edit in registry (`/admin/events?eventId=…`), Publish / Unpublish.

Schedule helpers: `src/lib/hostEventSchedule.ts`. Org filter on Events Registry: `/admin/events?org={orgId}`.

### Event card borders

See [EVENT-CARD-COLORS.md](./EVENT-CARD-COLORS.md). Discover deck uses thin 1px borders only.

### Tracking

- `touchLastActive()` in `account.ts` — called from `signIn()` and `ActivityTracker` on pathname change
- `getMAU()` / `getDAU()` in `src/lib/adminAnalytics.ts` — users active within 30d / 24h (excludes admin account)
- Users inactive **>14 days** highlighted amber on `/admin/people` (Users filter) for poke targeting

### How to test

1. Sign in as `demo@tudu.ca` and browse `/discover` — `lastActiveAt` updates.
2. Open `/admin/people?view=users` — demo user shows recent last active.
3. Clear `lastActiveAt` in DevTools → Application → `tudu_accounts` to simulate inactive user (amber row).
4. Analytics dashboard shows MAU/DAU counts from account timestamps.

Activity log key: `tudu-admin-activity-log` (30-day chart: signups + events published).

## Messaging (`/admin/messages`)

Platform admin messaging for poking inactive users, replying to feedback, and one-off outreach. Implemented in `AdminMessagesPage.tsx` + `src/lib/adminMessages.ts`.

### What the tab shows today

| Area | Behavior |
|------|----------|
| **Layout** | Full-width **inbox list** (left) + **thread view** (right). Compose opens in a **right drawer** so the inbox is not squeezed. |
| **Inbox** | Thread list grouped by participant email; unread badge; fills available vertical space |
| **Thread view** | Outbound (admin) vs inbound bubbles; reply form; quick template buttons when no thread selected |
| **Compose drawer** | **Single user** / **Batch / Broadcast** sub-tabs (same pill style as Analytics). Single: searchable user picker. Batch: shared `AdminGeoFilterBar` + Users-style recipient table |
| **Delivery badges** | Outbound bubbles show per-channel status (✓ sent, ✗ failed, — skipped) with tooltip |
| **Deep links** | `/admin/messages?to={email}` opens compose drawer with recipient pre-filled; `?thread={id}` selects thread |

On first Analytics load, `seedDemoMessages()` adds two **inbound demo threads** (from `demo@tudu.ca`, `jamie@example.com`) so the inbox is not empty.

### Storage (Phase 1)

| Key | Contents |
|-----|----------|
| `tudu-admin-messages` | Array of `AdminMessage` — id, threadId, from/to email, subject, body, timestamp, read, direction (`inbound` \| `outbound`), `deliveryChannels`, `deliveryStatus`, optional `deliveryErrors`, optional `batchId` / `batchLabel` for batch sends |
| `tudu-user-notifications` | Per-user in-app notifications keyed by lowercase email — written when admin sends with **In-app** channel |

Threads are keyed by sorted admin↔user email pair. All data is **browser-local** (same pattern as other Control Room tools).

### Who sends / receives

| Actor | Can send? | Can receive? |
|-------|-----------|--------------|
| **Platform admin** | Yes — compose, reply, templates; pick delivery channels | Yes — inbox (inbound demo + future user replies) |
| **End users** | No UI yet | **In-app only** — `/my-tudu/notifications` when admin selects In-app channel |
| **Hosts** | No admin-style messaging | Public profile shows static **contact email/phone** (`mailto:` / `tel:` links only — not TUDU inbox) |

`sendPokeTemplate()` exists in the lib but is **not wired** from Users manage drawer; pokes are done via Messages compose + template buttons.

### Where messages go (delivery channels)

Admin compose and reply forms include **Send via** multi-select: **Email**, **SMS**, **In-app notification**. Each outbound message stores `deliveryChannels` and per-channel `deliveryStatus`.

| Channel | Phase 1 (today) | Phase 2 (planned) |
|---------|-----------------|-------------------|
| **Email** | Stub — console log + `message_delivery` activity log entry; status `sent` | [Resend](https://resend.com) — transactional from `noreply@tudu.ca`, replies via `support@tudu.ca` |
| **SMS** | Stub if phone verified; `failed` with reason if no phone / unverified | Twilio for opted-in users with verified phone |
| **In-app** | Writes to `tudu-user-notifications`; user sees `/my-tudu/notifications`; bell badge = unread count | Same store, synced via Supabase in Phase 2 |
| **Push notifications** | Not built | RSVP, scan mode, partner promos (see master spec) |

Sign-up stores `notify: boolean` on `StoredUser` (`tudu_users`) for “email notifications for RSVPs and local recommendations” but **nothing reads it** for delivery yet. My Tudu Settings has no notification preferences panel.

### Related entry points

- **Users & Orgs** (`/admin/people?view=users`) — row menu → **Message** → compose with `?to=` pre-filled
- **Feedback** (`/admin/feedback`) — detail drawer with linked event/host previews; **Reply** → same compose deep link
- **Analytics** — dashboard link to message inbox; seeds demo messages on load
- **Settings** — feature flag `messagingEnabled` in `tudu-admin-feature-flags` (stored only; does not gate the Messages route)

### Gaps (product owner summary)

1. Email/SMS are **stubbed** — real delivery requires Phase 2 (Resend, Twilio).
2. Users **cannot reply** to admin messages in the consumer app.
3. Inbound messages are **demo seed data** unless manually injected in DevTools.
4. Quick templates do not one-click send; admin must pick recipient and click Send.
5. No Supabase sync — threads and notifications do not follow admin/users across devices.

### Batch / broadcast messaging

Use **Batch / Broadcast** in the compose drawer on `/admin/messages` to send the same update to many users filtered by region.

| Step | Action |
|------|--------|
| 1 | Choose **Country**, **Province/State**, and optionally **City** (same filter pattern as Analytics) |
| 2 | Review the recipient preview table — badge shows count (e.g. **47 recipients**) |
| 3 | **Select all in region** or uncheck individuals; optionally **Add user manually** |
| 4 | Enter subject + body; pick **Send via** channels (applied to all selected) |
| 5 | Click **Send to batch** — confirm dialog: *Send to N users in [region]?* |

**Backend helpers** (`src/lib/adminMessages.ts`):

- `getUsersMatchingGeoFilters(filters)` — matches `getAllAccounts()` via `analyticsGeo.ts`; excludes platform admin and **banned** users
- `sendBatchMessage({ userEmails, subject, body, deliveryChannels, batchLabel })` — loops `sendAdminMessage()` per recipient; returns `{ sent, emailOk, smsOk, smsFailed, inAppOk, batchId, batchLabel, suspendedIncluded }`
- `buildBatchLabel(filters)` — e.g. `Canada · Saskatchewan · Regina`

**Behavior:**

- Each recipient gets their **own thread** (same as single compose) — users see only their copy in Notifications
- Outbound bubbles show optional **Batch:** label when `batchLabel` is set
- Activity log entry: `Batch sent to N users (region label)`
- **Suspended** users are included with a warning in the UI; **banned** users are excluded from the preview
- Empty region (filters active, zero matches): preview shows *No users match filters*; send stays disabled until recipients are selected manually
- SMS to unverified phones: per-user failed status (unchanged from single compose)

### How to test

1. Sign in at `/admin/signin`, open `/admin` once (seeds demo inbox threads).
2. Go to `/admin/messages` — see demo inbound threads; sidebar badge if unread inbound exists.
3. Compose to `demo@tudu.ca` with all **Send via** channels checked — outbound bubble shows delivery badges (Email ✓, SMS ✗ or ✓ depending on phone verify, In-app ✓).
4. Sign in as `demo@tudu.ca` → `/my-tudu` — bell badge shows unread; open **Notifications** or **Messages from TUDU** section.
5. From `/admin/people?view=users`, row menu → Message — compose opens with recipient pre-filled.
6. DevTools → Application → `tudu-admin-messages`, `tudu-user-notifications`, activity log for stub entries.
7. **Batch:** Click **Compose** → **Batch / Broadcast** → filter **Canada → SK** → recipient table shows SK users → send with **In-app** → each user gets a notification; admin inbox shows individual threads updated.

Shared geo filter UI: `src/components/admin/AdminGeoFilterBar.tsx` (used by Analytics and Messages batch compose).

## Feedback & reports

Storage key: `tudu-admin-feedback`

Demo seed on first analytics load (patches stale `event_demo_1` links when demo events exist). Each item may link to an **event** (`targetEventId`, `eventTitle`), **host** (`hostEmail`, `hostAccountId` / org), and **reporter** (`reporterEmail`).

| Action | Behavior |
|--------|----------|
| **View details** | Opens detail drawer with full message, reporter, device, and inline linked event/host summary cards |
| **View event** | Opens linked event in the same drawer (metrics, schedule, location, host) or jumps from row menu |
| **View host** | Opens personal user or org host profile in the drawer; footer links to user base or org overview |
| **Reply** | Opens `/admin/messages?to=…` (reporter email, or host email as fallback) |
| **Resolve** | Opens confirmation dialog with editable thank-you message; optional in-app notification (default on) and email stub; stores `resolvedAt`, `resolvedBy`, `resolutionMessage` on the item |
| **Delete** | Removes item from localStorage queue |

Default resolve message template is stored in `tudu-feedback-resolve-template` (supports `{name}` placeholder). In-app delivery writes to `tudu-user-notifications` with `type: feedback_resolved` and `feedbackId` linked to the report.

Row click also opens the detail drawer. Footer **Open in events registry** uses `/admin/events?eventId=…`.

### How to test

1. Sign in at `/admin/signin` and load `/admin` once (seeds demo feedback).
2. Optional: load demo events from the dashboard so event links resolve to real registry IDs.
3. Open `/admin/feedback` — click a report row or **View details**.
4. Confirm inline **Linked event** / **Linked host** cards; use **View event** / **View host** for full preview panels.
5. **Back to feedback** returns to the report; **Open in events registry** / **Open in user base** navigate to the full admin pages.
6. Row menu **Reply** still opens Messages compose with the reporter pre-filled.
7. **Resolve** an open item — edit the thank-you message, confirm in-app notification (default on), optional email.
8. Sign in as the reporter (e.g. demo user for seeded feedback) → **My Tudu → Notifications** — confirm resolved message and bell badge.

## Bucket lists (Control Room)

Storage key: `tudu_bucket_lists` in localStorage.

| Route | Purpose |
|-------|---------|
| `/admin/bucket-lists` | Table of all lists; **View** opens visual preview drawer (cover card + reel items + playlist links); **Edit** opens create form |
| `/admin/bucket-lists/create` | Create platform list with title, description, cover (URL or file upload as data URL), custom items (image/title/caption/link), Spotify + Apple Music URLs, vibe/region, public/private |
| `/admin/bucket-lists/create?edit={id}` | Edit existing list with same form + live reels preview panel |

Platform-created lists set `seededByAdmin: true`. **Public** admin lists merge into `getDiscoveryFeedLists()` ahead of default seed lists (same browser localStorage).

Preview drawer reuses consumer `BucketListCoverCard` and a vertical 9:16 item reel. Create page includes a sticky phone-frame preview while editing.

## Seed content

Unchanged functionally — see [ADMIN-SEED-CONTENT.md](./ADMIN-SEED-CONTENT.md).

- Events: `seededByAdmin`, bypass tier limits
- Attractions: teal discover cards via `src/lib/attractions.ts`

## Related libs

| File | Purpose |
|------|---------|
| `src/lib/adminAnalytics.ts` | KPIs, MAU/DAU, chart, event metrics, activity log, `getAnalytics(filters)`, pie analytics (`getUsersPieAnalytics`, etc.) |
| `src/components/admin/AdminPieChart.tsx` | SVG pie charts with legend + hover counts |
| `src/lib/analyticsGeo.ts` | Geographic filter helpers, province/state lists, filter options |
| `src/lib/adminMessages.ts` | Messaging CRUD, poke templates, delivery channel stubs |
| `src/lib/userNotifications.ts` | User in-app notifications (`tudu-user-notifications`) |
| `src/lib/adminFeedback.ts` | Reports & feedback CRUD |
| `src/lib/adminSettings.ts` | Feature flags, tier config persistence, theme overrides |
| `src/lib/adminSidebarNav.ts` | Sidebar nav items, default order, localStorage reorder helpers |
| `src/lib/tierConfig.ts` | **Single source of truth** — tier limits, pricing, micro-transactions, badge styles |
| `src/lib/tierDisplay.ts` | Tier badge labels/colors for host UI (reads `tierConfig`) |
| `src/lib/tierPricing.ts` | Subscription helpers, earnings calculator, plan feature lists |
| `src/lib/demographics.ts` | Age brackets, gender labels, analytics breakdown |
| `src/lib/distantSaves.ts` | Bucket-list saves with city mismatch tracking |
| `src/lib/hiddenGems.ts` | Org-scoped hidden gems (gold discover cards) |
| `src/lib/hostEventSchedule.ts` | Event date/time formatting and org overview tab buckets |
| `src/lib/eventCardColors.ts` | Discover deck border tier colors |
| `src/lib/demoEventsSeed.ts` | One-click demo events across all wizard categories |
| `src/lib/bucketLists.ts` | Bucket list CRUD, admin create/update, discovery merge |
| `src/lib/roadTrips.ts` | Road trip plans CRUD + admin demo seed |
| `src/lib/adminEmployees.ts` | Internal team roster (`tudu-admin-employees`) |
| `src/lib/adminSecurity.ts` | Security event log (`tudu-admin-security-events`) |
| `src/lib/adminSafety.ts` | Safety incident log (`tudu-admin-safety-incidents`) |
| `src/lib/adminMiles.ts` | Miles wallets + economy config (`tudu-admin-miles`) |
| `src/lib/adminRewards.ts` | Rewards/kudos ledger (`tudu-admin-rewards`, 500 kudos = 1 boost) |

## Employees (`/admin/employees`)

Phase 1 localStorage roster of internal TUDU staff (admin, support, moderator). KPIs: team size, active count, departments. Filter by role/status; row menu updates status.

| Storage key | `tudu-admin-employees` |
| Phase 2 | Supabase HR sync, SSO role mapping, audit trail |

## Security (`/admin/security`)

Demo auth/security events: failed logins, bans, suspicious activity, API key stubs. KPIs: total events, high/critical count, last 24h. Detail drawer; bans cross-link to Users.

| Storage key | `tudu-admin-security-events` |
| Phase 2 | Supabase auth logs, rate-limit alerts, managed API keys |

## Safety (`/admin/safety`)

Community safety incident log with types (harassment, unsafe venue, content violation, etc.). Links to Feedback queue. Status workflow: open → investigating → resolved/dismissed.

| Storage key | `tudu-admin-safety-incidents` |
| Phase 2 | Escalation workflows, policy engine, moderator queues |

## TUDU Miles (`/admin/miles`)

Miles economy overview: wallet balances (user email, balance, earned, spent, last activity) and editable earn rates (RSVP, check-in, kudos received, event hosted). Cross-links to Tiers, My TUDU, and Rewards.

| Storage key | `tudu-admin-miles` |
| Phase 2 | Supabase ledger, earn/spend webhooks, miles → rewards pipeline |

## TUDU Rewards (`/admin/rewards`)

Kudos/points ledger and redemption tracker (boost, merch, kudos). **500 kudos = 1 event boost** (host page stub). Cross-links to Event Manager, Tiers, Miles, and Safety feedback.

| Storage key | `tudu-admin-rewards` |
| Phase 2 | Real-time sync with `src/lib/kudos.ts` and boost purchases |

## Related docs

- [ANALYTICS-TESTING.md](./ANALYTICS-TESTING.md) — golden-path checklist for `/admin` analytics
- [ANALYTICS-ROADMAP.md](./ANALYTICS-ROADMAP.md) — future metrics backlog
- [TIERS-AND-ORGS.md](./TIERS-AND-ORGS.md)
- [ADMIN-SEED-CONTENT.md](./ADMIN-SEED-CONTENT.md)
- [EVENT-CARD-COLORS.md](./EVENT-CARD-COLORS.md)
