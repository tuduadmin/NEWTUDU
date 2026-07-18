import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Toast from '../components/Toast'
import { getBucketLists } from '../lib/bucketLists'
import {
  getCompletedStoryById,
  getDisplayLikeCount,
  isStoryLiked,
  saveStorySlideToList,
  spotifyEmbedUrl,
  toggleStoryLike,
  type CompletedStory,
} from '../lib/completedStories'

const SLIDE_DURATION_MS = 8000

export default function BucketListStoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<CompletedStory | undefined>()
  const [slideIndex, setSlideIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [showSoundtrack, setShowSoundtrack] = useState(false)
  const [pickListOpen, setPickListOpen] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const timerRef = useRef<number | null>(null)

  const refreshStory = useCallback(() => {
    if (!id) return
    const found = getCompletedStoryById(id)
    setStory(found)
    if (found) {
      setLiked(isStoryLiked(found.id))
      setLikeCount(getDisplayLikeCount(found))
    }
  }, [id])

  useEffect(() => {
    refreshStory()
  }, [refreshStory])

  const slideCount = story?.slides.length ?? 0
  const embedUrl = spotifyEmbedUrl(story?.spotifyUrl)

  const goNext = useCallback(() => {
    setSlideIndex((i) => {
      if (i >= slideCount - 1) return i
      return i + 1
    })
    setProgress(0)
  }, [slideCount])

  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i > 0 ? i - 1 : 0))
    setProgress(0)
  }, [])

  useEffect(() => {
    if (!story || slideCount === 0) return

    const tick = 50
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + (tick / SLIDE_DURATION_MS) * 100
        if (next >= 100) {
          setSlideIndex((i) => {
            if (i < slideCount - 1) return i + 1
            return i
          })
          return 0
        }
        return next
      })
    }, tick)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [story, slideIndex, slideCount])

  function handleTapZone(clientX: number, width: number) {
    if (clientX < width * 0.35) goPrev()
    else goNext()
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  function handleLike() {
    if (!story) return
    toggleStoryLike(story.id)
    refreshStory()
    setLiked(isStoryLiked(story.id))
    setLikeCount(getDisplayLikeCount(story))
  }

  async function handleShare() {
    if (!story) return
    const url = `${window.location.origin}/bucket-list/story/${story.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: story.name,
          text: `Check out ${story.ownerName}'s completed bucket list: ${story.name}`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      } catch {
        setToast('Could not share story')
      }
    }
  }

  function handleSaveToList(listId: string) {
    if (!story) return
    const result = saveStorySlideToList(story, slideIndex, listId)
    setPickListOpen(false)
    if (result) setToast(`Saved to "${result.listName}"`)
  }

  function handleSaveNewList() {
    if (!story) return
    const result = saveStorySlideToList(story, slideIndex)
    setPickListOpen(false)
    if (result) setToast(`Saved to new list "${result.listName}"`)
  }

  if (!id || !story) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-app-dark text-white">
        <h1 className="text-xl font-bold">Story not found</h1>
        <Link to="/bucket-list" className="mt-4 text-sm font-semibold text-orange no-underline">
          ← Back to Bucket Lists
        </Link>
      </div>
    )
  }

  const slide = story.slides[slideIndex]
  const bgImage = slide.completionPhoto ?? slide.image

  return (
    <div
      className="fixed inset-0 z-50 mx-auto max-w-lg bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={bgImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
      </div>

      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {story.slides.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white transition-all duration-100 ease-linear"
              style={{
                width:
                  i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-3 pt-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">
            {story.ownerInitials}
          </span>
          <div>
            <p className="text-sm font-bold text-white">{story.ownerName}</p>
            <p className="text-xs text-white/70">{story.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/bucket-list?tab=discover&discover=completed')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg text-white backdrop-blur-sm"
          aria-label="Close story"
        >
          ✕
        </button>
      </div>

      {/* Tap zones */}
      <button
        type="button"
        className="absolute inset-0 z-[1] cursor-default"
        aria-label="Story navigation"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          handleTapZone(e.clientX - rect.left, rect.width)
        }}
      />

      {/* Slide content */}
      <div className="pointer-events-none absolute bottom-36 left-0 right-0 z-10 px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange">
          {slide.city}
          {slide.completedAt && (
            <span className="ml-2 normal-case text-white/50">
              · {formatCompletedDate(slide.completedAt)}
            </span>
          )}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold text-white">{slide.title}</h2>
        {(slide.dateTime || slide.cost) && (
          <p className="mt-1 text-sm text-white/70">
            {[slide.dateTime, slide.cost].filter(Boolean).join(' · ')}
          </p>
        )}
        {slide.completionNote && (
          <p className="mt-3 text-sm leading-relaxed text-white/90">{slide.completionNote}</p>
        )}
      </div>

      {/* Soundtrack indicator */}
      <div className="absolute bottom-28 left-0 right-0 z-10 px-5">
        {embedUrl ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowSoundtrack((s) => !s)
            }}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
          >
            <span aria-hidden>🎵</span>
            {showSoundtrack ? 'Hide soundtrack' : 'Now playing · Spotify'}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm">
            <span aria-hidden>🎶</span>
            No soundtrack attached
          </div>
        )}
      </div>

      {showSoundtrack && embedUrl && (
        <div className="pointer-events-auto absolute bottom-36 left-4 right-4 z-20 overflow-hidden rounded-xl bg-black/80 ring-1 ring-white/10">
          <iframe
            title="Spotify soundtrack"
            src={embedUrl}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-0"
          />
        </div>
      )}

      {/* Action bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-white/10 bg-black/60 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <StoryAction
          icon={liked ? '❤️' : '🤍'}
          label={likeCount > 0 ? String(likeCount) : 'Like'}
          active={liked}
          onClick={(e) => {
            e.stopPropagation()
            handleLike()
          }}
        />
        <StoryAction
          icon="↗"
          label="Share"
          onClick={(e) => {
            e.stopPropagation()
            handleShare()
          }}
        />
        <StoryAction
          icon="🔖"
          label="Save"
          onClick={(e) => {
            e.stopPropagation()
            setPickListOpen(true)
          }}
        />
      </div>

      {pickListOpen && (
        <SaveToListModal
          onClose={() => setPickListOpen(false)}
          onSelect={handleSaveToList}
          onCreate={handleSaveNewList}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} dark />}
    </div>
  )
}

function StoryAction({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active?: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 text-xs font-semibold ${
        active ? 'text-red-400' : 'text-white'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      {label}
    </button>
  )
}

function SaveToListModal({
  onClose,
  onSelect,
  onCreate,
}: {
  onClose: () => void
  onSelect: (listId: string) => void
  onCreate: () => void
}) {
  const [lists] = useState(() => getBucketLists())

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="fixed bottom-8 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-tudu-lg bg-app-dark-elevated p-4 ring-1 ring-white/10">
        <h2 className="text-base font-bold text-white">Save to bucket list</h2>
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => onSelect(list.id)}
              className="flex w-full rounded-tudu border border-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white hover:border-orange/40"
            >
              {list.name}
            </button>
          ))}
          <button
            type="button"
            onClick={onCreate}
            className="w-full rounded-full border border-dashed border-white/20 py-2 text-sm font-semibold text-orange"
          >
            ＋ Create new list
          </button>
        </div>
      </div>
    </>
  )
}

function formatCompletedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
