import type { BillingCycle } from '../tierPricing'
import type { OrgPlanId, UserPlanId } from '../tierConfig'
import type { MerchOrderLine } from '../eventMerch'
import type { ResolvedTicketCartLine } from '../ticketCheckout'

/** Internal product key — maps to Stripe Price / Checkout metadata on the server. */
export type PaymentProductKind =
  | 'subscription_user'
  | 'subscription_org'
  | 'extra_event_slots'
  | 'hidden_gem_slots'
  | 'event_boost'
  | 'travel_pass'
  | 'ticket_order'
  | 'merch_order'

export type PaymentFulfillment =
  | {
      kind: 'subscription_user'
      planId: UserPlanId
      billingCycle: BillingCycle
    }
  | {
      kind: 'subscription_org'
      planId: OrgPlanId
      billingCycle: BillingCycle
    }
  | {
      kind: 'extra_event_slots'
      email: string
      slots: number
    }
  | {
      kind: 'hidden_gem_slots'
      orgId: string
      slots: number
    }
    | {
      kind: 'ticket_order'
      eventId: string
      attendeeEmail: string
      attendeeName: string
      lines: ResolvedTicketCartLine[]
    }
  | {
      kind: 'merch_order'
      eventId: string
      userEmail: string
      holderName: string
      ticketId?: string
      lines: MerchOrderLine[]
    }

export type CheckoutLineItem = {
  label: string
  amountCad: number
}

/** Payload sent to POST /checkout/session when Stripe is live. */
export type CheckoutSessionRequest = {
  kind: PaymentProductKind
  currency: 'cad' | 'usd'
  lineItems: CheckoutLineItem[]
  totalCad: number
  /** Stripe mode hint for the API route. */
  mode: 'payment' | 'subscription'
  metadata: Record<string, string>
}

export type FulfillmentResult =
  | { ok: true; merchOrderId?: string }
  | { ok: false; error: string }

export type StartCheckoutResult =
  | { mode: 'demo' }
  | { mode: 'redirect'; url: string }
  | { mode: 'error'; error: string }
