/** How buyer-facing prices relate to TUDU + Stripe fees. */
export type MerchFeeMode = 'fees_on_top' | 'fees_included'

export const DEFAULT_MERCH_FEE_MODE: MerchFeeMode = 'fees_on_top'

export const MERCH_FEE_MODE_OPTIONS: {
  id: MerchFeeMode
  label: string
  description: string
}[] = [
  {
    id: 'fees_on_top',
    label: 'List price + fees',
    description:
      'Buyers pay your item price plus TUDU ($0.49 per item) and Stripe card processing at checkout.',
  },
  {
    id: 'fees_included',
    label: 'Fees included',
    description:
      'The price you set is what buyers pay. TUDU and Stripe fees are deducted from your payout.',
  },
]

export function normalizeMerchFeeMode(value: unknown): MerchFeeMode {
  return value === 'fees_included' ? 'fees_included' : 'fees_on_top'
}

export function getEventMerchFeeMode(
  event: { merchFeeMode?: MerchFeeMode | string | null | undefined } | null | undefined,
): MerchFeeMode {
  return normalizeMerchFeeMode(event?.merchFeeMode)
}
