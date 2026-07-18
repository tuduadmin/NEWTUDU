import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddToBucketListModal from '../components/AddToBucketListModal'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import SaveToBucketFlyAnimation from '../components/SaveToBucketFlyAnimation'
import Toast from '../components/Toast'
import { DISCOVER_EVENTS } from '../data/discoverEvents'
import { saveEvent } from '../lib/savedEvents'

const SWIPE_THRESHOLD = 80

type SwipeDirection = 'left' | 'right' | 'up' | null
type CardExit = SwipeDirection

function triggerHaptic(pattern: number | number[]) {
  // Haptic recommendation: use Expo Haptics on native; vibrate fallback on web
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [flyActive, setFlyActive] = useState(false)
  const [bucketGlow, setBucketGlow] = useState(false)
  const [cardExit, setCardExit] = useState<CardExit>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)

  const event = DISCOVER_EVENTS[index % DISCOVER_EVENTS.length]
  const progress = `${(index % DISCOVER_EVENTS.length) + 1} / ${DISCOVER_EVENTS.length}`

  const advanceCard = useCallback(() => {
    setHistory((prev) => [...prev, index])
    setIndex((i) => (i + 1) % DISCOVER_EVENTS.length)
    setExpanded(false)
    setCardExit(null)
    setDragOffset({ x: 0, y: 0 })
  }, [index])

  function handleSkip() {
    triggerHaptic(8)
    setCardExit('left')
    window.setTimeout(advanceCard, 240)
  }

  function handleDetails() {
    triggerHaptic(6)
    setExpanded((v) => !v)
  }

  function openSavePicker() {
    triggerHaptic(10)
    setShowPicker(true)
  }

  function handleSaveSuccess(listName: string) {
    setShowPicker(false)
    saveEvent(event.id)
    setFlyActive(true)
    setBucketGlow(true)
    triggerHaptic([10, 30, 10])
    setToast(`Saved to "${listName}"`)
    window.setTimeout(() => {
      setBucketGlow(false)
      setCardExit('right')
      window.setTimeout(advanceCard, 280)
    }, 520)
  }

  function handleFlyComplete() {
    setFlyActive(false)
  }

  function goBack() {
    if (history.length === 0) return
    triggerHaptic(6)
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setIndex(prev)
    setExpanded(false)
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() }
    setIsDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const t = e.touches[0]
    setDragOffset({
      x: t.clientX - touchStart.current.x,
      y: t.clientY - touchStart.current.y,
    })
  }

  function onTouchEnd() {
    if (!touchStart.current) return
    touchStart.current = null
    setIsDragging(false)

    const dx = dragOffset.x
    const dy = dragOffset.y

    if (dy < -SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      handleDetails()
      setDragOffset({ x: 0, y: 0 })
      return
    }

    if (dx > SWIPE_THRESHOLD) {
      openSavePicker()
      setDragOffset({ x: 0, y: 0 })
      return
    }

    if (dx < -SWIPE_THRESHOLD) {
      handleSkip()
      return
    }

    setDragOffset({ x: 0, y: 0 })
  }

  const rotate = isDragging ? dragOffset.x * 0.04 : 0
  const cardTransform = cardExit
    ? undefined
    : `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotate}deg)`

  const categoryLabel = event.categories?.[0]?.label ?? 'Experience'

  return (
    <div className="relative mx-auto min-h-svh max-w-[430px] bg-midnight pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <AppHeaderBar />

      <div className="absolute inset-x-0 top-[calc(52px+env(safe-area-inset-top))] z-[calc(var(--z-header)-1)] flex items-center justify-end gap-2 px-4 pb-2">
        <span className="rounded-full bg-white/10 px-3 py-1 font-display text-[11px] font-bold text-white/70">
          {progress}
        </span>
        <button
          type="button"
          onClick={() => navigate('/bucket-lists/discover')}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full glass-surface text-lg transition ${
            bucketGlow ? 'animate-bucket-glow glow-warm' : ''
          }`}
          aria-label="Browse bucket lists"
        >
          🪣
        </button>
      </div>

      <main className="relative flex min-h-svh flex-col px-3 pt-[calc(72px+env(safe-area-inset-top))]">
        <div className="relative mx-auto w-full flex-1">
          {/* Background stack hint */}
          <div
            className="absolute inset-x-2 top-3 bottom-8 rounded-[var(--radius-2xl)] bg-midnight-surface/80 ring-1 ring-white/5"
            aria-hidden
          />

          <article
            className={`relative mx-auto h-[min(calc(100svh-220px),640px)] w-full max-w-[390px] touch-pan-y overflow-hidden rounded-[var(--radius-2xl)] shadow-float ring-1 ring-white/10 ${
              cardExit === 'right'
                ? 'animate-swipe-right'
                : cardExit === 'left'
                  ? 'animate-swipe-left'
                  : cardExit === 'up'
                    ? 'animate-swipe-up'
                    : ''
            }`}
            style={{ transform: cardTransform, transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.2,0.8,0.2,1)' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="overlay-readability absolute inset-0" />

            {/* Swipe hints */}
            {isDragging && dragOffset.x > 30 && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-success/90 px-4 py-2 font-display text-sm font-bold text-white">
                SAVE
              </div>
            )}
            {isDragging && dragOffset.x < -30 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-error/90 px-4 py-2 font-display text-sm font-bold text-white">
                SKIP
              </div>
            )}

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <span className="glass-surface rounded-full px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-white">
                {categoryLabel}
              </span>
              <div className="flex flex-col items-end gap-2">
                {event.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase ${
                      badge === 'TRUSTED HOST' ? 'bg-electric-blue text-white' : 'bg-warm-yellow text-midnight'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
              {event.dateTag && (
                <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-gradient-tudu px-3 py-1 font-display text-[11px] font-bold text-white">
                  {event.dateTag}
                </span>
              )}
              <h1 className="font-display text-[28px] font-extrabold leading-[1.08] tracking-tight text-white">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-white/80">
                {event.dateTime && <span>🗓 {event.dateTime}</span>}
                {event.cost && <span>💲 {event.cost}</span>}
                {event.distance && <span>📍 {event.distance}</span>}
              </div>
              {event.locationDetail && (
                <p className="mt-2 text-xs text-white/60">{event.locationDetail}</p>
              )}
              {expanded && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-white/75">
                  <p>Host verified · 128 saves this week</p>
                  {event.categories && (
                    <div className="flex flex-wrap gap-2">
                      {event.categories.map((c) => (
                        <span key={c.label} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">
                          {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Floating action row — button fallbacks for swipe */}
        <div className="mx-auto flex w-full max-w-[390px] items-end justify-between px-1 py-3">
          <ActionBtn label="Back" onClick={goBack} disabled={history.length === 0} color="text-electric-blue">
            ↩
          </ActionBtn>
          <ActionBtn label="Skip" onClick={handleSkip} color="text-error">
            ✕
          </ActionBtn>
          <ActionBtn label="Details" onClick={handleDetails} large color="text-orange">
            ↑
          </ActionBtn>
          <ActionBtn label="Bucket" onClick={openSavePicker} color="text-success">
            🪣
          </ActionBtn>
          <ActionBtn
            label="Share"
            onClick={() => {
              triggerHaptic(6)
              if (navigator.share) {
                void navigator.share({ title: event.title, text: `NOW YOU KNOW — ${event.title} on TUDU` })
              }
            }}
            color="text-magenta"
          >
            ↗
          </ActionBtn>
        </div>
      </main>

      <BottomNav />
      <SaveToBucketFlyAnimation
        imageUrl={event.image}
        active={flyActive}
        onComplete={handleFlyComplete}
      />
      {showPicker && (
        <AddToBucketListModal
          eventIds={[event.id]}
          eventTitle={event.title}
          onClose={() => setShowPicker(false)}
          onSuccess={handleSaveSuccess}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} dark />}
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  disabled,
  large,
  color,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  large?: boolean
  color: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-w-[52px] flex-col items-center gap-1 disabled:opacity-35"
      aria-label={label}
    >
      <span
        className={`flex items-center justify-center rounded-full glass-surface font-display text-lg active:scale-95 ${
          large ? 'h-14 w-14 glow-warm text-xl' : 'h-12 w-12'
        }`}
      >
        {children}
      </span>
      <span className={`font-display text-[10px] font-semibold ${color}`}>{label}</span>
    </button>
  )
}
