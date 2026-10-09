import { getCurrentUser } from '../auth'
import { buildCheckoutSessionRequest } from './catalog'
import { getPaymentsApiBaseUrl, isStripeCheckoutConfigured, PAYMENTS_CHECKOUT_PATH } from './config'
import { fulfillPayment } from './fulfillment'
import { stashPendingMerchFulfillment } from './pendingMerchCheckout'
import type { PaymentFulfillment, StartCheckoutResult } from './types'

export async function startCheckoutSession(fulfillment: PaymentFulfillment): Promise<StartCheckoutResult> {
  if (!isStripeCheckoutConfigured()) {
    return { mode: 'demo' }
  }

  let request
  try {
    request = buildCheckoutSessionRequest(fulfillment)
  } catch (err) {
    return {
      mode: 'error',
      error: err instanceof Error ? err.message : 'Invalid checkout request.',
    }
  }

  const user = getCurrentUser()
  const apiBase = getPaymentsApiBaseUrl()

  try {
    const res = await fetch(`${apiBase}${PAYMENTS_CHECKOUT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...request,
        customerEmail: user?.email ?? undefined,
      }),
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      return {
        mode: 'error',
        error: body?.error ?? `Checkout failed (${res.status}).`,
      }
    }

    const data = (await res.json()) as { url?: string }
    if (!data.url?.trim()) {
      return { mode: 'error', error: 'Checkout session did not return a URL.' }
    }
    return { mode: 'redirect', url: data.url.trim() }
  } catch {
    return { mode: 'error', error: 'Could not reach the payments server.' }
  }
}

/** Demo fulfillment only (used when Stripe is off or dev “demo fulfill” button). */
export async function runCheckoutFlow(
  fulfillment: PaymentFulfillment,
): Promise<StartCheckoutResult> {
  const result = fulfillPayment(fulfillment)
  if (!result.ok) {
    return { mode: 'error', error: result.error }
  }
  return { mode: 'demo' }
}

export type BeginPaidCheckoutOutcome =
  | { outcome: 'redirect' }
  | { outcome: 'demo_ok'; merchOrderId?: string }
  | { outcome: 'error'; error: string }

/** Production entry: Stripe when configured, otherwise local demo fulfillment. */
export async function beginPaidCheckout(
  fulfillment: PaymentFulfillment,
): Promise<BeginPaidCheckoutOutcome> {
  if (isStripeCheckoutConfigured()) {
    if (fulfillment.kind === 'merch_order') {
      stashPendingMerchFulfillment(fulfillment)
    }
    const started = await startCheckoutSession(fulfillment)
    if (started.mode === 'redirect') {
      window.location.href = started.url
      return { outcome: 'redirect' }
    }
    return { outcome: 'error', error: started.error ?? 'Checkout failed.' }
  }
  const result = fulfillPayment(fulfillment)
  if (!result.ok) {
    return { outcome: 'error', error: result.error }
  }
  return { outcome: 'demo_ok', merchOrderId: result.merchOrderId }
}
