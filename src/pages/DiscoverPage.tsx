import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, CircleDollarSign, X } from 'lucide-react'
import AdminDiscoverReturnBanner from '../components/admin/AdminDiscoverReturnBanner'
import DiscoverActionButtons from '../components/DiscoverActionButtons'
import DiscoverEventDetailPanel from '../components/DiscoverEventDetailPanel'
import HiddenGemAmenityRow from '../components/HiddenGemAmenityRow'
import HiddenGemHoursStatusBadge from '../components/HiddenGemHoursStatusBadge'
import HiddenGemOrganizerAvatar from '../components/HiddenGemOrganizerAvatar'
import DiscoverSignupPrompt from '../components/DiscoverSignupPrompt'
import EventCoverDisplay from '../components/EventCoverDisplay'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import SaveToBucketFlyAnimation from '../components/SaveToBucketFlyAnimation'
import Toast from '../components/Toast'
import { findDiscoverEventByTargetId, parseAdminDiscoverReturnTo, PREVIEW_HIDDEN_GEM_CARD } from '../data/discoverEvents'
import { getDiscoverDeckPool } from '../lib/discoverDeckFilter'
import {
  clearQuickPickOverride,
  getQuickPickLabel,
  getQuickPickOverride,
  hasExplorerQuickPickAccess,
  QUICK_PICK_CHANGED_EVENT,
  type QuickPickOverride,
} from '../lib/quickPickOverride'
import { useCurrentAccount } from '../hooks/useCurrentAccount'
import { incrementEventOpen, incrementEventView } from '../lib/adminAnalytics'
import {
  ANON_DISCOVER_LIMIT,
  getAnonDiscoverCardsSeen,
  isAnonDiscoverLimitReached,
  setAnonDiscoverCardsSeen,
} from '../lib/anonDiscoverLimit'
import { isAuthenticated } from '../lib/auth'
import { normalizeBorderType, getDiscoverCardBorderStyle } from '../lib/eventCardColors'
import {
  DISCOVER_DECK_CARD_COVER_CLASS,
  DISCOVER_DECK_CARD_COVER_IMG_CLASS,
  DISCOVER_DECK_CARD_MAX_WIDTH_CLASS,
  DISCOVER_DECK_CARD_RADIUS_CLASS,
} from '../lib/discoverDeckCardFrame'
import { getEventKeywords, trackKeywordSave, trackKeywordView } from '../lib/keywordAnalytics'
import {
  createDiscoverDeckQueue,
  DISCOVER_BACK_LIMIT,
  type DiscoverDeckAction,
  type DiscoverDeckUndoEntry,
} from '../lib/discoverDeckSession'
import { saveEvent } from '../lib/savedEvents'
import { isEventLiked, toggleLikedEvent } from '../lib/likedEvents'

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
  const [searchParams] = useSearchParams()
  const { account } = useCurrentAccount()
  const canUseQuickPick = hasExplorerQuickPickAccess(account)
  const isHiddenGemPreview = searchParams.get('preview') === 'hidden-gem'
  const openEventId = searchParams.get('event')
  const adminReturnTo = parseAdminDiscoverReturnTo(searchParams.get('returnTo'))
  const showAdminReturnBanner = searchParams.get('from') === 'admin' && adminReturnTo != null
  const isAnon = !isAuthenticated()
  const anonLimitActive = isAnon && !isHiddenGemPreview

  const [expanded, setExpanded] = useState(false)
  const [deckQueue, setDeckQueue] = useState<string[]>([])
  const [skippedIds, setSkippedIds] = useState<Set<string>>(() => new Set())
  const [undoStack, setUndoStack] = useState<DiscoverDeckUndoEntry[]>([])
  const [backsRemaining, setBacksRemaining] = useState(DISCOVER_BACK_LIMIT)
  const [toast, setToast] = useState<string | null>(null)
  const [flyActive, setFlyActive] = useState(false)
  const [cardExit, setCardExit] = useState<CardExit>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [cardsSeen, setCardsSeen] = useState(() => (anonLimitActive ? getAnonDiscoverCardsSeen() : 0))
  const [showSignupPrompt, setShowSignupPrompt] = useState(
    () => anonLimitActive && isAnonDiscoverLimitReached(),
  )
  const [quickPickOverride, setQuickPickOverride] = useState<QuickPickOverride | null>(() =>
    getQuickPickOverride(),
  )
  const [deckRefresh, setDeckRefresh] = useState(0)
  const [eventLiked, setEventLiked] = useState(false)

  useEffect(() => {
    function refreshDeckFilters() {
      setQuickPickOverride(getQuickPickOverride())
      setDeckRefresh((n) => n + 1)
    }
    window.addEventListener(QUICK_PICK_CHANGED_EVENT, refreshDeckFilters)
    window.addEventListener('storage', refreshDeckFilters)
    return () => {
      window.removeEventListener(QUICK_PICK_CHANGED_EVENT, refreshDeckFilters)
      window.removeEventListener('storage', refreshDeckFilters)
    }
  }, [])

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLElement>(null)

  const discoverPool = useMemo(
    () => (isHiddenGemPreview ? [PREVIEW_HIDDEN_GEM_CARD] : getDiscoverDeckPool()),
    [isHiddenGemPreview, deckRefresh, canUseQuickPick],
  )
  const event =
    deckQueue.length > 0
      ? discoverPool.find((card) => card.id === deckQueue[0])
      : undefined
  const activeQuickPick = canUseQuickPick ? quickPickOverride : null

  function pushUndo(action: DiscoverDeckAction) {
    setUndoStack((prev) => [
      ...prev,
      {
        queue: deckQueue,
        skippedIds: Array.from(skippedIds),
        action,
      },
    ])
  }

  useEffect(() => {
    setDeckQueue(createDiscoverDeckQueue(discoverPool.map((card) => card.id)))
    setSkippedIds(new Set())
    setUndoStack([])
    setBacksRemaining(DISCOVER_BACK_LIMIT)
    setExpanded(false)
  }, [discoverPool, quickPickOverride])

  useEffect(() => {
    if (event) setEventLiked(isEventLiked(event.id))
  }, [event?.id])

  useEffect(() => {
    if (!openEventId || isHiddenGemPreview) return
    const match = findDiscoverEventByTargetId(openEventId)
    if (!match) return
    setDeckQueue((prev) => {
      if (prev.includes(match.id)) {
        return [match.id, ...prev.filter((id) => id !== match.id)]
      }
      return [match.id, ...prev]
    })
    setExpanded(true)
  }, [openEventId, isHiddenGemPreview])

  useEffect(() => {
    if (expanded) return
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior
    const prevBodyOverscroll = document.body.style.overscrollBehavior
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll
      document.body.style.overscrollBehavior = prevBodyOverscroll
    }
  }, [expanded])

  useEffect(() => {
    const el = cardRef.current
    if (!el || expanded) return

    function blockScrollWhileDragging(e: TouchEvent) {
      if (!touchStart.current) return
      e.preventDefault()
    }

    el.addEventListener('touchmove', blockScrollWhileDragging, { passive: false })
    return () => el.removeEventListener('touchmove', blockScrollWhileDragging)
  }, [expanded, event?.id])

  useEffect(() => {
    if (!event) return
    const metricsId = event.hostEventId ?? event.id
    incrementEventView(metricsId)
    const keywords = event.keywords ?? getEventKeywords(event.hostEventId)
    trackKeywordView(keywords)
  }, [event?.id, event?.hostEventId, event?.keywords])

  const finishCardTransition = useCallback(() => {
    setCardExit(null)
    setDragOffset({ x: 0, y: 0 })
    dragOffsetRef.current = { x: 0, y: 0 }
    setExpanded(false)
  }, [])

  const bumpAnonCardsSeen = useCallback(() => {
    if (!anonLimitActive) return true
    if (cardsSeen >= ANON_DISCOVER_LIMIT) {
      setShowSignupPrompt(true)
      return false
    }
    const next = cardsSeen + 1
    setCardsSeen(next)
    setAnonDiscoverCardsSeen(next)
    return true
  }, [anonLimitActive, cardsSeen])

  function handleSkip() {
    if (isHiddenGemPreview || deckQueue.length === 0) return
    if (!bumpAnonCardsSeen()) return
    triggerHaptic(8)
    pushUndo('skip')
    const [currentId, ...rest] = deckQueue
    setSkippedIds((prev) => new Set(prev).add(currentId))
    setDeckQueue(rest)
    setCardExit('left')
    window.setTimeout(finishCardTransition, 240)
  }

  function handleInterested() {
    if (isHiddenGemPreview || deckQueue.length === 0) return
    if (!bumpAnonCardsSeen()) return
    triggerHaptic(6)
    pushUndo('interested')
    const [currentId, ...rest] = deckQueue
    setDeckQueue([...rest, currentId])
    setToast("Interested — we'll show this again")
    setCardExit('right')
    window.setTimeout(finishCardTransition, 240)
  }

  function handleDetails() {
    triggerHaptic(6)
    setExpanded((v) => {
      if (!v) {
        const metricsId = event!.hostEventId ?? event!.id
        incrementEventOpen(metricsId)
      }
      return !v
    })
  }

  function handleSave() {
    if (deckQueue.length === 0) return
    if (!bumpAnonCardsSeen()) return
    triggerHaptic(10)
    pushUndo('save')
    saveEvent(event!.id, {
      eventCity: event!.city,
      hostEventId: event!.hostEventId,
      attractionId: event!.attractionId,
      hiddenGemId: event!.id.startsWith('hidden-gem-') ? event!.attractionId : undefined,
    })
    const keywords = event!.keywords ?? getEventKeywords(event!.hostEventId)
    trackKeywordSave(keywords)
    setDeckQueue((q) => q.slice(1))
    setFlyActive(true)
    triggerHaptic([10, 30, 10])
    setToast('Saved to My Tudu')
    window.setTimeout(() => {
      setCardExit('right')
      window.setTimeout(finishCardTransition, 280)
    }, 520)
  }

  function handleLike() {
    if (anonLimitActive && cardsSeen >= ANON_DISCOVER_LIMIT) {
      setShowSignupPrompt(true)
      return
    }
    triggerHaptic(6)
    setEventLiked(toggleLikedEvent(event!.id))
  }

  function handleFlyComplete() {
    setFlyActive(false)
  }

  function goBack() {
    if (backsRemaining <= 0 || undoStack.length === 0) return
    triggerHaptic(6)
    const entry = undoStack[undoStack.length - 1]
    setDeckQueue(entry.queue)
    setSkippedIds(new Set(entry.skippedIds))
    setUndoStack((stack) => stack.slice(0, -1))
    setBacksRemaining((n) => n - 1)
    setExpanded(false)
    setCardExit(null)
  }

  function handleShowSkippedAgain() {
    if (skippedIds.size === 0) return
    const ids = [...skippedIds]
    setDeckQueue(ids)
    setSkippedIds(new Set())
    setToast('Skipped events added back to your deck')
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() }
    dragOffsetRef.current = { x: 0, y: 0 }
    setIsDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return
    const t = e.touches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const verticalDominant = Math.abs(dy) > Math.abs(dx)
    const next = {
      x: dx,
      y: verticalDominant ? dy : dy * 0.15,
    }
    dragOffsetRef.current = next
    setDragOffset(next)
  }

  function onTouchEnd() {
    if (!touchStart.current) return
    touchStart.current = null
    setIsDragging(false)

    const { x: dx, y: dy } = dragOffsetRef.current

    if (dy < -SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      handleDetails()
      setDragOffset({ x: 0, y: 0 })
      dragOffsetRef.current = { x: 0, y: 0 }
      return
    }

    if (dx > SWIPE_THRESHOLD) {
      handleInterested()
      setDragOffset({ x: 0, y: 0 })
      dragOffsetRef.current = { x: 0, y: 0 }
      return
    }

    if (dx < -SWIPE_THRESHOLD) {
      handleSkip()
      return
    }

    setDragOffset({ x: 0, y: 0 })
    dragOffsetRef.current = { x: 0, y: 0 }
  }

  const rotate = isDragging ? dragOffset.x * 0.04 : 0
  const cardTransform = cardExit
    ? undefined
    : `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`

  const categoryLabel = event?.categories?.[0]?.label ?? 'Experience'
  const borderType = normalizeBorderType(event?.borderColor)
  const cardBorderStyle = getDiscoverCardBorderStyle(borderType)
  const isHiddenGemCard = event?.badges.includes('HIDDEN GEM') && borderType === 'gold'

  if (!event) {
    const hasSkipped = skippedIds.size > 0
    return (
      <div className="app-page-shell relative flex h-svh flex-col pb-[calc(var(--app-bottom-nav-h)+max(0.5rem,env(safe-area-inset-bottom,0px)))]">
        <AppHeaderBar />
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          {activeQuickPick ? (
            <>
              <p className="font-display text-lg font-bold text-brown">
                No {getQuickPickLabel(activeQuickPick).toLowerCase()} events right now
              </p>
              <p className="mt-2 text-sm text-brown-muted">
                Try another quick pick or clear the filter on My Tudu.
              </p>
              <button
                type="button"
                onClick={() => clearQuickPickOverride()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-[14px] border border-orange/35 bg-app-elevated px-4 py-2 text-sm font-semibold text-orange transition hover:border-orange/50 hover:bg-orange/5"
              >
                <X size={14} aria-hidden />
                Clear quick pick
              </button>
            </>
          ) : hasSkipped ? (
            <>
              <p className="font-display text-lg font-bold text-brown">You've seen everything for now</p>
              <p className="mt-2 text-sm text-brown-muted">
                Skipped {skippedIds.size} event{skippedIds.size === 1 ? '' : 's'}. Bring them back if you
                changed your mind.
              </p>
              <button
                type="button"
                onClick={handleShowSkippedAgain}
                className="mt-4 inline-flex items-center gap-1.5 rounded-[14px] border border-orange/35 bg-app-elevated px-4 py-2 text-sm font-semibold text-orange transition hover:border-orange/50 hover:bg-orange/5"
              >
                Show skipped again
              </button>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-bold text-brown">No events to show</p>
              <p className="mt-2 text-sm text-brown-muted">
                Check back soon or update your interests in My Tudu settings.
              </p>
              <Link
                to="/my-tudu/settings/profile"
                className="mt-4 text-sm font-bold text-orange no-underline hover:text-orange/80"
              >
                Interests and preferences
              </Link>
            </>
          )}
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell relative flex h-svh max-h-svh flex-col overflow-hidden overscroll-none pb-[calc(var(--app-bottom-nav-h)+max(0.5rem,env(safe-area-inset-bottom,0px)))]">
      {!expanded && showAdminReturnBanner && adminReturnTo && (
        <AdminDiscoverReturnBanner returnTo={adminReturnTo} />
      )}
      {!expanded && <AppHeaderBar />}

      {!expanded && activeQuickPick && (
        <div className="mx-2 mb-1 flex items-center justify-between gap-2 rounded-[14px] border border-orange/35 bg-app-elevated px-3 py-2 shadow-sm">
          <p className="min-w-0 truncate text-xs font-semibold text-brown">
            Quick pick:{' '}
            <span className="font-bold text-orange">{getQuickPickLabel(activeQuickPick)}</span>
          </p>
          <button
            type="button"
            onClick={() => clearQuickPickOverride()}
            className="inline-flex shrink-0 items-center gap-1 rounded-[14px] px-2 py-1 text-[11px] font-bold text-orange transition hover:bg-orange/5"
            aria-label="Clear quick pick filter"
          >
            <X size={12} aria-hidden />
            Clear
          </button>
        </div>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-1">
        {!expanded && (
        <div className="relative mx-auto min-h-0 w-full flex-1 overflow-hidden">
          {/* Background stack hint */}
          <div
            className="absolute inset-x-2 top-0 bottom-2 rounded-[14px] border border-app-subtle bg-app-elevated/80"
            aria-hidden
          />

          <article
            ref={cardRef}
            className={`relative mx-auto h-full w-full ${DISCOVER_DECK_CARD_MAX_WIDTH_CLASS} touch-none overflow-hidden ${DISCOVER_DECK_CARD_RADIUS_CLASS} shadow-float will-change-transform ${
              cardExit === 'right'
                ? 'animate-swipe-right'
                : cardExit === 'left'
                  ? 'animate-swipe-left'
                  : cardExit === 'up'
                    ? 'animate-swipe-up'
                    : ''
            }`}
            style={{
              ...cardBorderStyle,
              transform: cardTransform,
              transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.2,0.8,0.2,1)',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <EventCoverDisplay
              coverImage={event.image}
              className={DISCOVER_DECK_CARD_COVER_CLASS}
              imgClassName={DISCOVER_DECK_CARD_COVER_IMG_CLASS}
            />
            <div className="overlay-readability absolute inset-0" />

            {/* Swipe hints */}
            {isDragging && dragOffset.x > 30 && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-[14px] bg-electric-blue/90 px-4 py-2 font-display text-sm font-bold text-white">
                INTERESTED
              </div>
            )}
            {isDragging && dragOffset.x < -30 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-[14px] bg-error/90 px-4 py-2 font-display text-sm font-bold text-white">
                SKIP
              </div>
            )}

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              {!isHiddenGemCard && (
                <span className="glass-surface rounded-[14px] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-white">
                  {categoryLabel}
                </span>
              )}
              {isHiddenGemCard && event.amenityIds && event.amenityIds.length > 0 && (
                <HiddenGemAmenityRow
                  amenityIds={event.amenityIds}
                  layout="column"
                  onOverflowClick={handleDetails}
                  className="pointer-events-auto"
                />
              )}
              {!isHiddenGemCard && <span />}
              <div className="flex flex-col items-end gap-2">
                {event.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-[14px] px-2.5 py-1 font-display text-[10px] font-bold uppercase ${
                      badge === 'TRUSTED HOST'
                        ? 'bg-electric-blue text-white'
                        : badge === 'ATTRACTION'
                          ? 'bg-cyan-500 text-white'
                          : 'bg-warm-yellow text-midnight'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
              {!isHiddenGemCard && event.dateTag && (
                <span className="mb-3 inline-flex items-center gap-1 rounded-[14px] bg-gradient-tudu px-3 py-1 font-display text-[11px] font-bold text-white">
                  {event.dateTag}
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {isHiddenGemCard && (
                    <div className="mb-1.5">
                      <HiddenGemHoursStatusBadge weeklyHours={event.weeklyHours} />
                    </div>
                  )}
                  <h1
                    title={isHiddenGemCard ? event.title : undefined}
                    className={`font-display text-[28px] font-extrabold leading-[1.08] tracking-tight text-white${
                      isHiddenGemCard ? ' line-clamp-2' : ''
                    }`}
                  >
                    {event.title}
                  </h1>
                  {isHiddenGemCard && (
                    <p className="mt-1 font-display text-xs font-semibold uppercase tracking-wide text-white/75">
                      {categoryLabel}
                    </p>
                  )}
                </div>
                {isHiddenGemCard && (
                  <HiddenGemOrganizerAvatar
                    initial={event.hostAvatarInitial}
                    avatarUrl={event.hostAvatarUrl}
                    profileUrl={event.hostProfileUrl}
                    label={event.hostLabel}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-white/80">
                {!isHiddenGemCard && event.dateTime && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} aria-hidden className="shrink-0" />
                    {event.dateTime}
                  </span>
                )}
                {event.cost && (
                  <span className="inline-flex items-center gap-1">
                    <CircleDollarSign size={12} aria-hidden className="shrink-0" />
                    {event.cost}
                  </span>
                )}
                {event.distance && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} aria-hidden className="shrink-0" />
                    {event.distance}
                  </span>
                )}
              </div>
            </div>
          </article>
        </div>
        )}
      </main>

      {!expanded && (
        <div className="shrink-0 px-2 pt-4 pb-6">
          <DiscoverActionButtons
            onBack={goBack}
            onSkip={handleSkip}
            onView={handleDetails}
            onSave={handleSave}
            onShare={() => {
              triggerHaptic(6)
              if (navigator.share) {
                void navigator.share({ title: event.title, text: `NOW YOU KNOW - ${event.title} on TUDU` })
              }
            }}
            backDisabled={backsRemaining <= 0 || undoStack.length === 0}
            backsRemaining={backsRemaining}
          />
        </div>
      )}

      {!expanded && <BottomNav />}
      <SaveToBucketFlyAnimation
        imageUrl={event.image}
        active={flyActive}
        onComplete={handleFlyComplete}
      />
      {expanded && (
        <DiscoverEventDetailPanel
          event={event}
          onClose={() => setExpanded(false)}
          onSave={handleSave}
          isLiked={eventLiked}
          onLike={handleLike}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} dark />}
      {showSignupPrompt && <DiscoverSignupPrompt />}
    </div>
  )
}
