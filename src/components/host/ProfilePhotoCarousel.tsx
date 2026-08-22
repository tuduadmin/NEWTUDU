import { useCallback, useRef, useState } from 'react'

type ProfilePhotoCarouselProps = {
  images: string[]
  title: string
  aspectClass?: string
}

export default function ProfilePhotoCarousel({
  images,
  title,
  aspectClass = 'aspect-[4/5] sm:aspect-[16/10]',
}: ProfilePhotoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const syncIndex = useCallback(() => {
    const el = scrollRef.current
    if (!el || images.length <= 1) return
    const width = el.clientWidth
    if (width <= 0) return
    setActiveIndex(Math.round(el.scrollLeft / width))
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden bg-brown/5">
      <div
        ref={scrollRef}
        onScroll={syncIndex}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${title} profile photos`}
      >
        {images.map((src, index) => (
          <div key={`${src}-${index}`} className="w-full shrink-0 snap-center">
            <img
              src={src}
              alt={index === 0 ? title : `${title} photo ${index + 1}`}
              className={`${aspectClass} w-full object-cover`}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-[14px] transition-all ${
                index === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
