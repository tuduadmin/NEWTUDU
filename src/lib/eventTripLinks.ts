import { getNextDisplayDate } from './eventSchedule'
import type { HostEvent } from './account'

import type { DiscoverEvent } from '../data/discoverEvents'

export type TripLinkContext = {
  city?: string
  province?: string
  venueName?: string
  streetAddress?: string
  checkInDate?: string
  checkOutDate?: string
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function tripLinkContextFromEvent(event: HostEvent, now = new Date()): TripLinkContext {
  const checkInDate = getNextDisplayDate(event, now)
  return {
    city: event.city?.trim() || undefined,
    province: event.province?.trim() || undefined,
    venueName: event.venueName?.trim() || undefined,
    streetAddress: event.streetAddress?.trim() || undefined,
    checkInDate: checkInDate || undefined,
    checkOutDate: checkInDate ? addDays(checkInDate, 1) : undefined,
  }
}

export function tripLinkContextFromDiscoverEvent(event: DiscoverEvent): TripLinkContext {
  return {
    city: event.city?.trim() || undefined,
    venueName: event.venueName?.trim() || undefined,
    streetAddress: event.streetAddress?.trim() || undefined,
  }
}

export function eventHasLodgingNearby(amenityIds?: string[]): boolean {
  return amenityIds?.includes('lodging') ?? false
}

import { getAffiliatePartner } from './affiliatePartners'

/** Expedia hotel search — campaign id from affiliate config or VITE_EXPEDIA_AFFILIATE_CAMPAIGN. */
export function buildLodgingUrl(ctx: TripLinkContext): string | null {
  if (!ctx.city) return null

  const destination = [ctx.city, ctx.province].filter(Boolean).join(', ')
  const params = new URLSearchParams({ destination })
  if (ctx.checkInDate) params.set('startDate', ctx.checkInDate)
  if (ctx.checkOutDate) params.set('endDate', ctx.checkOutDate)

  const expedia = getAffiliatePartner('expedia')
  const affiliateCampaign =
    expedia.paramValue?.trim() ||
    import.meta.env.VITE_EXPEDIA_AFFILIATE_CAMPAIGN?.trim()
  const paramName = expedia.paramName?.trim() || 'camref'
  if (affiliateCampaign && expedia.enabled) {
    params.set(paramName, affiliateCampaign)
  }

  return `https://www.expedia.com/Hotel-Search?${params.toString()}`
}

/** Opens Uber with drop-off at the event venue. */
export function buildUberUrl(ctx: TripLinkContext): string | null {
  const dropoff = [ctx.venueName, ctx.streetAddress, ctx.city, ctx.province].filter(Boolean).join(', ')
  if (!dropoff) return null

  const params = new URLSearchParams({
    action: 'setPickup',
    pickup: 'my_location',
    'dropoff[formatted_address]': dropoff,
  })
  if (ctx.venueName) {
    params.set('dropoff[nickname]', ctx.venueName)
  }

  return `https://m.uber.com/ul/?${params.toString()}`
}

export function hasTripAssistOptions(ctx: TripLinkContext): boolean {
  return buildLodgingUrl(ctx) != null || buildUberUrl(ctx) != null
}
