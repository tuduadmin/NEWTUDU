# TUDU Tier Pricing Strategy

Optimized subscription + micro-transaction model. Configured in code via [`src/lib/tierConfig.ts`](../src/lib/tierConfig.ts) and editable in Control Room at [`/admin/tiers`](http://localhost:5173/admin/tiers).

## Two-track model

| Track | Audience | Free tier | Paid upgrade |
|-------|----------|-----------|--------------|
| **User (personal)** | Garage sales, house parties, solo hosts | Verified (free) | Explorer (founding $7.99/mo · full $11.99/mo) |
| **Org (Host Account)** | Venues, museums, recurring sellers | Verified (approved org) | Pioneer / Trusted Host |

Personal and org tracks are **separate** — org subscription does not replace the personal plan, except where noted for Trusted Host primary owners.

## User track (personal account)

| Tier | Price | Private events | Public / mo | Ads | Platform fee |
|------|-------|----------------|-------------|-----|--------------|
| Unverified | Free | 2 | 0 | Yes | — (verify first) |
| Verified | Free | 10 | 3 (monthly reset) | Yes | 3.5% + $0.49 + Stripe |
| Explorer | Founding **$7.99/mo · $79.90/yr** (grandfathered for life while subscribed) · full **$11.99/mo · $119.90/yr** | Unlimited | 5 (monthly reset) | No | 2.5% + $0.49 + Stripe |

**Verified perks:** bucket list · 1 dark + 1 light theme · Travel Pass 7-day trial · Road Trip with trial week · Travel Pass purchasable after trial.

**Explorer perks:** bucket list · extra themes · Travel Pass included · Road Trip Mode · Quick Pick + enhanced search · no ads.

Public event caps reset monthly — no rollover.

## Org track (Host Account)

| Tier | Price | Public / mo | Boosts / mo | Platform fee | Notes |
|------|-------|-------------|-------------|--------------|-------|
| Pioneer | $14.99/mo · $149.90/yr | 10 | 1 | 1.5% + $0.49 + Stripe | Hidden Gems add-on |
| Trusted Host | $34.99/mo · $349.90/yr | 20 | 3 | 0% + $0.49 + Stripe | 1 Hidden Gem included · business listing |

**Trusted Host primary-owner perk (personal track, separate):**

- Only the **primary** org owner (not backup admins) receives Explorer-equivalent perks on their personal account.
- Personal ticketed events use Trusted Host fees (0% platform) while they remain primary on an active Trusted org.

## Micro-transactions

| Product | Price | Use case |
|---------|-------|----------|
| Single Event Boost | $4.99 | 24hr discover deck priority |
| 3-Pack Boosts | $12.99 | Best value for occasional hosts |
| Extra public event | $2.99 | One-time slot when at monthly cap |
| 5 extra events | $9.99 | Bundle for busy months |
| Travel Pass (week) | $4.99 | Discover events in other cities |
| Travel Pass (month) | $9.99 | Road trip / relocation planning |

Feature flags: `/admin/settings` → Boosts shop, Extra events shop, Travel Pass.

## Admin & consumer surfaces

| Surface | Route | Source |
|---------|-------|--------|
| Control Room tier editor | `/admin/tiers` | `tierConfig.ts` → localStorage `tudu-admin-tier-config` |
| Consumer subscription page | `/host/subscription` | Same config via `getTierConfig()` |
| Limit enforcement | Create Event | `account.ts` → `canCreatePrivateEvent`, `canCreatePublicEvent` |
| Effective perks | Quick Pick, etc. | `getEffectiveUserPerks()` in `account.ts` |

See also [ADMIN-PORTAL.md](./ADMIN-PORTAL.md) and [TIERS-AND-ORGS.md](./TIERS-AND-ORGS.md).

## Implementation notes

- Config version **5** — legacy v4 keys migrate on read (Explorer price, public caps, perks).
- Stripe: configure `.env` from `.env.example`; purchases use `src/lib/payments/` (demo until API is live). See [STRIPE-INTEGRATION.md](./STRIPE-INTEGRATION.md).
- MRR analytics on `/admin/tiers` is a stub.
