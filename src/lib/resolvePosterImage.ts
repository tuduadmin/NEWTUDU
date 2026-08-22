import type { HostEvent } from './account'
import {
  getEventCoverRenderProps,
  isEventCoverGradient,
  type EventCoverRenderProps,
} from './eventCoverImage'

/** First usable cover or photo for poster background. */
export function resolvePosterImageSource(
  event: HostEvent,
  customImageUrl?: string | null,
): EventCoverRenderProps & { hasRealPhoto: boolean } {
  if (customImageUrl?.trim()) {
    return { src: customImageUrl.trim(), hasRealPhoto: true }
  }

  const candidates = (event.photos ?? []).map((p) => p?.trim()).filter(Boolean) as string[]

  for (const photo of candidates) {
    const props = getEventCoverRenderProps(photo)
    if (props?.src) {
      return { ...props, hasRealPhoto: true }
    }
  }

  for (const photo of candidates) {
    if (isEventCoverGradient(photo)) {
      const props = getEventCoverRenderProps(photo)
      if (props?.background) {
        return { ...props, hasRealPhoto: false }
      }
    }
  }

  return {
    background: 'linear-gradient(135deg, #f68e5d 0%, #d94a7a 50%, #c02e8d 100%)',
    hasRealPhoto: false,
  }
}
