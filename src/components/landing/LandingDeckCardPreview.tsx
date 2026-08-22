import type { DiscoverEvent } from '../../data/discoverEvents'
import DiscoverEventCard from '../DiscoverEventCard'

type LandingDeckCardPreviewProps = {
  event: DiscoverEvent
  /** Trusted Host sample shows host row like Events Near You */
  showHostRow?: boolean
}

/** Single discover deck card with stacked shadow — as it appears in the swipe feed. */
export default function LandingDeckCardPreview({
  event,
  showHostRow = false,
}: LandingDeckCardPreviewProps) {
  return (
    <div className="relative pb-1 pt-2">
      <div
        className="pointer-events-none absolute inset-x-6 top-4 bottom-0 rounded-[14px] border border-brown/10 bg-[#0d111c] shadow-lg"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-3 top-2 bottom-0 rounded-[14px] border border-brown/15 bg-[#101626]"
        aria-hidden
      />
      <div className="relative">
        <DiscoverEventCard event={event} showHostRow={showHostRow} iconVariant="solid" />
      </div>
    </div>
  )
}
