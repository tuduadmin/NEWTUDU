import { calcMerchPlatformFee, MERCH_PLATFORM_FEE_CENTS } from './eventMerch'
import { DEFAULT_MERCH_FEE_MODE, type MerchFeeMode } from './merchFeeMode'
import { STRIPE_PROCESSING } from './tierPricing'

export type { MerchFeeMode } from './merchFeeMode'
export {
  DEFAULT_MERCH_FEE_MODE,
  MERCH_FEE_MODE_OPTIONS,
  getEventMerchFeeMode,
  normalizeMerchFeeMode,
} from './merchFeeMode'

export type MerchCheckoutSummary = {
  feeMode: MerchFeeMode
  itemCount: number
  /** Sum of line item prices (your list prices). */
  subtotalCents: number
  platformFeeCents: number
  stripeFeeCents: number
  totalCents: number
}

type MerchCheckoutLine = {
  quantity: number
  unitPriceCents: number
}

/** Stripe fee on a card charge (CAD cents). */
export function calcMerchStripeFeeCents(chargeCents: number): number {
  if (chargeCents <= 0) return 0
  return Math.ceil(
    chargeCents * (STRIPE_PROCESSING.percent / 100) + STRIPE_PROCESSING.fixedCents,
  )
}

export function summarizeMerchCheckout(
  lines: MerchCheckoutLine[],
  feeMode: MerchFeeMode = DEFAULT_MERCH_FEE_MODE,
): MerchCheckoutSummary {
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0)
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
  const platformFeeCents = calcMerchPlatformFee(itemCount)

  if (feeMode === 'fees_included') {
    const stripeFeeCents = calcMerchStripeFeeCents(subtotalCents)
    return {
      feeMode,
      itemCount,
      subtotalCents,
      platformFeeCents,
      stripeFeeCents,
      totalCents: subtotalCents,
    }
  }

  const preStripeCents = subtotalCents + platformFeeCents
  const stripeFeeCents = calcMerchStripeFeeCents(preStripeCents)
  return {
    feeMode,
    itemCount,
    subtotalCents,
    platformFeeCents,
    stripeFeeCents,
    totalCents: preStripeCents + stripeFeeCents,
  }
}

/** Single-item preview for host pricing fields. */
export function previewMerchSingleItemCheckout(
  listPriceCents: number,
  feeMode: MerchFeeMode,
): MerchCheckoutSummary {
  if (!Number.isFinite(listPriceCents) || listPriceCents < 0) {
    return summarizeMerchCheckout([], feeMode)
  }
  return summarizeMerchCheckout([{ unitPriceCents: listPriceCents, quantity: 1 }], feeMode)
}

export function estimateMerchHostNetPerItem(listPriceCents: number, feeMode: MerchFeeMode): number {
  const summary = previewMerchSingleItemCheckout(listPriceCents, feeMode)
  if (summary.itemCount === 0) return 0
  const buyerTotal = summary.totalCents
  const stripeOnCharge =
    feeMode === 'fees_included'
      ? calcMerchStripeFeeCents(buyerTotal)
      : summary.stripeFeeCents
  return Math.max(0, buyerTotal - stripeOnCharge - MERCH_PLATFORM_FEE_CENTS)
}
