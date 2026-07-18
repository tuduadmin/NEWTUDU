/**
 * TUDU brand voice — friendly, curious, approachable.
 * Technology as a gateway to real-world experiences; user agency first.
 * @see docs/TUDU-CHARACTER-DEVELOPMENT.md
 */

export const BRAND_VOICE = {
  tone: ['friendly', 'curious', 'approachable'] as const,
  principle:
    'Technology should act as a gateway to shared human experiences rather than a replacement for them.',
} as const

export type EmptyStateContext = 'saved' | 'tickets' | 'past' | 'discover' | 'bucket_list'

const EMPTY_STATE_COPY: Record<
  EmptyStateContext,
  { heading: string; body: string; cta?: string }
> = {
  saved: {
    heading: 'Nothing saved yet',
    body: 'Your next real-world moment is waiting to be discovered.',
    cta: 'Discover Events',
  },
  tickets: {
    heading: 'No tickets yet',
    body: 'Explore what\u2019s happening nearby and grab a spot.',
    cta: 'Discover Events',
  },
  past: {
    heading: 'No past events yet',
    body: 'The best stories start with showing up. Your history will live here.',
  },
  discover: {
    heading: 'Nothing nearby right now',
    body: 'Check back soon \u2014 adventure tends to show up when you look for it.',
  },
  bucket_list: {
    heading: 'Your bucket list is empty',
    body: 'Save experiences you want to chase someday. Coming soon.',
  },
}

export function getEmptyStateCopy(context: EmptyStateContext) {
  return EMPTY_STATE_COPY[context]
}
