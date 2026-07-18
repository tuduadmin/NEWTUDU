# TUDU Master Spec

Last updated from company docs: July 2026 direction set.  
Sources: `Tudu DIRECTION.docx`, `TUDU DIRECTION/*`, `TUDU V10 REVIEW.docx`, feature direction docs, Miles/Milestone/Paid Tier references.

---

## 1. Product vision

**TUDU** is a local event discovery platform built to get people off their screens and into their communities. Users swipe through a card deck of nearby experiences; hosts publish events with low fees; the platform layers social features (friends, following organizers), gamification (TUDU Miles), and premium modes (Travel Pass, subscriptions, Road Trip, Bucket List).

Positioning: *Free to post. Built for locals.* Quieter than social media — real events from real people, from garage sales to galas.

Company: **TUDU Entertainment Inc.** (tudu.ca)

---

## 2. User types

| Type | Description |
|------|-------------|
| **Explorer (free)** | Default attendee; browses deck, saves, RSVPs; lower Miles earn rate |
| **Attendee / Tuduan** | Registered user with profile, preferences, friends |
| **Host / Organizer** | Creates events; freemium limits on recurring/permanent events |
| **Verified user** | Identity-verified; standard card border |
| **Trusted Host (partner)** | Calendar-integrated partner; green border; subscription tier |
| **Hidden Gem** | Full-time restaurant/entertainment business; gold border |
| **Pioneer subscriber** | Paid tier; orange border |
| **Vendor** | Sells merch via Event Marketplace |
| **Admin** | Attraction cards, deck injection, gifting, approvals |
| **TUDU Crew** | Paid brand ambassadors / content creators |
| **TUDU BLACK member** | Invitation-only luxury tier (future) |

---

## 3. Complete page map

### Public / marketing

| Route | Page |
|-------|------|
| `/` | Landing — hero, features, events, organizer CTA, join |
| `/host` | Host marketing / upgrade entry |
| `/signup` | Create account |
| `/signin` | Sign in |
| `/about` | About us / our story *(planned)* |
| `/careers` | Tudu Crew careers & applications *(planned)* |
| `/contact` | Get in touch form *(planned)* |
| `/foundation` | TUDU Foundation story *(planned)* |
| `/miles` | TUDU Miles program *(planned)* |
| `/terms-of-service` | Legal *(planned)* |
| `/privacy` | Privacy policy *(planned)* |

### Onboarding (post-signup)

| Route | Step |
|-------|------|
| `/onboarding/interests` | Category interests |
| `/onboarding/budget` | Event budget |
| `/onboarding/distance` | Travel distance |
| `/onboarding/timeframe` | When looking for events |
| `/onboarding/friends` | Invite / find friends |

### Core app (authenticated)

| Route | Page |
|-------|------|
| `/discover` | **Things Tudu** — swipeable card deck (default home) |
| `/search` | Search / event details |
| `/bucket-list` | Bucket List Mode |
| `/road-trip` | Road Trip Mode |
| `/my-tudu` | Profile dashboard — saved, tickets, past |
| `/my-tudu/settings` | Edit profile, interests, location, Travel Pass |
| `/following` | Followed hosts |
| `/friends` | Friends & invites |
| `/settings` | Alias → settings |

### Host / planner (planned)

| Route | Page |
|-------|------|
| `/planner` | Organizer dashboard |
| `/planner/create` | 8-step event creation wizard |
| `/planner/drafts` | Saved drafts |
| `/planner/upgrade` | Trusted Host subscription |
| `/planner/analytics` | Saves / bucket list visibility (Trusted Host perk) |

### Commerce (planned)

| Route | Page |
|-------|------|
| `/marketplace` | Miles redemption & boosts |
| `/travel-pass` | Purchase / manage Travel Pass |
| `/subscriptions` | Pathfinder / Creator / Trusted Host |
| `/checkout` | Tickets + merch unified QR |

### Admin (planned)

| Route | Page |
|-------|------|
| `/admin` | Dashboard |
| `/admin/events` | Push / approve deck cards |
| `/admin/attractions` | Teal attraction cards |

---

## 4. User flows

### Sign up

1. Landing → Join → Sign up form (name, email, password, DOB, hear-about, terms)
2. Onboarding: interests → budget → distance → timeframe → friends
3. Land on `/discover` card deck
4. Stay logged in (session persists like Instagram)

### Sign in

1. Loading screen → if session exists, open card deck directly
2. Otherwise landing → sign in → onboarding if incomplete, else discover

### Card deck

1. Header shows effective location (home or Travel Pass city)
2. Swipe/buttons: Back, Skip, View, Save, Share
3. Save writes to bucket list; Skip advances; Reset restarts deck
4. Cards filtered by interests, budget, distance, timeframe

### Host

1. Host tab → marketing or planner (if entitled)
2. 8-step create event (description + TUDU Intelligence AI, imagery, category, schedule, amenities, ticketing, preview)
3. Paid features (recurring, permanent) gate to subscription

### Road Trip

1. Bottom nav → themed landing (seasonal art)
2. **Plan a Destination** — route + N stops
3. **Surprise Me** — local spontaneous route
4. **Scan Mode** — passive nearby alerts while driving

### Bucket List

1. Save from deck → item in user's list
2. Optional: browse others' bucket lists (separate swipe surface)
3. Mark complete + optional write-up
4. Spotify playlist embed per list; Instagram links

### My Tudu

1. Profile stats: followed hosts, past events, kudos, bucket list count
2. Tabs: Saved, My Tickets, Past
3. Settings, invite friends, beta feedback

### Search

1. From View action or discover link
2. Filter/browse all events

### Friends

1. Invite via contacts / share
2. Onboarding optional step

### Paid tiers & Travel Pass

See Section 6.

### Location rules

- **Default:** GPS / home location from profile (`Primary Location`)
- **Travel Pass active:** deck and search center on Travel Pass city (not home)
- Display: home location with *(Travel Pass enabled)* indicator when active
- Pass durations: 24h ($1.99), 7d ($4.99), 30d ($9.99) — purchasable or Miles redemption

---

## 5. Feature specs

### Card deck

- Dusk/dark theme default for in-app experience
- Action buttons: all five with glow aura (Back=blue, Skip=red, View=orange center, Save=green, Share=purple)
- Share order: Back | Skip | View | Save | Share
- Toast/feedback on swipe actions (skip blocks buttons briefly — fix: toast shouldn't block)
- Event auto-remove from saved after event ends *(planned)*

### Event creation (host)

- 8 steps with scroll-to-top, save draft, autofill for repeat venues
- TUDU Intelligence: AI description from prompts (Phase 2: character integration)
- Schedule tiers: single/multi-day free; recurring/permanent paid
- Private events: followers only; RSVP + UNAVAILABLE for business use

### Ticketing & marketplace

- Basic ticket sales with platform cut
- Unified QR for entry + merch fast-pass pickup
- Ship-ahead or on-site pickup cutoff rules

### Notifications

- TUDU pin icon with color when native app exists
- RSVP, Scan Mode alerts, partner promos

### TUDU Miles

- Earn: $1 spent → 100 Miles; activity milestones; referrals
- Redeem: 800 Miles → $1 value (12.5% effective return)
- Expiry: soft 18mo, hard 24mo
- Subscriptions earn Miles but cannot be bought with Miles

### Milestone awards (hosts)

| Events hosted | Award |
|---------------|-------|
| 10 | Bronze Compass plaque + badge |
| 50 | Silver Trailblazer |
| 250 | Gold Adventurer |
| 1,000 | Emerald Pathfinder crystal trophy |
| 5,000+ | Diamond Horizon |

### Communications

- Email pattern: `{initial}{lastname}@tudu.ca`
- Role inboxes: admin@, noreply@, crew@, info@, support@

---

## 6. Paid tiers & Travel Pass

### Subscriptions (from Miles doc)

| Plan | Monthly | Annual | Miles/mo equiv |
|------|---------|--------|----------------|
| **Pathfinder** (Pioneer) | $9.99 | $89.99 | 1,000 / 9,000 |
| **Creator** | $24.99 | $194.92 | 2,500 / 19,500 |
| **Trusted Host** | $49.99 | $329.94 | 5,000 / 45,000 |

*Note: `TUDU_Paid_Tiers_Checklist_v2.pdf` exists but is image-based; confirm exact perk matrix from user/screenshots.*

### Travel Pass

| Pass | Price | Miles (earn) | Miles (redeem) |
|------|-------|--------------|----------------|
| 24 hours | $1.99 | ~200 | 1,600 |
| 7 days | $4.99 | ~500 | 4,000 |
| 30 days | $9.99 | ~1,000 | 8,000 |

### Host marketplace tools

Single Boost ($2.99), Extra Event Post ($1.99), 3-Pack ($4.99), Highlighted Slot ($9.99), Weekly Featured ($24.99)

### TUDU BLACK (future)

Invitation-only; private events; concierge; jet access; separate brand (black/gold)

---

## 7. Built vs missing (repo: `Projects/tudu`)

### Built (UI shell / partial logic)

| Area | Status |
|------|--------|
| Landing page | ✅ Hero, features, events, CTAs (needs dusk-only hero per spec) |
| Sign up / Sign in | ✅ localStorage auth, demo user |
| Onboarding flow | ✅ 5 steps wired |
| Card deck page | ⚠️ Buttons only; no swipe, no persistent save |
| Bottom nav | ✅ 5 tabs matching spec labels |
| My Tudu | ⚠️ Profile UI; saved tab empty |
| Settings | ⚠️ Profile/prefs; no Travel Pass yet |
| Friends / Following / Search | ⚠️ UI shells |
| Host page | ⚠️ Marketing placeholder only |
| Bucket List | ❌ "Coming soon" placeholder |
| Road Trip | ❌ "Coming soon" placeholder |
| Loading screen | ❌ Missing |
| Session routing | ❌ Sign-in always → onboarding |
| Travel Pass | ❌ Not implemented |
| Backend / API | ❌ None (localStorage only) |
| Payments (Stripe) | ❌ Not integrated |
| Admin dashboard | ❌ Not started |
| Event creation wizard | ❌ Not started |
| Ticketing / QR | ❌ Not started |
| Miles / subscriptions | ❌ Not started |
| Spotify / Instagram embeds | ❌ Not started |
| Legal pages | ❌ Links only |

---

## 8. Implementation priority

### Phase 1 — Core loop (current)

1. Loading screen + session persistence routing
2. Card deck gestures + action wiring (skip/save/view/reset)
3. Bucket list persistence + basic list UI
4. Travel Pass in settings + location header rules
5. Landing hero dusk gradient + copy alignment
6. Card border tier colors on mock events

### Phase 2 — Host & discovery depth

1. Search/filter connected to deck data
2. My Tudu saved tab ← bucket list sync
3. Host planner shell + create-event step 1–2
4. Trusted Host upgrade page
5. Private event + RSVP/UNAVAILABLE

### Phase 3 — Modes & commerce

1. Road Trip Mode (plan + surprise + theming)
2. Bucket List Mode (browse lists, complete + write-up)
3. Travel Pass purchase flow (Stripe)
4. Subscriptions + Miles ledger
5. Basic ticketing

### Phase 4 — Platform & ecosystem

1. Admin dashboard + attraction cards
2. Event Marketplace + QR
3. Notifications + Scan Mode
4. TUDU Intelligence / AI descriptions
5. Crew / Foundation / marketing pages

### Phase 5 — Premium & scale

1. TUDU BLACK
2. Native app / PWA add-to-home
3. Backend (Supabase per invoices in docs)
4. Multi-region + seasonal theming automation

---

## Open questions (needs user input)

1. **Paid tier perks matrix** — provide screenshots or text export of `TUDU_Paid_Tiers_Checklist_v2.pdf`
2. **Save flow** — direct save vs save-then-organize for bucket list?
3. **Travel Pass UI** — second location field vs badge on home location bar?
4. **CHANGES/*.pdf** — screenshot PDFs (Landing, Ticketing, Bugs) need manual review
5. **Default theme** — dusk only, or follow system dark/light with dusk preferred?
6. **Freemium Miles** — can Explorer tier accumulate Miles or earn-only on paid actions?
