/** Client-safe payment configuration (Vite env). */

export function getStripePublishableKey(): string {
  return (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined)?.trim() ?? ''
}

export function getPaymentsApiBaseUrl(): string {
  return (import.meta.env.VITE_PAYMENTS_API_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''
}

/** True when publishable key + API base are set — UI enables “Pay with Stripe”. */
export function isStripeCheckoutConfigured(): boolean {
  return Boolean(getStripePublishableKey() && getPaymentsApiBaseUrl())
}

/** Demo / local fulfillment when Stripe is not wired yet. */
export function isDemoPaymentsMode(): boolean {
  return !isStripeCheckoutConfigured()
}

export const PAYMENTS_CHECKOUT_PATH = '/checkout/session'
