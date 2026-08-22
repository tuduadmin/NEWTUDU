export type SlideshowSlide = {
  id: string
  mediaType: 'image' | 'video'
  mediaUrl: string
  caption?: string
  link?: string
  order: number
}

export type HostSlideshow = {
  orgId: string
  slides: SlideshowSlide[]
  updatedAt: string
}

const STORAGE_KEY = 'tudu_host_slideshows'

export class SlideshowStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SlideshowStorageError'
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Storage key for a personal host's slideshow (matches public profile loader). */
export function getPersonalSlideshowKey(email: string): string {
  return `personal:${normalizeEmail(email)}`
}

function readAll(): Record<string, HostSlideshow> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, HostSlideshow>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, HostSlideshow>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22)
    ) {
      throw new SlideshowStorageError(
        'Storage is full. Try removing slides or using smaller images and videos.',
      )
    }
    throw new SlideshowStorageError('Could not save slideshow. Please try again.')
  }
}

function generateSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function normalizeSlides(slides: SlideshowSlide[]): SlideshowSlide[] {
  return slides
    .filter((slide) => slide.mediaUrl.trim())
    .map((slide, index) => ({
      id: slide.id || generateSlideId(),
      mediaType: slide.mediaType ?? 'image',
      mediaUrl: slide.mediaUrl.trim(),
      caption: slide.caption?.trim() || undefined,
      link: slide.link?.trim() || undefined,
      order: index,
    }))
}

export function getHostSlideshow(orgId: string): HostSlideshow | undefined {
  return readAll()[orgId]
}

export function getHostSlideshowSlides(orgId: string): SlideshowSlide[] {
  const slideshow = getHostSlideshow(orgId)
  if (!slideshow) return []
  return [...slideshow.slides].sort((a, b) => a.order - b.order)
}

export function saveHostSlideshow(storageKey: string, slides: SlideshowSlide[]): HostSlideshow {
  const normalized = normalizeSlides(slides)
  const slideshow: HostSlideshow = {
    orgId: storageKey,
    slides: normalized,
    updatedAt: new Date().toISOString(),
  }

  const all = readAll()
  all[storageKey] = slideshow
  writeAll(all)
  return slideshow
}

export function deleteHostSlideshow(orgId: string): void {
  const all = readAll()
  delete all[orgId]
  writeAll(all)
}

export function emptySlide(order = 0): SlideshowSlide {
  return {
    id: generateSlideId(),
    mediaType: 'image',
    mediaUrl: '',
    caption: '',
    link: '',
    order,
  }
}

export function reorderSlides(slides: SlideshowSlide[], fromIndex: number, toIndex: number): SlideshowSlide[] {
  const next = [...slides]
  const [moved] = next.splice(fromIndex, 1)
  if (!moved) return slides
  next.splice(toIndex, 0, moved)
  return next.map((slide, index) => ({ ...slide, order: index }))
}
