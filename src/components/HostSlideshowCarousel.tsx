import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MediaTile from './MediaTile'
import type { SlideshowSlide } from '../lib/hostSlideshows'

type HostSlideshowCarouselProps = {
  slides: SlideshowSlide[]
  autoAdvanceMs?: number
  className?: string
}

export default function HostSlideshowCarousel({
  slides,
  autoAdvanceMs = 5000,
  className = '',
}: HostSlideshowCarouselProps) {
  const [index, setIndex] = useState(0)
  const sorted = [...slides].sort((a, b) => a.order - b.order)

  useEffect(() => {
    setIndex(0)
  }, [slides])

  useEffect(() => {
    if (sorted.length <= 1 || autoAdvanceMs <= 0) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % sorted.length)
    }, autoAdvanceMs)
    return () => window.clearInterval(timer)
  }, [sorted.length, autoAdvanceMs])

  if (sorted.length === 0) {
    return (
      <div
        className={`flex aspect-[16/9] items-center justify-center rounded-[14px] border border-dashed border-brown/15 bg-cream/60 text-sm text-brown-muted ${className}`}
      >
        No slideshow slides yet
      </div>
    )
  }

  const current = sorted[index]

  return (
    <div className={`relative overflow-hidden rounded-[14px] ${className}`}>
      <div className="relative aspect-[16/9] bg-black">
        <MediaTile
          src={current.mediaUrl}
          videoUrl={current.mediaType === 'video' ? current.mediaUrl : undefined}
          mediaType={current.mediaType}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
        />
        {current.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-sm font-medium text-white">{current.caption}</p>
            {current.link && (
              <a
                href={current.link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-semibold text-orange no-underline"
              >
                Learn more â†’
              </a>
            )}
          </div>
        )}
      </div>

      {sorted.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((current) => (current - 1 + sorted.length) % sorted.length)}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % sorted.length)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white"
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {sorted.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={`h-1.5 rounded-[14px] transition ${
                  slideIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/45'
                }`}
                aria-label={`Go to slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
