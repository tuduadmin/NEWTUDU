import type { PaymentFulfillment } from './types'

const PENDING_KEY = 'tudu_pending_merch_fulfillment'

export function stashPendingMerchFulfillment(
  fulfillment: Extract<PaymentFulfillment, { kind: 'merch_order' }>,
): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(fulfillment))
  } catch {
    /* ignore */
  }
}

export function consumePendingMerchFulfillment():
  | Extract<PaymentFulfillment, { kind: 'merch_order' }>
  | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PENDING_KEY)
    const parsed = JSON.parse(raw) as Extract<PaymentFulfillment, { kind: 'merch_order' }>
    if (parsed?.kind !== 'merch_order' || !parsed.eventId || !parsed.lines?.length) return null
    return parsed
  } catch {
    return null
  }
}
