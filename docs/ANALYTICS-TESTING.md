# Analytics Testing Guide

Golden-path checklist for verifying TUDU Control Room analytics at `/admin`.

**Local URL:** `http://172.16.1.78:5173/admin` (or your Vite dev host)

**Phase 1 storage:** All metrics read from `localStorage` (`tudu_accounts`, `tudu_host_events`, `tudu-admin-activity-log`, etc.).

**Phase 2:** Supabase will replace direct localStorage reads in `adminAnalytics.ts`. Geographic filter helpers in `analyticsGeo.ts` and the pie chart UI stay the same — only the data source changes.

---

## Prerequisites

1. Sign in as platform admin (`demo@tudu.ca` / demo password).
2. Open `/admin` — **Platform Analytics** dashboard.
3. On first load, demo geo users and activity log seed automatically (`seedDemoAnalytics()`).

---

## 1. Load demo data

| Step | Action | Expected |
|------|--------|----------|
| 1a | Click **Load demo events** (header) | 20 category events created; button disables |
| 1b | Refresh page | Demo events not duplicated; KPI **Total Events** ≥ 20 |
| 1c | Open **Users** tab | Pie **Users by country** shows Canada-heavy slices + USA + UK stub users |
| 1d | Open **Events** tab | Pies show mixed statuses (Live / Upcoming / Past / Draft) and categories |

Demo geo users are seeded once per browser (`tudu_demo_geo_users_v1`). Clear that key in DevTools to re-seed.

---

## 2. Geographic filters

Filter bar applies to **all** sub-tabs (Overview, Users, Events, Geography, Engagement).

| Step | Action | Expected |
|------|--------|----------|
| 2a | Country → **Canada** | KPI **Total Users** drops to Canadian accounts only |
| 2b | Province → **SK** | SK users only (Saskatoon, Regina, Kindersley, Moose Jaw demo accounts) |
| 2c | City → e.g. **Saskatoon** | Single-city slice; KPIs reflect one user |
| 2d | Click **Clear filters** | Full platform totals restore |

Verify on **Geography** tab: province pie and top cities list match the filtered user set.

---

## 3. Pie slices vs drill-down tables

For each analytics sub-tab, hover pie slices or legend rows — center label shows **count + percentage**.

| Tab | Pie | Table to cross-check |
|-----|-----|----------------------|
| **Users** | Country, tier, verification | User drill-down — row counts sum to filtered user total |
| **Events** | Category, status, visibility, seeded vs host | Event drill-down — category counts match pie |
| **Geography** | Country, province/state | Top cities list — same city counts as pie segments |
| **Engagement** | Card opens vs saves vs passes, RSVP, MAU vs inactive | Card opens KPIs + top keywords + activity types |
| **Tickets** | Tickets sold by category | Top events table — sold/revenue match KPI totals |

**Pass criteria:** Legend count for a slice equals the matching drill-down row (percentages sum to ~100% per chart).

---

## 4. Seed event approval → event counts

| Step | Action | Expected |
|------|--------|----------|
| 4a | Note **Total Events** / Events tab **Draft** or **Admin seeded** slice | Baseline recorded |
| 4b | Go to `/admin/seed-events` → approve a pending seed event | Event becomes live-eligible |
| 4c | Return to `/admin` → **Events** tab | Status / seeded pies update; Overview KPI **Live Public** may increase |

Data link: `HostEvent.seededByAdmin`, `HostEvent.seedApprovalStatus` in `src/lib/account.ts`; metrics via `getEventsPieAnalytics()` in `src/lib/adminAnalytics.ts`.

---

## 5. User activity → MAU

| Step | Action | Expected |
|------|--------|----------|
| 5a | Sign in as `demo@tudu.ca` (or any demo user in a second tab) | `lastActiveAt` updated via `touchLastActive()` |
| 5b | Browse `/discover` or any route | Activity tracker refreshes timestamp |
| 5c | `/admin` → Overview KPI **MAU (30d)** | Count includes recently active user |
| 5d | **Engagement** tab → **MAU vs inactive** pie | Active slice increases |

Data link: `UserAccount.lastActiveAt` in `tudu_accounts`; `getMAU()` / `getEngagementPieAnalytics()` in `adminAnalytics.ts`.

To simulate inactive users: edit `lastActiveAt` in DevTools → Application → `tudu_accounts` to a date >30 days ago.

---

## 6. Engagement metrics (stub fields)

| Metric | Source | Notes |
|--------|--------|-------|
| Card opens vs saves vs passes | `tudu-admin-event-metrics` views/saves/opens | Opens = detail panel views (magnifying glass / swipe-up on Discover). Passes = views − opens − saves |
| Card opens KPIs | Same metrics | Open/save/pass rates; key Trusted Host tier signal |
| RSVP conversion | Event `ticketTiers[].sold` vs views | Views without RSVP = views − RSVPs |
| Top keywords | `keywordAnalytics.ts` + event tags when geo-filtered | Tag counts from filtered events |
| Activity types | `tudu-admin-activity-log` | Signup, event_published, sync, etc. |

### Card opens (live test)

| Step | Action | Expected |
|------|--------|----------|
| 6a | Browse `/discover` — tap **View** (magnifying glass) on several cards | `tudu-admin-event-metrics` → matching event `opens` increments |
| 6b | `/admin` → **Engagement** tab | **Total card opens** increases; pie **Card opens vs saves vs passes** updates |
| 6c | Apply geo filter matching event city | Opens count scoped to filtered events only |

---

## 7. Ticket sales analytics

| Step | Action | Expected |
|------|--------|----------|
| 7a | Load demo events (if not already) | Demo ticket transactions seed automatically (`tudu_demo_ticket_sales_v1`) |
| 7b | `/admin` → **Tickets** tab | KPI cards show sold count, revenue, cancelled, avg price (non-zero after demo seed) |
| 7c | Pie **Tickets sold by event category** | Slices match category breakdown table |
| 7d | **Top events by ticket sales** table | Rows sorted by sold count; revenue uses tier `priceCents` |
| 7e | Country → **Canada**, Province → **SK** | KPIs and table filter to SK events only |
| 7f | RSVP or buy ticket on a live event (`/event/:id/rsvp`) | **Tickets sold** +1; transaction in `tudu-ticket-transactions` with status `paid` |

Data link: `src/lib/ticketTransactions.ts`, `getTicketSalesKPIs()` / `getTicketSalesPieAnalytics()` in `adminAnalytics.ts`. RSVP flow logs transactions in `EventRsvpPage.tsx`.

To re-seed demo ticket data: clear `tudu_demo_ticket_sales_v1` and `tudu-ticket-transactions` in DevTools, then refresh `/admin`.

---

## 8. Overview tab regression

| Check | Expected |
|-------|----------|
| KPI grid | 14 cards; values change with geo filters |
| Growth chart | 30-day signups + events line chart |
| Activity feed | Recent log entries (geo-filtered when filters active) |
| Top 5 cities / keywords | Match Geography / Engagement partial data |

---

## 9. Admin messaging & delivery channels

| Step | Action | Expected |
|------|--------|----------|
| 9a | `/admin/signin` → `/admin/messages` | Demo inbound threads visible |
| 9b | Compose to `demo@tudu.ca` — check Email, SMS, In-app — Send | Outbound bubble; badges Email ✓, In-app ✓; SMS ✗ if phone unverified |
| 9c | DevTools → `tudu-admin-messages` | Message has `deliveryChannels`, `deliveryStatus` |
| 9d | DevTools → `tudu-user-notifications` | Entry under `demo@tudu.ca` when In-app selected |
| 9e | Sign in as `demo@tudu.ca` → `/my-tudu` | Bell badge = 1; **Messages from TUDU** preview |
| 9f | Open `/my-tudu/notifications` | Notification listed; tap to expand; mark read clears badge |
| 9g | `/admin` → Overview activity feed | `message_delivery` stub entries for email/SMS/in-app |

Data link: `src/lib/adminMessages.ts`, `src/lib/userNotifications.ts`, activity type `message_delivery` in `adminAnalytics.ts`.

---

## DevTools keys (quick reset)

| Key | Purpose |
|-----|---------|
| `tudu_demo_geo_users_v1` | Re-run geo user seed |
| `tudu_demo_events_v1` | Allow re-loading demo events batch |
| `tudu-admin-activity-log` | Activity feed + chart |
| `tudu-admin-event-metrics` | Views/saves/opens for engagement pies |
| `tudu-ticket-transactions` | Paid and cancelled ticket transactions |
| `tudu_demo_ticket_sales_v1` | Re-run demo ticket sales seed |
| `tudu_accounts` | User geo, tier, MAU timestamps |
| `tudu-admin-messages` | Admin message threads + delivery status |
| `tudu-user-notifications` | User in-app notifications by email |

---

## Related docs

- [ADMIN-PORTAL.md](./ADMIN-PORTAL.md) — Control Room routes and data linking
- [ANALYTICS-ROADMAP.md](./ANALYTICS-ROADMAP.md) — future metrics backlog
