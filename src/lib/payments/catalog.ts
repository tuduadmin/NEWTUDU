import { getHostEventById } from '../account'
import { summarizeMerchCheckout } from '../merchCheckout'
import { getEventMerchFeeMode } from '../merchFeeMode'
import { getAddonPrices } from '../tierPricing'
import { getCheckoutSubscriptionPrice } from '../subscriptionPricing'
import type { OrgPlanId, UserPlanId } from '../tierConfig'
import { getTierConfig } from '../tierConfig'
import type { CheckoutSessionRequest, PaymentFulfillment } from './types'

function subscriptionMode(planId: UserPlanId | OrgPlanId): 'payment' | 'subscription' {
  if (planId === 'verified' || planId === 'unverified') return 'payment'
  return 'subscription'
}

export function buildCheckoutSessionRequest(fulfillment: PaymentFulfillment): CheckoutSessionRequest {
  const config = getTierConfig()
  const addons = getAddonPrices()

  switch (fulfillment.kind) {
    case 'subscription_user': {
      if (fulfillment.planId !== 'explorer') {
        throw new Error('Only Explorer has a paid user subscription in Phase 1.')
      }
      const amount = getCheckoutSubscriptionPrice('explorer', fulfillment.billingCycle)
      return {
        kind: 'subscription_user',
        currency: 'cad',
        mode: 'subscription',
        totalCad: amount,
        lineItems: [
          {
            label: `${config.badges.explorer.label} (${fulfillment.billingCycle})`,
            amountCad: amount,
          },
        ],
        metadata: {
          tudu_kind: 'subscription_user',
          plan_id: fulfillment.planId,
          billing_cycle: fulfillment.billingCycle,
        },
      }
    }
    case 'subscription_org': {
      if (fulfillment.planId !== 'pioneer' && fulfillment.planId !== 'trusted') {
        throw new Error('Org checkout requires Pioneer or Trusted Host.')
      }
      const amount = getCheckoutSubscriptionPrice(fulfillment.planId, fulfillment.billingCycle)
      return {
        kind: 'subscription_org',
        currency: 'cad',
        mode: 'subscription',
        totalCad: amount,
        lineItems: [
          {
            label: `${config.badges[fulfillment.planId].label} (${fulfillment.billingCycle})`,
            amountCad: amount,
          },
        ],
        metadata: {
          tudu_kind: 'subscription_org',
          plan_id: fulfillment.planId,
          billing_cycle: fulfillment.billingCycle,
        },
      }
    }
    case 'extra_event_slots': {
      const price =
        fulfillment.slots === 5
          ? addons.extraEvent5Pack
          : fulfillment.slots === 1
            ? addons.extraEventSingle
            : addons.extraEventSingle * fulfillment.slots * 0.9
      return {
        kind: 'extra_event_slots',
        currency: 'cad',
        mode: 'payment',
        totalCad: price,
        lineItems: [
          {
            label: `+${fulfillment.slots} public event slot${fulfillment.slots === 1 ? '' : 's'}`,
            amountCad: price,
          },
        ],
        metadata: {
          tudu_kind: 'extra_event_slots',
          email: fulfillment.email,
          slots: String(fulfillment.slots),
        },
      }
    }
    case 'hidden_gem_slots': {
      const plan =
        fulfillment.slots === 3
          ? { price: addons.hiddenGem3Pack, label: '3 Hidden Gem slots' }
          : { price: addons.hiddenGemSingle, label: '1 Hidden Gem slot' }
      return {
        kind: 'hidden_gem_slots',
        currency: 'cad',
        mode: 'subscription',
        totalCad: plan.price,
        lineItems: [{ label: `${plan.label} / mo`, amountCad: plan.price }],
        metadata: {
          tudu_kind: 'hidden_gem_slots',
          org_id: fulfillment.orgId,
          slots: String(fulfillment.slots),
        },
      }
    }
    case 'ticket_order': {
      let totalCents = 0
      const labels: string[] = []
      for (const line of fulfillment.lines) {
        totalCents += line.quantity * line.tier.priceCents
        labels.push(`${line.tier.name} × ${line.quantity}`)
      }
      return {
        kind: 'ticket_order',
        currency: 'cad',
        mode: 'payment',
        totalCad: totalCents / 100,
        lineItems: [
          {
            label: labels.join(', '),
            amountCad: totalCents / 100,
          },
        ],
        metadata: {
          tudu_kind: 'ticket_order',
          event_id: fulfillment.eventId,
          attendee_email: fulfillment.attendeeEmail,
          cart: JSON.stringify(
            fulfillment.lines.map((l) => ({ tierId: l.tier.id, quantity: l.quantity })),
          ),
        },
      }
    }
    case 'merch_order': {
      const event = getHostEventById(fulfillment.eventId)
      const feeMode = getEventMerchFeeMode(event)
      const summary = summarizeMerchCheckout(fulfillment.lines, feeMode)
      const labels = fulfillment.lines.map(
        (l) => `${l.productName} (${l.size}) × ${l.quantity}`,
      )
      const lineItems =
        feeMode === 'fees_included'
          ? [{ label: labels.join(', '), amountCad: summary.totalCents / 100 }]
          : [
              { label: labels.join(', '), amountCad: summary.subtotalCents / 100 },
              ...(summary.platformFeeCents > 0
                ? [
                    {
                      label: `TUDU marketplace fee (${summary.itemCount} item${summary.itemCount === 1 ? '' : 's'})`,
                      amountCad: summary.platformFeeCents / 100,
                    },
                  ]
                : []),
              ...(summary.stripeFeeCents > 0
                ? [
                    {
                      label: 'Stripe processing',
                      amountCad: summary.stripeFeeCents / 100,
                    },
                  ]
                : []),
            ]
      return {
        kind: 'merch_order',
        currency: 'cad',
        mode: 'payment',
        totalCad: summary.totalCents / 100,
        lineItems,
        metadata: {
          tudu_kind: 'merch_order',
          event_id: fulfillment.eventId,
          user_email: fulfillment.userEmail,
          holder_name: fulfillment.holderName,
          ticket_id: fulfillment.ticketId ?? '',
          cart: JSON.stringify(
            fulfillment.lines.map((l) => ({
              productId: l.productId,
              productName: l.productName,
              size: l.size,
              quantity: l.quantity,
              unitPriceCents: l.unitPriceCents,
            })),
          ),
        },
      }
    }
    default: {
      const _exhaustive: never = fulfillment
      throw new Error(`Unhandled fulfillment: ${String(_exhaustive)}`)
    }
  }
}
