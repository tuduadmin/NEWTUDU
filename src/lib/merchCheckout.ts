import {
  createMerchOrderWithValidation,
  type CreateMerchOrderInput,
  type MerchOrder,
} from './eventMerch'
import { notifyMerchOrderReceived } from './merchOrderNotifications'
import {
  DEFAULT_MERCH_FEE_MODE,
  summarizeMerchCheckout as summarizeMerchCheckoutWithMode,
  type MerchCheckoutSummary,
  type MerchFeeMode,
} from './merchPricing'

export type { MerchCheckoutSummary, MerchFeeMode } from './merchPricing'

export function summarizeMerchCheckout(
  lines: CreateMerchOrderInput['lines'],
  feeMode: MerchFeeMode = DEFAULT_MERCH_FEE_MODE,
): MerchCheckoutSummary {
  return summarizeMerchCheckoutWithMode(lines, feeMode)
}

/** Create order and send confirmation — call only after payment succeeds (demo fulfill or Stripe webhook). */
export function completeMerchCheckout(
  input: CreateMerchOrderInput,
): { ok: true; order: MerchOrder } | { ok: false; error: string } {
  const result = createMerchOrderWithValidation(input)
  if (!result.ok) return result
  notifyMerchOrderReceived(result.order)
  return result
}
