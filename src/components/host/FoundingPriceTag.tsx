import { formatMoney } from '../../lib/tierPricing'
import {
  formatFoundingHeadline,
  isFoundingOfferActive,
  type FoundingOfferId,
} from '../../lib/foundingPricing'
import type { FoundingPricingConfig } from '../../lib/tierConfig'

type FoundingPriceTagProps = {
  offer: FoundingPricingConfig
  offerId: FoundingOfferId
  foundingPrice: number
  standardPrice: number
  compact?: boolean
  /** e.g. "/mo" or "/yr" */
  suffix?: string
  showHeadline?: boolean
}

export function FoundingPriceRow({
  offer,
  offerId,
  foundingPrice,
  standardPrice,
  compact = false,
  suffix = '',
  showHeadline = true,
}: FoundingPriceTagProps) {
  const active = isFoundingOfferActive(offer, offerId)
  const displayPrice = active ? foundingPrice : standardPrice
  const showStrike = active && standardPrice > foundingPrice

  return (
    <div>
      <div className={`flex flex-wrap items-baseline gap-x-1.5 ${compact ? 'text-sm' : ''}`}>
        <span
          className={`font-display font-extrabold text-brown ${compact ? 'text-base' : 'text-2xl'}`}
        >
          {formatMoney(displayPrice)}
          {suffix}
        </span>
        {showStrike && (
          <span
            className={`font-normal text-brown-muted line-through ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {formatMoney(standardPrice)}
            {suffix}
          </span>
        )}
        {active && (
          <span
            className={`rounded-[14px] bg-orange/15 px-2 py-0.5 font-bold uppercase tracking-wide text-orange ${
              compact ? 'text-[8px]' : 'text-[9px]'
            }`}
          >
            Founding
          </span>
        )}
      </div>
      {showHeadline && active && offer.headline && (
        <p className={`mt-1 font-semibold text-orange ${compact ? 'text-[9px]' : 'text-xs'}`}>
          {formatFoundingHeadline(offer, offerId)}
        </p>
      )}
      {showHeadline && active && offer.grandfatherNote && (
        <p className={`mt-0.5 text-brown-muted ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          {offer.grandfatherNote}
        </p>
      )}
    </div>
  )
}

export function FoundingSectionBanner({
  offer,
  offerId,
  compact = false,
}: {
  offer: FoundingPricingConfig
  offerId: FoundingOfferId
  compact?: boolean
}) {
  if (!isFoundingOfferActive(offer, offerId)) return null

  return (
    <div
      className={`rounded-[14px] border border-orange/25 bg-orange/10 ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <p className={`font-bold text-orange ${compact ? 'text-[10px]' : 'text-xs'} uppercase tracking-wide`}>
        Founding rate
      </p>
      <p className={`mt-0.5 text-brown ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {formatFoundingHeadline(offer, offerId)}
      </p>
      {offer.grandfatherNote && (
        <p className={`mt-1 text-brown-muted ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          {offer.grandfatherNote}
        </p>
      )}
    </div>
  )
}
