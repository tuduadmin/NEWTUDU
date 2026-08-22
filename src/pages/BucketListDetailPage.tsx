import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, CheckCircle2 } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import AvatarStoryRing from '../components/AvatarStoryRing'
import BottomNav from '../components/BottomNav'
import MediaTile from '../components/MediaTile'
import Toast from '../components/Toast'
import VibeBadge from '../components/VibeBadge'
import { BackIconButton, BackLink, ShareButton } from '../components/NavActionButtons'
import { appFieldClass } from '../lib/formFieldClasses'
import type { DiscoverEvent } from '../data/discoverEvents'
import {
  copyPublicEventToList,
  copyPublicListToMine,
  createBucketList,
  deleteBucketList,
  getBucketListById,
  getBucketLists,
  getListCoverImage,
  getPublicBucketListById,
  removeEventFromBucketList,
  resolveListDisplayEvents,
  toggleEventComplete,
  updateBucketListName,
  updateBucketListVisibility,
  type BucketList,
  type PublicBucketList,
} from '../lib/bucketLists'
import { createRoadTripFromBucketList } from '../lib/roadTrips'
import { getCurrentUser } from '../lib/auth'
import type { VibeTag } from '../types/bucketList'

type TileSize = 'large' | 'small' | 'portrait' | 'editorial'

const GRID_PATTERN: TileSize[] = ['large', 'small', 'small', 'portrait', 'small', 'editorial']

export default function BucketListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)
  const [ownList, setOwnList] = useState<BucketList | undefined>()
  const [publicList, setPublicList] = useState<PublicBucketList | undefined>()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [pickListForEvent, setPickListForEvent] = useState<DiscoverEvent | null>(null)
  const [completeNote, setCompleteNote] = useState<{ eventId: string; note: string } | null>(null)
  const [stickyVisible, setStickyVisible] = useState(false)

  const isPublic = Boolean(publicList && !ownList)
  const listName = ownList?.name ?? publicList?.name ?? 'Bucket List'
  const coverImage =
    (ownList && getListCoverImage(ownList)) || publicList?.coverImage || undefined
  const vibe = (publicList?.vibe ?? 'Adventurous') as VibeTag

  const refresh = useCallback(() => {
    if (!id) return
    const mine = getBucketListById(id)
    const pub = getPublicBucketListById(id)
    setOwnList(mine)
    setPublicList(pub)
    if (mine) setNameDraft(mine.name)
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    function onScroll() {
      setStickyVisible(window.scrollY > 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const events = useMemo(() => {
    if (ownList) return resolveListDisplayEvents(ownList)
    if (publicList) return publicList.events
    return []
  }, [ownList, publicList])

  if (!id || (!ownList && !publicList)) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/bucket-list" />
        <main className="px-4 py-16 text-center">
          <h1 className="font-display text-xl font-bold text-brown">List not found</h1>
          <BackLink to="/bucket-list" className="mt-4">
            Back to Bucket Lists
          </BackLink>
        </main>
        <BottomNav />
      </div>
    )
  }

  function handleSaveName() {
    if (!ownList) return
    updateBucketListName(ownList.id, nameDraft)
    setEditingName(false)
    refresh()
    setToast('List renamed')
  }

  async function handleShare() {
    const url = `${window.location.origin}/bucket-list/${id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: listName, text: `NOW YOU KNOW - ${listName}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setToast('Link copied to clipboard')
      } catch {
        setToast('Could not share list')
      }
    }
  }

  function handleSendToRoadTrip() {
    if (!ownList) return
    const trip = createRoadTripFromBucketList(ownList, getCurrentUser()?.email)
    navigate('/road-trip/plan', { state: { tripId: trip.id } })
  }

  function handleSaveWholePublicList() {
    if (!publicList) return
    const copy = copyPublicListToMine(publicList)
    setToast(`Saved as "${copy.name}"`)
    navigate(`/bucket-list/${copy.id}`)
  }

  function handleAddEventToMyList(listId: string) {
    if (!pickListForEvent) return
    copyPublicEventToList(listId, pickListForEvent)
    setPickListForEvent(null)
    setToast('Added to list')
  }

  function handleCreateListForEvent(name: string) {
    if (!pickListForEvent) return
    const list = createBucketList(name, [pickListForEvent.id])
    setPickListForEvent(null)
    setToast(`Created "${list.name}"`)
  }

  function handleToggleComplete(eventId: string) {
    if (!ownList) return
    const isComplete = ownList.completedIds.includes(eventId)
    if (isComplete) {
      toggleEventComplete(ownList.id, eventId)
      refresh()
    } else {
      setCompleteNote({ eventId, note: '' })
    }
  }

  function submitCompleteNote() {
    if (!ownList || !completeNote) return
    toggleEventComplete(ownList.id, completeNote.eventId, completeNote.note)
    setCompleteNote(null)
    refresh()
    setToast('Marked complete!')
  }

  function handleRemoveEvent(eventId: string) {
    if (!ownList) return
    removeEventFromBucketList(ownList.id, eventId)
    refresh()
    setToast('Event removed')
  }

  function handleDeleteList() {
    if (!ownList) return
    if (!window.confirm(`Delete "${ownList.name}"?`)) return
    deleteBucketList(ownList.id)
    navigate('/bucket-list')
  }

  function handleToggleVisibility() {
    if (!ownList) return
    const currentlyPrivate = ownList.isPrivate === true
    updateBucketListVisibility(ownList.id, !currentlyPrivate)
    refresh()
    setToast(currentlyPrivate ? 'List is now public in Explore' : 'List is now private')
  }

  const completedCount = ownList?.completedIds.length ?? 0
  const completionPct = events.length > 0 ? Math.round((completedCount / events.length) * 100) : 0

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo="/bucket-list" />
      {/* Sticky condensed header */}
      <header
        className={`fixed inset-x-0 top-0 z-[var(--z-header)] mx-auto max-w-lg border-b border-app-subtle bg-app-elevated/95 backdrop-blur-sm transition duration-[var(--duration-fast)] ${
          stickyVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <div className="flex h-[52px] items-center gap-3 px-4">
          <BackIconButton to="/bucket-list" variant="plain" />
          <h1 className="truncate font-display text-lg font-bold text-brown">{listName}</h1>
        </div>
      </header>

      {/* Hero header */}
      <div className="relative h-[280px] w-full overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-dusk" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/20 via-transparent to-midnight/95" />
        <BackIconButton
          to="/bucket-list"
          variant="glass"
          className="absolute left-4 top-[calc(12px+env(safe-area-inset-top))]"
        />
        <div className="absolute inset-x-0 bottom-0 p-5">
          {isPublic && publicList && (
            <div className="mb-3 flex items-center gap-2">
              <AvatarStoryRing initials={publicList.ownerInitials} size={32} />
              <span className="text-sm text-white/72">by {publicList.ownerName}</span>
            </div>
          )}
          {ownList && editingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
                className="min-w-0 flex-1 rounded-[14px] border border-white/[0.08] bg-midnight-surface/90 px-3 py-2 font-display text-lg font-bold outline-none focus:border-magenta/50"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="rounded-[14px] bg-gradient-tudu px-4 py-2 text-sm font-bold"
              >
                Save
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => ownList && setEditingName(true)} disabled={!ownList}>
              <h1 className="text-left font-display text-[28px] font-extrabold leading-tight tracking-tight">
                {listName}
                {ownList && <span className="ml-2 text-sm text-white/40">âœŽ</span>}
              </h1>
            </button>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/48">
              {events.length} items | {completionPct}% complete
            </span>
            <VibeBadge vibe={vibe} />
          </div>
          {publicList?.description && (
            <p className="mt-2 line-clamp-2 text-sm text-white/60">{publicList.description}</p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 px-4 py-4">
        <ShareButton onClick={handleShare} className="rounded-[14px] px-4 py-2 font-display text-xs font-bold" />
        {ownList && completedCount > 0 && (
          <ActionButton
            primary
            onClick={() => navigate(`/bucket-list/story/own-${ownList.id}`)}
          >
            View Story
          </ActionButton>
        )}
        {ownList && (
          <>
            <ActionButton onClick={handleToggleVisibility}>
              {ownList.isPrivate === true ? 'Make public' : 'Make private'}
            </ActionButton>
            <ActionButton onClick={handleSendToRoadTrip}>Road Trip</ActionButton>
            <ActionButton variant="danger" onClick={handleDeleteList}>
              Delete
            </ActionButton>
          </>
        )}
        {isPublic && (
          <ActionButton primary onClick={handleSaveWholePublicList}>
            Save Whole List
          </ActionButton>
        )}
      </div>

      {/* Masonry mood board grid */}
      <main className="px-3 pb-8">
        {events.length === 0 ? (
          <div className="app-surface-card px-6 py-10 text-center">
            <p className="text-sm text-brown-muted">No events in this list yet.</p>
            <Link to="/discover" className="mt-3 inline-block text-sm font-semibold text-orange">
              Discover events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {events.map((event, i) => {
              const size = GRID_PATTERN[i % GRID_PATTERN.length]
              const isComplete = ownList?.completedIds.includes(event.id) ?? false
              return (
                <ExperienceTile
                  key={event.id}
                  event={event}
                  size={size}
                  isComplete={isComplete}
                  isOwner={Boolean(ownList)}
                  onToggleComplete={() => handleToggleComplete(event.id)}
                  onRemove={() => handleRemoveEvent(event.id)}
                  onSave={() => setPickListForEvent(event)}
                />
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />

      {pickListForEvent && (
        <PickListModal
          onClose={() => setPickListForEvent(null)}
          onSelect={handleAddEventToMyList}
          onCreate={handleCreateListForEvent}
        />
      )}

      {completeNote && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setCompleteNote(null)}
          />
          <div className="fixed bottom-24 left-1/2 z-[var(--z-floating)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 app-surface-card p-4 shadow-float">
            <h2 className="font-display text-base font-bold text-brown">Mark complete</h2>
            <p className="mt-1 text-sm text-brown-muted">What was the vibe? Would you do it again?</p>
            <textarea
              value={completeNote.note}
              onChange={(e) => setCompleteNote({ ...completeNote, note: e.target.value })}
              placeholder="Optional memory..."
              rows={3}
              className={`${appFieldClass} mt-3 resize-none px-3 py-2`}
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setCompleteNote(null)}
                className="flex-1 rounded-[14px] border border-brown/15 py-2.5 text-sm font-semibold text-brown"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCompleteNote}
                className="flex-1 rounded-[14px] bg-gradient-tudu py-2.5 text-sm font-bold text-white"
              >
                Complete
              </button>
            </div>
          </div>
        </>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function ExperienceTile({
  event,
  size,
  isComplete,
  isOwner,
  onToggleComplete,
  onRemove,
  onSave,
}: {
  event: DiscoverEvent
  size: TileSize
  isComplete: boolean
  isOwner: boolean
  onToggleComplete: () => void
  onRemove: () => void
  onSave: () => void
}) {
  const sizeClass =
    size === 'large' || size === 'editorial'
      ? 'col-span-2'
      : size === 'portrait'
        ? 'row-span-1'
        : ''

  const heightClass =
    size === 'large'
      ? 'h-[240px]'
      : size === 'portrait'
        ? 'h-[200px]'
        : size === 'editorial'
          ? 'h-[120px]'
          : 'h-[160px]'

  return (
    <article
      className={`relative overflow-hidden rounded-[14px] ${sizeClass} ${heightClass} ${
        isComplete ? 'opacity-60' : ''
      }`}
    >
      <MediaTile
        src={event.image}
        videoUrl={event.videoUrl}
        mediaType={event.mediaType}
        className="h-full w-full object-cover"
        autoPlay={event.mediaType === 'video'}
        muted
        loop
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-midnight/85" />

      {isComplete && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-midnight/72 text-success">
          <CheckCircle2 size={16} fill="currentColor" />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3
          className={`line-clamp-2 font-display text-sm font-bold leading-tight ${isComplete ? 'line-through' : ''}`}
        >
          {event.title}
        </h3>
        <p className="mt-0.5 text-[11px] text-white/60">{event.city}</p>
      </div>

      <div className="absolute left-2 top-2 flex gap-1">
        {isOwner ? (
          <>
            <button
              type="button"
              onClick={onToggleComplete}
              className="flex h-8 w-8 items-center justify-center rounded-full glass-surface text-xs"
              aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
            >
              {isComplete ? 'âœ“' : 'â—‹'}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex h-8 w-8 items-center justify-center rounded-full glass-surface text-xs text-error"
              aria-label="Remove"
            >
              âœ•
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onSave}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-orange shadow-sm"
            aria-label="Save to list"
          >
            <Bookmark size={14} />
          </button>
        )}
      </div>
    </article>
  )
}

function ActionButton({
  children,
  onClick,
  primary,
  variant,
  icon,
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
  variant?: 'danger'
  icon?: React.ReactNode
}) {
  let className =
    'inline-flex items-center gap-1.5 rounded-[14px] border border-brown/15 bg-white px-4 py-2 font-display text-xs font-bold text-brown transition hover:border-orange/30 active:scale-[0.98]'
  if (primary)
    className =
      'inline-flex items-center gap-1.5 rounded-[14px] bg-gradient-tudu px-4 py-2 font-display text-xs font-bold text-white active:scale-[0.98]'
  if (variant === 'danger')
    className =
      'inline-flex items-center gap-1.5 rounded-[14px] border border-error/30 px-4 py-2 font-display text-xs font-bold text-error hover:border-error/50'

  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {children}
    </button>
  )
}

function PickListModal({
  onClose,
  onSelect,
  onCreate,
}: {
  onClose: () => void
  onSelect: (listId: string) => void
  onCreate: (name: string) => void
}) {
  const [lists] = useState(() => getBucketLists())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  return (
    <>
      <button type="button" className="fixed inset-0 z-[var(--z-modal)] bg-black/60" aria-label="Close" onClick={onClose} />
      <div className="fixed bottom-24 left-1/2 z-[var(--z-floating)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 app-surface-card p-4 shadow-float">
        <h2 className="font-display text-base font-bold text-brown">Save to list</h2>
        {creating ? (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New list name"
              autoFocus
              className={`${appFieldClass} px-3 py-2`}
            />
            <button
              type="button"
              onClick={() => {
                if (newName.trim()) onCreate(newName.trim())
              }}
              className="w-full rounded-[14px] bg-gradient-tudu py-2.5 font-display text-sm font-bold text-white"
            >
              Create &amp; Save
            </button>
          </div>
        ) : (
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {lists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => onSelect(list.id)}
                className="flex w-full rounded-[14px] border border-brown/10 px-3 py-2.5 text-left text-sm font-semibold text-brown transition hover:border-orange/40 hover:bg-orange/5"
              >
                {list.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full rounded-[14px] border border-dashed border-brown/20 py-2.5 text-sm font-semibold text-orange"
            >
              ï¼‹ Create New List
            </button>
          </div>
        )}
      </div>
    </>
  )
}
