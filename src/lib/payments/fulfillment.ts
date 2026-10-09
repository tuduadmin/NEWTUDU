import { applyDemoSubscriptionUpgrade, purchaseExtraEventSlots, subscribeHiddenGemSlots } from '../account'
import { completeMerchCheckout } from '../merchCheckout'
import { completeTicketCheckout } from '../ticketCheckout'
import type { FulfillmentResult, PaymentFulfillment } from './types'

/**
 * Apply purchase locally after demo checkout or after Stripe webhook confirms payment.
 * Server webhooks should call the same handlers with verified metadata.
 */
export function fulfillPayment(fulfillment: PaymentFulfillment): FulfillmentResult {
  switch (fulfillment.kind) {
    case 'subscription_user': {
      const result = applyDemoSubscriptionUpgrade(
        fulfillment.planId,
        'user',
        fulfillment.billingCycle,
      )
      return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Upgrade failed.' }
    }
    case 'subscription_org': {
      const result = applyDemoSubscriptionUpgrade(
        fulfillment.planId,
        'org',
        fulfillment.billingCycle,
      )
      return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Upgrade failed.' }
    }
    case 'extra_event_slots': {
      const result = purchaseExtraEventSlots(fulfillment.email, fulfillment.slots)
      return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Purchase failed.' }
    }
    case 'hidden_gem_slots': {
      const result = subscribeHiddenGemSlots(fulfillment.orgId, fulfillment.slots)
      return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Subscription failed.' }
    }
    case 'ticket_order': {
      const result = completeTicketCheckout({
        eventId: fulfillment.eventId,
        attendeeEmail: fulfillment.attendeeEmail,
        attendeeName: fulfillment.attendeeName,
        lines: fulfillment.lines,
      })
      return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Checkout failed.' }
    }
    case 'merch_order': {
      const result = completeMerchCheckout({
        eventId: fulfillment.eventId,
        userEmail: fulfillment.userEmail,
        ticketId: fulfillment.ticketId,
        holderName: fulfillment.holderName,
        lines: fulfillment.lines,
      })
      if (!result.ok) {
        return { ok: false, error: result.error ?? 'Merch checkout failed.' }
      }
      return { ok: true, merchOrderId: result.order.id }
    }
    default: {
      const _exhaustive: never = fulfillment
      return { ok: false, error: `Unknown fulfillment kind: ${String(_exhaustive)}` }
    }
  }
}
