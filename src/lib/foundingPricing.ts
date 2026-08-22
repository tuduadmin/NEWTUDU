import type { FoundingPricingConfig } from './tierConfig'

export type FoundingOfferId = 'explorer' | 'pioneer' | 'trusted' | 'hiddenGem' | 'extraEvent'

const FOUNDING_CLAIMS_KEY = 'tudu-founding-claims'

type FoundingClaims = Partial<Record<FoundingOfferId, number>>

function readClaims(): FoundingClaims {
  try {
    const raw = localStorage.getItem(FOUNDING_CLAIMS_KEY)
    return raw ? (JSON.parse(raw) as FoundingClaims) : {}
  } catch {
    return {}
  }
}

function writeClaims(claims: FoundingClaims): void {
  localStorage.setItem(FOUNDING_CLAIMS_KEY, JSON.stringify(claims))
}

export function getFoundingSlotsClaimed(offerId: FoundingOfferId): number {
  return readClaims()[offerId] ?? 0
}

export function getFoundingSlotsRemaining(
  offerId: FoundingOfferId,
  offer: FoundingPricingConfig,
): number {
  if (!offer.enabled) return 0
  return Math.max(0, offer.maxSlots - getFoundingSlotsClaimed(offerId))
}

/** Demo checkout — increment claimed founding slot (localStorage stub until Stripe). */
export function claimFoundingSlot(offerId: FoundingOfferId): void {
  const claims = readClaims()
  claims[offerId] = (claims[offerId] ?? 0) + 1
  writeClaims(claims)
}

export function resetFoundingClaims(): void {
  localStorage.removeItem(FOUNDING_CLAIMS_KEY)
}

export function setFoundingSlotsClaimed(offerId: FoundingOfferId, count: number): void {
  const claims = readClaims()
  claims[offerId] = Math.max(0, count)
  writeClaims(claims)
}

export function formatFoundingHeadline(
  offer: FoundingPricingConfig,
  offerId: FoundingOfferId,
): string {
  if (!offer.enabled) return ''
  const remaining = Math.max(0, offer.maxSlots - getFoundingSlotsClaimed(offerId))
  if (remaining <= 0) return 'Standard pricing — founding cohort full'
  const slots = `${remaining.toLocaleString()} of ${offer.maxSlots.toLocaleString()} founding spots left`
  return `${offer.headline} · ${slots}`
}

export function isFoundingOfferActive(
  offer: FoundingPricingConfig,
  offerId: FoundingOfferId,
): boolean {
  if (!offer.enabled) return false
  return getFoundingSlotsClaimed(offerId) < offer.maxSlots
}
