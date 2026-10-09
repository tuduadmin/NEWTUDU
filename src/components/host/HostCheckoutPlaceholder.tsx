import { useEffect, useState } from 'react'
import { CreditCard, Lock, X } from 'lucide-react'
import GradientButton from '../GradientButton'
import { formatMoney } from '../../lib/tierPricing'
import {
  isStripeCheckoutConfigured,
  runCheckoutFlow,
  startCheckoutSession,
  type PaymentFulfillment,
} from '../../lib/payments'

export type HostCheckoutLineItem = {
  label: string
  amount: number
}

type HostCheckoutPlaceholderProps = {
  open: boolean
  onClose: () => void
  productName: string
  productDescription?: string
  lineItems: HostCheckoutLineItem[]
  totalAmount: number
  /** When true, "Complete purchase (demo)" applies the purchase locally. */
  demoEnabled?: boolean
  /** Preferred: single fulfillment path for demo + Stripe metadata. */
  fulfillment?: PaymentFulfillment
  onCompleteDemo?: () => void
  onCheckoutError?: (message: string) => void
}

type CheckoutStep = 'confirm' | 'payment'

export default function HostCheckoutPlaceholder({
  open,
  onClose,
  productName,
  productDescription,
  lineItems,
  totalAmount,
  demoEnabled = false,
  fulfillment,
  onCompleteDemo,
  onCheckoutError,
}: HostCheckoutPlaceholderProps) {
  const [step, setStep] = useState<CheckoutStep>('confirm')
  const [paying, setPaying] = useState(false)
  const stripeLive = isStripeCheckoutConfigured()

  useEffect(() => {
    if (open) setStep('confirm')
  }, [open, productName])

  if (!open) return null

  function handleClose() {
    setStep('confirm')
    onClose()
  }

  async function handleCompleteDemo() {
    if (fulfillment) {
      setPaying(true)
      const result = await runCheckoutFlow(fulfillment)
      setPaying(false)
      if (result.mode === 'error') {
        onCheckoutError?.(result.error)
        return
      }
      onCompleteDemo?.()
      handleClose()
      return
    }
    onCompleteDemo?.()
    handleClose()
  }

  async function handlePayWithStripe() {
    if (!fulfillment) {
      onCheckoutError?.('Checkout is not configured for this product yet.')
      return
    }
    setPaying(true)
    const result = await startCheckoutSession(fulfillment)
    setPaying(false)
    if (result.mode === 'redirect') {
      window.location.href = result.url
      return
    }
    if (result.mode === 'error') {
      onCheckoutError?.(result.error)
    }
  }

  const titleId = step === 'confirm' ? 'host-checkout-confirm-title' : 'host-checkout-payment-title'

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40"
        aria-label="Close checkout"
        onClick={handleClose}
      />
      <div
        className="fixed inset-0 z-[61] flex items-end justify-center p-4 sm:items-center"
        role="presentation"
      >
        <div
          className="flex w-full max-w-md max-h-[85vh] flex-col overflow-hidden rounded-[14px] border border-brown/10 bg-white p-5 shadow-float"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              {step === 'confirm' ? (
                <>
                  <h2 id={titleId} className="font-display text-lg font-bold text-brown">
                    Confirm purchase
                  </h2>
                  <p className="mt-1 text-xs text-brown-muted">
                    Review your selection before continuing to secure checkout.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-purple" aria-hidden />
                    <h2 id={titleId} className="font-display text-lg font-bold text-brown">
                      Secure checkout
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-brown-muted">
                    {stripeLive
                      ? 'You will complete payment on Stripe’s secure checkout page.'
                      : 'Beta: demo checkout applies your purchase in this browser only until Stripe is connected.'}
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[14px] p-1.5 text-brown-muted transition hover:bg-brown/5 hover:text-brown"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {step === 'confirm' ? (
              <div className="rounded-[14px] border border-brown/10 bg-cream/40 p-4">
                <p className="font-display text-base font-bold text-brown">{productName}</p>
                {productDescription && (
                  <p className="mt-1 text-xs text-brown-muted">{productDescription}</p>
                )}
                <p className="mt-3 text-xl font-bold text-purple">{formatMoney(totalAmount)} CAD</p>
                <p className="mt-2 text-[10px] text-brown-muted">One-time purchase | prices shown in CAD</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!stripeLive && (
                  <div className="rounded-[14px] border border-purple/20 bg-purple/5 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-purple">Beta checkout</p>
                    <p className="mt-0.5 text-xs text-brown-muted">
                      Set <code className="text-[10px]">VITE_STRIPE_PUBLISHABLE_KEY</code> and{' '}
                      <code className="text-[10px]">VITE_PAYMENTS_API_URL</code> to enable live payments.
                    </p>
                  </div>
                )}

                <div className="rounded-[14px] border border-brown/10 bg-cream/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Order summary</p>
                  <ul className="mt-3 space-y-2">
                    {lineItems.map((item) => (
                      <li key={item.label} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-brown">{item.label}</span>
                        <span className="shrink-0 font-semibold text-brown">{formatMoney(item.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-brown/10 pt-3">
                    <span className="font-display text-sm font-bold text-brown">Total</span>
                    <span className="font-display text-base font-bold text-purple">
                      {formatMoney(totalAmount)} CAD
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[14px] border border-brown/15 px-5 py-2.5 text-sm font-semibold text-brown transition hover:bg-brown/5"
            >
              Cancel
            </button>

            {step === 'confirm' ? (
              <GradientButton type="button" onClick={() => setStep('payment')} className="px-5 py-2.5">
                Continue to payment
              </GradientButton>
            ) : (
              <>
                {stripeLive && fulfillment && (
                  <GradientButton
                    type="button"
                    disabled={paying}
                    onClick={() => void handlePayWithStripe()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:order-3"
                  >
                    <CreditCard size={16} aria-hidden />
                    {paying ? 'Opening Stripe…' : 'Pay with Stripe'}
                  </GradientButton>
                )}
                {demoEnabled && !stripeLive && (
                  <GradientButton
                    type="button"
                    disabled={paying}
                    onClick={() => void handleCompleteDemo()}
                    className="px-5 py-2.5 sm:order-2"
                  >
                    {paying ? 'Processing…' : stripeLive ? 'Complete purchase' : 'Complete purchase (demo)'}
                  </GradientButton>
                )}
                {demoEnabled && stripeLive && fulfillment && (
                  <button
                    type="button"
                    disabled={paying}
                    onClick={() => void handleCompleteDemo()}
                    className="rounded-[14px] border border-brown/15 px-5 py-2.5 text-sm font-semibold text-brown-muted transition hover:bg-brown/5 sm:order-2"
                  >
                    Demo fulfill (dev)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
