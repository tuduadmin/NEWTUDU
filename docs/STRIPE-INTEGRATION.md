# Stripe integration

Phase 1 checkout in the app is **demo/local** until `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_PAYMENTS_API_URL` are set. All purchase paths go through `src/lib/payments/`.

## Architecture

```
UI (HostCheckoutPlaceholder, Subscription, RSVP)
  → runCheckoutFlow(fulfillment)  OR  startCheckoutSession()
       ├─ demo: fulfillPayment() → account / tickets / org storage
       └─ live: POST {VITE_PAYMENTS_API_URL}/checkout/session → redirect to Stripe
Webhook (your server)
  → verify signature → fulfillPayment() with metadata (same as demo)
  → persist stripeCustomerId, subscriptionId, Connect account id (Supabase)
```

## Fulfillment kinds (`PaymentFulfillment`)

| Kind | UI entry | Local handler |
|------|----------|---------------|
| `subscription_user` | `/host/subscription` Explorer | `applyDemoSubscriptionUpgrade` |
| `subscription_org` | `/host/subscription` Pioneer / Trusted | same (org scope) |
| `extra_event_slots` | Extra public events panel | `purchaseExtraEventSlots` |
| `hidden_gem_slots` | Hidden Gem listing slots | `subscribeHiddenGemSlots` |
| `ticket_order` | `/event/:id/rsvp` paid tiers | `completeTicketCheckout` |
| `merch_order` | `/event/:id/marketplace` | `completeMerchCheckout` → order + confirmation email |

**Not wired in fulfillment yet:** boosts, travel pass — add kinds before Stripe Price IDs.

### Merch order confirmation email

- Sent **only** from `completeMerchCheckout()` (not when the cart is built).
- Demo / local: `beginPaidCheckout` → `fulfillPayment` → `completeMerchCheckout`.
- Live Stripe: webhook on `checkout.session.completed` must parse `metadata.tudu_kind === 'merch_order'` and call the same `completeMerchCheckout` input (see `cart` JSON in metadata). Do **not** rely on Stripe receipt for pickup numbers.
- Optional client return URL: `/event/:eventId/marketplace?checkout=success` consumes `sessionStorage` pending fulfillment if webhook is not wired yet (dev only).

## API contract: `POST /checkout/session`

Request body (from `buildCheckoutSessionRequest` + optional `customerEmail`):

```json
{
  "kind": "subscription_user",
  "currency": "cad",
  "mode": "subscription",
  "totalCad": 7.99,
  "lineItems": [{ "label": "Explorer (monthly)", "amountCad": 7.99 }],
  "metadata": {
    "tudu_kind": "subscription_user",
    "plan_id": "explorer",
    "billing_cycle": "monthly"
  },
  "customerEmail": "host@example.com"
}
```

Response:

```json
{ "url": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

Server responsibilities:

1. Authenticate user (session JWT from Supabase).
2. Map `metadata.tudu_kind` + `plan_id` / `slots` / `event_id` to Stripe Price IDs.
3. Create Checkout Session (`mode: payment | subscription`).
4. For **ticket_order**: use Connect — `payment_intent_data.application_fee_amount` = platform fee (see `tierConfig` fees); transfer to host Connect account.
5. Store `client_reference_id` or metadata for webhook fulfillment.

## Webhooks (minimum)

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Fulfill one-time purchases; link subscription |
| `customer.subscription.updated` / `deleted` | Sync tier / Hidden Gem subscription active flag |
| `account.updated` (Connect) | Sync `stripeConnectStatus` on host profile |

After Supabase migration, **webhook is source of truth** — client `fulfillPayment` is demo-only.

## Connect (host payouts)

- Onboarding: `POST /connect/onboarding-link` → Stripe Express URL.
- Persist `stripeConnectAccountId` per host org/user.
- Finance Hub / Payments settings read connection status from Supabase, not localStorage.

## Ticket platform fee (reference)

From `tierConfig` (CAD), plus Stripe processing on host payout:

- Verified: 3.5% + $0.49 / ticket  
- Explorer: 2.5% + $0.49  
- Pioneer: 1.5% + $0.49  
- Trusted: 0% + $0.49  

Calculator constants: `STRIPE_PROCESSING` in `tierPricing.ts` (2.9% + $0.30).

## Launch checklist (Sask → CA/US)

1. Supabase: users, events, tickets, subscriptions tables.
2. Deploy payments API + webhook endpoint (HTTPS).
3. Fill `.env` from `.env.example`; create Products/Prices in Stripe.
4. Test mode: one Explorer sub, one $25 ticket with Connect test account.
5. Turn off demo copy on RSVP when `isStripeCheckoutConfigured()` is true.
6. Billing portal route for subscription management.

See also [TIER-PRICING-STRATEGY.md](./TIER-PRICING-STRATEGY.md).
