# TUDU Analytics Roadmap

A-list analytics recommendations to surpass Eventbrite — organized by category with implementation priority for the Control Room and product telemetry.

## Acquisition

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| Signup source | Know which channels (organic, referral, partner) drive growth | UTM + `referralCode` on signup |
| Referral attribution | Reward advocates; measure viral loops | Friend invite links + `tudu_event_saves` cross-ref |
| CAC proxy | Ad spend ÷ new signups (when paid marketing live) | Admin settings for monthly spend ÷ signups |
| Conversion funnel | visit → signup → first save → first RSVP | Funnel events in activity log |

**Priority:** Funnel completion rate and signup source — highest leverage for growth decisions.

## Engagement

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| MAU / DAU / WAU | Core health of active user base | `lastActiveAt` on accounts (live in dashboard) |
| Session length | Quality of visits | Route-change timestamps in activity tracker |
| Cards swiped | Discover deck throughput | Per-session swipe count on Discover |
| Save rate | saves ÷ card views | Event metrics + dashboard KPI |
| Pass rate | skips ÷ card views | Swipe-left telemetry |
| Bucket list adds | Intent beyond single save | Bucket list creation events |

**Priority:** Save rate and cards swiped — unique to TUDU's swipe-first discovery.

## Retention

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| D1 / D7 / D30 retention | Cohort stickiness | Signup date vs return visit |
| Churn | Users inactive 30+ days | Inverse of MAU cohort |
| Reactivation | Poke candidates who saved but didn't RSVP | Saved events + no RSVP after N days |

**Priority:** D7 retention and reactivation list for push/email campaigns.

## Events

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| Publish rate | Hosts completing create flow | `event_published` activity |
| Fill rate | RSVPs ÷ capacity | Ticket tier `sold` vs `quantity` |
| Avg RSVPs per event | Host success benchmark | Aggregate RSVP counts |
| Ticket conversion | Views → ticket purchase | Views + RSVP / purchase events |
| No-show rate | Attendance vs RSVP (future check-in) | Ticket scanner data |

**Priority:** Fill rate and avg RSVPs — direct host value prop vs Eventbrite.

## Geography

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| Heat map data | Where demand clusters | User home city + event city |
| Cross-city saves | Distant interest (Hidden Gem signal) | `tudu_event_saves` `isDistant` |
| Top cities | Market prioritization | Demographics breakdown (live) |

**Priority:** Cross-city interest — differentiator for Hidden Gem / Trusted Host promos.

## Host

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| Trusted Host performance | Partner ROI | Border type + saves/RSVPs by host |
| Hidden Gem saves from afar | Outreach validation | Distant saves on gem events |
| Promo redemption | Campaign effectiveness | Promo code field on seeded events |

**Priority:** Distant saves on partner events — ties to revenue partnerships.

## Revenue

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| GMV | Gross merchandise value | Sum of ticket sales (when payments live) |
| Avg ticket price | Pricing intelligence | Tier price analytics |
| Tier upgrades | Subscription conversion | Org tier changes in admin |

**Priority:** GMV and tier upgrades — post-payment launch.

## Search & discovery

| Metric | Why it matters | TUDU stub / path |
|--------|----------------|------------------|
| Top keywords | What users actually want | `tudu-keyword-stats` from event tags |
| Zero-result searches | Content gaps | Search queries with 0 matches |
| Category demand | Inventory planning | Saves/views by primary category |

**Priority:** Top keywords and zero-result searches — "find what you need" product thesis.

---

## Dashboard KPIs (implemented stubs)

The Control Room `/admin` dashboard now surfaces:

- **Save rate** — saves ÷ card views across event metrics
- **RSVP conversion rate** — total RSVPs ÷ card views
- **Cross-city interest** — count of distant saves
- **Top 5 cities** — users by home city
- **Top search keywords** — from event tag view/save tracking
- **Week-over-week signup trend** — last 7 days vs prior 7 days

## Next implementation phases

1. **Phase 1 (current):** localStorage stubs, dashboard KPIs, keyword tracking on save/view
2. **Phase 2:** Cohort retention charts, funnel visualization, zero-result search log
3. **Phase 3:** Server-side event pipeline, real-time dashboards, export to BI tools
4. **Phase 4:** Predictive fill-rate models, host recommendations, A/B experiment framework
