import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MediaTile from '../MediaTile'
import type { SlideshowSlide } from '../../lib/hostSlideshows'

type PublicProfileMediaProps = {
  slides: SlideshowSlide[]
  highlightImages?: string[]
  className?: string
}

type MediaItem =
  | { kind: 'slide'; slide: SlideshowSlide }
  | { kind: 'image'; url: string }

function buildMediaItems(slides: SlideshowSlide[], highlightImages: string[]): MediaItem[] {
  if (slides.length > 0) {
    return [...slides]
      .sort((a, b) => a.order - b.order)
      .map((slide) => ({ kind: 'slide' as const, slide }))
  }
  return highlightImages.map((url) => ({ kind: 'image' as const, url }))
}

export default function PublicProfileMedia({
  slides,
  highlightImages = [],
  className = '',
}: PublicProfileMediaProps) {
  const [index, setIndex] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const items = buildMediaItems(slides, highlightImages)

  useEffect(() => {
    setIndex(0)
  }, [slides, highlightImages])

  if (items.length === 0) return null

  const current = items[index]

  function goPrev() {
    setIndex((currentIndex) => (currentIndex - 1 + items.length) % items.length)
  }

  function goNext() {
    setIndex((currentIndex) => (currentIndex + 1) % items.length)
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    if (dx > 0) goPrev()
    else goNext()
  }

  return (
    <section className={`px-4 ${className}`}>
      <div
        className="relative overflow-hidden rounded-[14px] border border-brown/10 bg-black shadow-sm"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative aspect-[4/5] sm:aspect-[16/10]">
          {current.kind === 'slide' ? (
            <>
              <MediaTile
                src={current.slide.mediaUrl}
                videoUrl={current.slide.mediaType === 'video' ? current.slide.mediaUrl : undefined}
                mediaType={current.slide.mediaType}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
              {current.slide.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-sm font-medium text-white">{current.slide.caption}</p>
                  {current.slide.link && (
                    <a
                      href={current.slide.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-orange no-underline"
                    >
                      Learn more â†’
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <img src={current.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white sm:flex"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white sm:flex"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {items.map((item, itemIndex) => (
                <button
                  key={item.kind === 'slide' ? item.slide.id : item.url}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  className={`h-1.5 rounded-[14px] transition ${
                    itemIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/45'
                  }`}
                  aria-label={`Go to slide ${itemIndex + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {items.length > 1 && (
        <p className="mt-2 text-center text-[11px] text-brown-muted sm:hidden">Swipe to browse</p>
      )}
    </section>
  )
}
