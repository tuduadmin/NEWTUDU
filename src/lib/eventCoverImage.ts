export const EVENT_COVER_GRADIENT_PREFIX = 'gradient:'

export type EventCoverGradientId =
  | 'emerald-gold'
  | 'sunset-warm'
  | 'dusk-purple'
  | 'ocean-teal'
  | 'rose-blush'
  | 'midnight-blue'

export type EventCoverGradient = {
  id: EventCoverGradientId
  label: string
  css: string
}

export const EVENT_COVER_GRADIENTS: EventCoverGradient[] = [
  {
    id: 'emerald-gold',
    label: 'Emerald & gold',
    css: 'linear-gradient(145deg, #0d9488 0%, #ca8a04 100%)',
  },
  {
    id: 'sunset-warm',
    label: 'Sunset warm',
    css: 'linear-gradient(135deg, #f68e5d 0%, #d94a7a 50%, #c02e8d 100%)',
  },
  {
    id: 'dusk-purple',
    label: 'Dusk purple',
    css: 'linear-gradient(160deg, #4c1d95 0%, #7c3aed 45%, #c026a0 100%)',
  },
  {
    id: 'ocean-teal',
    label: 'Ocean teal',
    css: 'linear-gradient(145deg, #0e7490 0%, #2563eb 100%)',
  },
  {
    id: 'rose-blush',
    label: 'Rose blush',
    css: 'linear-gradient(145deg, #fda4af 0%, #f472b6 55%, #c026a0 100%)',
  },
  {
    id: 'midnight-blue',
    label: 'Midnight blue',
    css: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 55%, #312e81 100%)',
  },
]

export type EventCoverStockImage = {
  id: string
  label: string
  url: string
}

/** Curated royalty-free event-themed stock picks (Unsplash). */
export const EVENT_COVER_STOCK_IMAGES: EventCoverStockImage[] = [
  {
    id: 'concert-crowd',
    label: 'Concert crowd',
    url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  },
  {
    id: 'festival-lights',
    label: 'Festival lights',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
  },
  {
    id: 'outdoor-gathering',
    label: 'Outdoor gathering',
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  },
  {
    id: 'live-music',
    label: 'Live music',
    url: 'https://images.unsplash.com/photo-1459749411175-04bf9262ceea?w=800&q=80',
  },
  {
    id: 'community-market',
    label: 'Community market',
    url: 'https://images.unsplash.com/photo-1555529665-e79e65c88a0c?w=800&q=80',
  },
  {
    id: 'food-festival',
    label: 'Food festival',
    url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  },
  {
    id: 'workshop',
    label: 'Workshop',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  },
  {
    id: 'sports-event',
    label: 'Sports event',
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607cd9385?w=800&q=80',
  },
]

export function isEventCoverGradient(value: string): boolean {
  return value.startsWith(EVENT_COVER_GRADIENT_PREFIX)
}

export function getEventCoverGradientToken(id: EventCoverGradientId): string {
  return `${EVENT_COVER_GRADIENT_PREFIX}${id}`
}

export function parseEventCoverGradient(value: string): EventCoverGradient | null {
  if (!isEventCoverGradient(value)) return null
  const id = value.slice(EVENT_COVER_GRADIENT_PREFIX.length) as EventCoverGradientId
  return EVENT_COVER_GRADIENTS.find((g) => g.id === id) ?? null
}

export function getEventCoverGradientCss(value: string): string | null {
  return parseEventCoverGradient(value)?.css ?? null
}

export function isEventCoverFilled(value: string): boolean {
  return value.trim() !== ''
}

export function getEventCoverLabel(value: string): string {
  const gradient = parseEventCoverGradient(value)
  if (gradient) return gradient.label
  const stock = EVENT_COVER_STOCK_IMAGES.find((img) => img.url === value)
  if (stock) return stock.label
  if (value.startsWith('data:')) return 'Uploaded photo'
  if (value.trim()) return 'Custom image'
  return 'Not set'
}

export type EventCoverRenderProps = {
  background?: string
  src?: string
}

/** Resolve coverImage string to either a gradient background or image src. */
export function getEventCoverRenderProps(value: string): EventCoverRenderProps | null {
  if (!value.trim()) return null
  const css = getEventCoverGradientCss(value)
  if (css) return { background: css }
  return { src: value }
}
