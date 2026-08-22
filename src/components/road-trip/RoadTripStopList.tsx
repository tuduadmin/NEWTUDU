import { Bookmark, Trash2 } from 'lucide-react'
import type { DiscoverEvent } from '../../data/discoverEvents'
import RoadTripEventsCarousel from './RoadTripEventsCarousel'

type RoadTripStopListProps = {
  stops: DiscoverEvent[]
  readOnly?: boolean
  onDeleteStop?: (eventId: string) => void
  onMoveToBucketList?: (eventId: string, title: string) => void
}

export default function RoadTripStopList({
  stops,
  readOnly = false,
  onDeleteStop,
  onMoveToBucketList,
}: RoadTripStopListProps) {
  const showActions = !readOnly && (onDeleteStop || onMoveToBucketList)

  return (
    <RoadTripEventsCarousel
      events={stops}
      readOnly={readOnly}
      renderSlideFooter={
        showActions
          ? (stop) => (
              <div className="flex">
                {onMoveToBucketList && (
                  <button
                    type="button"
                    onClick={() => onMoveToBucketList(stop.id, stop.title)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-brown transition hover:bg-orange/5"
                  >
                    <Bookmark size={14} className="text-purple" />
                    Move to Bucket List
                  </button>
                )}
                {onDeleteStop && (
                  <button
                    type="button"
                    onClick={() => onDeleteStop(stop.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 border-l border-app-subtle py-2.5 text-xs font-semibold text-maroon transition hover:bg-maroon/5"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            )
          : undefined
      }
    />
  )
}
