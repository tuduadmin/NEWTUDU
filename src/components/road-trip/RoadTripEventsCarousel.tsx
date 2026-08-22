import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, MapPin } from 'lucide-react'
import type { DiscoverEvent } from '../../data/discoverEvents'

type RoadTripEventsCarouselProps = {
  events: DiscoverEvent[]
  visitedStopIds?: string[]
  readOnly?: boolean
  emptyMessage?: string
  renderSlideFooter?: (event: DiscoverEvent, index: number) => ReactNode
}

export default function RoadTripEventsCarousel({
  events,
  visitedStopIds = [],
  readOnly = false,
  emptyMessage = 'No events on this trip yet',
  renderSlideFooter,
}: RoadTripEventsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const syncIndex = useCallback(() => {
    const el = scrollRef.current
    if (!el || events.length <= 1) return
    const width = el.clientWidth
    if (width <= 0) return
    setActiveIndex(Math.round(el.scrollLeft / width))
  }, [events.length])

  function scrollTo(index: number) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
    setActiveIndex(index)
  }

  if (events.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-brown/15 bg-cream-dark/40 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-brown">{emptyMessage}</p>
        {!readOnly && (
          <p className="mt-1 text-xs text-brown-muted">
            Add saved events or find more along your route.
          </p>
        )}
      </div>
    )
  }

  const activeEvent = events[activeIndex]

  return (
    <article className="overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={syncIndex}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Trip events"
        >
          {events.map((event, index) => {
            const isVisited = visitedStopIds.includes(event.id)
            return (
            <div key={event.id} className="w-full shrink-0 snap-center">
              <div className="relative aspect-[16/10] overflow-hidden bg-cream-dark">
                <img
                  src={event.image}
                  alt=""
                  className={`h-full w-full object-cover transition ${isVisited ? 'brightness-75 saturate-50' : ''}`}
                />
                <div className="overlay-readability absolute inset-0" />
                <span
                  className={`absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow ${
                    isVisited ? 'bg-success' : 'bg-gradient-tudu'
                  }`}
                >
                  {isVisited ? <CheckCircle2 size={16} aria-hidden /> : index + 1}
                </span>
                {isVisited && (
                  <span className="absolute right-3 top-3 rounded-[14px] bg-success/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Visited
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3
                    className={`font-display text-base font-extrabold leading-tight text-white ${
                      isVisited ? 'line-through decoration-white/50' : ''
                    }`}
                  >
                    {event.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-white/85">
                    <MapPin size={12} className="shrink-0 text-orange" />
                    {event.city}
                    {event.dateTag ? ` · ${event.dateTag}` : ''}
                  </p>
                </div>
              </div>
            </div>
          )})}
        </div>

        {events.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-30"
              aria-label="Previous event"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(events.length - 1, activeIndex + 1))}
              disabled={activeIndex === events.length - 1}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-30"
              aria-label="Next event"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {events.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-app-subtle py-2.5">
          {events.map((event, index) => (
            <button
              key={event.id}
              type="button"
              onClick={() => scrollTo(index)}
              className={`h-1.5 rounded-[14px] transition-all ${
                visitedStopIds.includes(event.id)
                  ? 'w-3 bg-success'
                  : index === activeIndex
                    ? 'w-5 bg-orange'
                    : 'w-1.5 bg-brown/20'
              }`}
              aria-label={`Go to ${event.title}`}
            />
          ))}
        </div>
      )}

      {renderSlideFooter && activeEvent && (
        <div className="border-t border-app-subtle">{renderSlideFooter(activeEvent, activeIndex)}</div>
      )}
    </article>
  )
}
