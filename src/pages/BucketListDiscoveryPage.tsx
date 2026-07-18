import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import AvatarStoryRing from '../components/AvatarStoryRing'
import BottomNav from '../components/BottomNav'
import BucketListCoverCard from '../components/BucketListCoverCard'
import Toast from '../components/Toast'
import {
  copyPublicListToMine,
  getDiscoveryFeedLists,
  type PublicBucketList,
} from '../lib/bucketLists'

const SWIPE_THRESHOLD = 60

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export default function BucketListDiscoveryPage() {
  const navigate = useNavigate()
  const [lists] = useState<PublicBucketList[]>(() => getDiscoveryFeedLists())
  const [index, setIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [dragX, setDragX] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const current = lists[index % lists.length]
  const next = lists[(index + 1) % lists.length]

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % lists.length)
    setDragX(0)
  }, [lists.length])

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + lists.length) % lists.length)
    setDragX(0)
  }, [lists.length])

  function handleSaveList(list: PublicBucketList) {
    const copy = copyPublicListToMine(list)
    triggerHaptic([8, 40, 8])
    setToast(`Copied "${copy.name}" to your lists`)
    // Haptic recommendation: success notification on list copy
  }

  function handleShare(list: PublicBucketList) {
    triggerHaptic(6)
    const text = `NOW YOU KNOW — check out "${list.name}" on TUDU`
    if (navigator.share) {
      void navigator.share({ title: list.name, text, url: window.location.href })
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    setDragX(e.touches[0].clientX - touchStart.current.x)
  }

  function onTouchEnd() {
    if (!touchStart.current) return
    touchStart.current = null
    if (dragX < -SWIPE_THRESHOLD) {
      triggerHaptic(8)
      goNext()
      return
    }
    if (dragX > SWIPE_THRESHOLD) {
      triggerHaptic(8)
      goPrev()
      return
    }
    setDragX(0)
  }

  if (!current) {
    return (
      <div className="mx-auto min-h-svh max-w-[430px] bg-midnight pb-28">
        <EmptyFeed />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative mx-auto min-h-svh max-w-[430px] bg-midnight pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <AppHeaderBar />

      <div className="flex items-center justify-between px-4 pb-2 pt-2">
        <button
          type="button"
          onClick={() => navigate('/bucket-list?tab=discover')}
          className="flex h-11 min-w-[44px] items-center gap-1 font-display text-sm font-semibold text-white/80"
        >
          ← Lists
        </button>
        <div className="text-center">
          <p className="text-tagline">Now you know</p>
          <h1 className="font-display text-base font-bold text-white">Discover Lists</h1>
        </div>
        <span className="min-w-[44px] text-right font-display text-[11px] font-bold text-white/50">
          {index + 1}/{lists.length}
        </span>
      </div>

      <main
        className="relative px-4 pt-2"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <p className="mb-4 text-center text-xs text-white/45">
          Swipe album covers · Double-tap to save · Tap to open
        </p>

        <div className="relative mx-auto h-[min(72vh,620px)] max-w-[390px]">
          {next && (
            <div className="absolute inset-x-3 top-4 bottom-4 scale-[0.94] opacity-40" aria-hidden>
              <BucketListCoverCard list={next} />
            </div>
          )}
          <div
            className="relative z-10 transition-transform duration-240"
            style={{
              transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`,
            }}
            onDoubleClick={() => handleSaveList(current)}
          >
            <BucketListCoverCard
              list={current}
              onOpen={() => navigate(`/bucket-list/${current.id}`)}
              onSaveList={() => handleSaveList(current)}
              onShare={() => handleShare(current)}
            />
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-[390px] items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-12 flex-1 items-center justify-center rounded-full glass-surface font-display text-sm font-bold text-white"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => navigate(`/bucket-list/${current.id}`)}
            className="flex h-12 flex-[1.4] items-center justify-center rounded-full bg-gradient-tudu font-display text-sm font-bold text-white glow-warm"
          >
            Open List
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-12 flex-1 items-center justify-center rounded-full glass-surface font-display text-sm font-bold text-white"
          >
            Next →
          </button>
        </div>

        <div className="mx-auto mt-6 flex max-w-[390px] items-center gap-3 rounded-[var(--radius-xl)] glass-surface p-4">
          <AvatarStoryRing
            initials={current.ownerInitials}
            imageUrl={current.ownerAvatarUrl}
            size={48}
            verified={current.ownerVerified}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-white">{current.ownerName}</p>
            <p className="text-xs text-white/50">{current.description}</p>
          </div>
        </div>
      </main>

      <BottomNav />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} dark />}
    </div>
  )
}

function EmptyFeed() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-tagline">Now you know</p>
      <h2 className="mt-2 font-display text-xl font-bold text-white">No lists to discover yet</h2>
      <p className="mt-2 text-sm text-white/50">Check back soon for community bucket lists.</p>
    </div>
  )
}
