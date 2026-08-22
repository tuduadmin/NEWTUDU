import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowsUpDownIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { appFieldClass } from '../../lib/formFieldClasses'
import AddToBucketListModal from '../AddToBucketListModal'
import AddToRoadTripModal from '../AddToRoadTripModal'
import DiscoverEventDetailPanel from '../DiscoverEventDetailPanel'
import GradientButton from '../GradientButton'
import SavedBulkActionBar from './SavedBulkActionBar'
import SavedEventCard from './SavedEventCard'
import SavedEventListRow from './SavedEventListRow'
import Toast from '../Toast'
import type { DiscoverEvent } from '../../data/discoverEvents'
import { getBucketLists, removeEventFromBucketList, resolveEventFromAnySource } from '../../lib/bucketLists'
import { splitEventsByPast } from '../../lib/savedEventDates'
import {
  filterAndSortSavedEvents,
  type SavedSortOption,
  type SavedTimeFilter,
} from '../../lib/savedEventDisplay'
import { removeSavedEventForUser } from '../../lib/savedEvents'
import { addStopsToRoadTrip } from '../../lib/roadTrips'
import type { EnrichedUserTicket } from '../../lib/userTickets'

type SavedItem = {
  event: DiscoverEvent
  sources: ('saved' | 'bucket-list')[]
}

type LibraryTab = 'saved' | 'past'

type MyTuduLibrarySectionProps = {
  savedItems: SavedItem[]
  pastTickets: EnrichedUserTicket[]
  userEmail: string | null
  onRefresh: () => void
}

const TIME_FILTER_OPTIONS: { id: SavedTimeFilter; label: string }[] = [
  { id: 'any', label: 'Any Time' },
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'august', label: 'August' },
  { id: 'september', label: 'September' },
]

const SORT_OPTIONS: { id: SavedSortOption; label: string; icon: typeof ClockIcon }[] = [
  { id: 'soonest', label: 'Happening Soonest', icon: ClockIcon },
  { id: 'name', label: 'Name (A-Z)', icon: ArrowsUpDownIcon },
  { id: 'category', label: 'Category', icon: TagIcon },
]

function TabButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean
  icon: typeof BookmarkIcon
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center gap-0.5 px-1 pb-2 pt-1 transition ${
        active ? 'theme-accent-text' : 'text-brown'
      }`}
    >
      <Icon
        className={`h-5 w-5 ${active ? 'theme-accent-icon' : 'text-brown'}`}
        aria-hidden
      />
      <span className={`text-xs font-bold ${active ? 'theme-accent-text' : 'text-brown'}`}>{label}</span>
      <span
        className={`text-[11px] font-semibold ${active ? 'theme-accent-text opacity-80' : 'text-brown-muted'}`}
      >
        {count}
      </span>
      {active && (
        <span className="theme-accent-underline absolute bottom-0 left-2 right-2 h-0.5 rounded-full" aria-hidden />
      )}
    </button>
  )
}

export default function MyTuduLibrarySection({
  savedItems,
  pastTickets,
  userEmail,
  onRefresh,
}: MyTuduLibrarySectionProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('saved')
  const [savedSearch, setSavedSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState<SavedTimeFilter>('any')
  const [sortBy, setSortBy] = useState<SavedSortOption>('soonest')
  const [listView, setListView] = useState(true)
  const [timeFilterOpen, setTimeFilterOpen] = useState(false)
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [moveListEventId, setMoveListEventId] = useState<string | null>(null)
  const [detailEvent, setDetailEvent] = useState<DiscoverEvent | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [addToBucketList, setAddToBucketList] = useState(true)
  const [addToRoadTrip, setAddToRoadTrip] = useState(false)
  const [bulkBucketIds, setBulkBucketIds] = useState<string[] | null>(null)
  const [bulkRoadTripIds, setBulkRoadTripIds] = useState<string[] | null>(null)
  const [pendingRoadTripIds, setPendingRoadTripIds] = useState<string[] | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const toolbarRef = useRef<HTMLDivElement>(null)

  const { upcoming: upcomingSaved, past: pastSaved } = useMemo(
    () => splitEventsByPast(savedItems),
    [savedItems],
  )

  const filteredSavedEvents = useMemo(
    () =>
      filterAndSortSavedEvents(
        upcomingSaved.map((item) => item.event),
        savedSearch,
        timeFilter,
        sortBy,
      ),
    [upcomingSaved, savedSearch, timeFilter, sortBy],
  )

  const pastEvents = useMemo(() => {
    const seen = new Set<string>()
    const events: Array<{ event: DiscoverEvent; isPast: boolean }> = []

    for (const item of pastSaved) {
      if (seen.has(item.event.id)) continue
      seen.add(item.event.id)
      events.push({ event: item.event, isPast: true })
    }

    for (const ticket of pastTickets) {
      if (seen.has(ticket.eventId)) continue
      const event = resolveEventFromAnySource(ticket.eventId)
      if (event) {
        seen.add(ticket.eventId)
        events.push({ event, isPast: true })
      }
    }

    return events
  }, [pastSaved, pastTickets])

  const savedItemsById = useMemo(
    () => new Map(savedItems.map((item) => [item.event.id, item])),
    [savedItems],
  )

  const moveListEvent = moveListEventId
    ? savedItemsById.get(moveListEventId)?.event
    : undefined

  useEffect(() => {
    if (!timeFilterOpen && !sortMenuOpen) return
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (toolbarRef.current?.contains(e.target as Node)) return
      setTimeFilterOpen(false)
      setSortMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [timeFilterOpen, sortMenuOpen])

  function handleRemoveSaved(eventId: string) {
    if (!userEmail) return
    const item = savedItemsById.get(eventId)
    if (!item) return

    if (item.sources.includes('saved')) {
      removeSavedEventForUser(userEmail, eventId)
    }
    if (item.sources.includes('bucket-list')) {
      for (const list of getBucketLists()) {
        if (list.eventIds.includes(eventId)) {
          removeEventFromBucketList(list.id, eventId)
        }
      }
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(eventId)
      return next
    })
    onRefresh()
    setToast('Removed from saved')
  }

  function handleClearAll() {
    if (!userEmail || upcomingSaved.length === 0) return
    for (const { event, sources } of upcomingSaved) {
      if (sources.includes('saved')) {
        removeSavedEventForUser(userEmail, event.id)
      }
      if (sources.includes('bucket-list')) {
        for (const list of getBucketLists()) {
          if (list.eventIds.includes(event.id)) {
            removeEventFromBucketList(list.id, event.id)
          }
        }
      }
    }
    setSortMenuOpen(false)
    setSelectedIds(new Set())
    onRefresh()
    setToast('Cleared all saved items')
  }

  function toggleSelected(eventId: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(eventId)
      else next.delete(eventId)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function handleBulkApply() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    if (addToBucketList && addToRoadTrip) {
      setPendingRoadTripIds(ids)
      setBulkBucketIds(ids)
      return
    }
    if (addToBucketList) {
      setBulkBucketIds(ids)
      return
    }
    if (addToRoadTrip) {
      setBulkRoadTripIds(ids)
    }
  }

  function finishBulkActions(message: string) {
    setSelectedIds(new Set())
    onRefresh()
    setToast(message)
  }

  function handleTabChange(tab: LibraryTab) {
    setActiveTab(tab)
    clearSelection()
  }

  return (
    <>
      <div className="flex border-b border-brown/10">
        <TabButton
          active={activeTab === 'saved'}
          icon={BookmarkIcon}
          label="Saved"
          count={upcomingSaved.length}
          onClick={() => handleTabChange('saved')}
        />
        <TabButton
          active={activeTab === 'past'}
          icon={CalendarDaysIcon}
          label="Past"
          count={pastEvents.length}
          onClick={() => handleTabChange('past')}
        />
      </div>

      {activeTab === 'saved' && (
        <div ref={toolbarRef} className="relative mt-3 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-muted"
              aria-hidden
            />
            <input
              type="search"
              value={savedSearch}
              onChange={(e) => setSavedSearch(e.target.value)}
              placeholder="Search saved..."
              className={`${appFieldClass} py-2 pl-9 pr-3`}
            />
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Filter by time"
              aria-expanded={timeFilterOpen}
              onClick={() => {
                setTimeFilterOpen((open) => !open)
                setSortMenuOpen(false)
              }}
              className="theme-accent-border theme-accent-icon flex h-9 items-center gap-0.5 rounded-[14px] border bg-app-elevated px-2 shadow-sm transition hover:opacity-90 active:scale-[0.98]"
            >
              <ClockIcon className="theme-accent-icon h-4 w-4" aria-hidden />
              <ChevronDownIcon
                className={`h-3.5 w-3.5 text-brown-muted transition ${timeFilterOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>

            {timeFilterOpen && (
              <div className="absolute right-0 top-full z-30 mt-1.5 min-w-[168px] overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated py-1 shadow-lg">
                {TIME_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setTimeFilter(option.id)
                      setTimeFilterOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brown transition hover:bg-cream/80"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        timeFilter === option.id
                          ? 'theme-accent-fill'
                          : 'border-brown/25 bg-white'
                      }`}
                      aria-hidden
                    >
                      {timeFilter === option.id && (
                        <span className="h-1.5 w-1.5 rounded-[14px] bg-white" />
                      )}
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Sort and view options"
              aria-expanded={sortMenuOpen}
              onClick={() => {
                setSortMenuOpen((open) => !open)
                setTimeFilterOpen(false)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-app-subtle bg-app-elevated text-brown-muted shadow-sm transition hover:border-white/20 hover:text-brown active:scale-[0.98]"
            >
              <EllipsisVerticalIcon className="h-4 w-4" aria-hidden />
            </button>

            {sortMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated py-2 shadow-lg">
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-brown-muted">
                  Sort by
                </p>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSortBy(option.id)
                      setSortMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-cream/80 ${
                      sortBy === option.id ? 'theme-accent-selected' : 'text-brown'
                    }`}
                  >
                    <option.icon className="h-4 w-4 shrink-0" aria-hidden />
                    {option.label}
                  </button>
                ))}

                <div className="my-1 border-t border-brown/10" />

                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-brown-muted">
                  View
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setListView(true)
                    setSortMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-cream/80 ${
                    listView ? 'theme-accent-selected' : 'text-brown'
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4 shrink-0" aria-hidden />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListView(false)
                    setSortMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-cream/80 ${
                    !listView ? 'theme-accent-selected' : 'text-brown'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4 shrink-0" aria-hidden />
                  Grid
                </button>

                <div className="my-1 border-t border-brown/10" />

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={upcomingSaved.length === 0}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-maroon transition hover:bg-maroon/5 disabled:opacity-40"
                >
                  <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3">
        {activeTab === 'saved' &&
          (filteredSavedEvents.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-app-subtle bg-app-elevated px-4 py-8 text-center">
              <p className="text-sm text-brown-muted">
                {upcomingSaved.length === 0 ? 'Nothing saved yet.' : 'No matches for your filters.'}
              </p>
              {upcomingSaved.length === 0 && (
                <GradientButton to="/discover" fullWidth className="mt-3 py-2.5 text-xs">
                  Browse Things Tudu
                </GradientButton>
              )}
            </div>
          ) : listView ? (
            <ul className="divide-y divide-app-subtle overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated">
              {filteredSavedEvents.map((event) => (
                <li key={event.id}>
                  <SavedEventListRow
                    event={event}
                    selectable
                    selected={selectedIds.has(event.id)}
                    onSelectChange={(selected) => toggleSelected(event.id, selected)}
                    onOpen={() => setDetailEvent(event)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {filteredSavedEvents.map((event) => (
                <li key={event.id}>
                  <SavedEventCard
                    event={event}
                    onViewEvent={() => setDetailEvent(event)}
                    onRemove={() => handleRemoveSaved(event.id)}
                    onMoveToList={() => setMoveListEventId(event.id)}
                  />
                </li>
              ))}
            </ul>
          ))}

        {activeTab === 'past' &&
          (pastEvents.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-app-subtle bg-app-elevated px-6 py-8 text-center">
              <p className="text-sm text-brown-muted">No past events yet.</p>
            </div>
          ) : listView ? (
            <ul className="divide-y divide-app-subtle overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated">
              {pastEvents.map(({ event }) => (
                <li key={event.id}>
                  <SavedEventListRow
                    event={event}
                    isPast
                    onOpen={() => setDetailEvent(event)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {pastEvents.map(({ event }) => (
                <li key={event.id}>
                  <SavedEventCard
                    event={event}
                    isPast
                    showMenu={false}
                    onViewEvent={() => setDetailEvent(event)}
                  />
                </li>
              ))}
            </ul>
          ))}
      </div>

      {activeTab === 'saved' && (
        <SavedBulkActionBar
          selectedCount={selectedIds.size}
          addToBucketList={addToBucketList}
          addToRoadTrip={addToRoadTrip}
          onToggleBucketList={() => setAddToBucketList((value) => !value)}
          onToggleRoadTrip={() => setAddToRoadTrip((value) => !value)}
          onApply={handleBulkApply}
          onClearSelection={clearSelection}
        />
      )}

      {moveListEvent && (
        <AddToBucketListModal
          eventIds={[moveListEvent.id]}
          eventTitle={moveListEvent.title}
          onClose={() => setMoveListEventId(null)}
          onSuccess={(listName) => {
            setMoveListEventId(null)
            onRefresh()
            setToast(`Added to ${listName}`)
          }}
        />
      )}

      {bulkBucketIds && (
        <AddToBucketListModal
          eventIds={bulkBucketIds}
          onClose={() => {
            setBulkBucketIds(null)
            setPendingRoadTripIds(null)
          }}
          onSuccess={(listName) => {
            setBulkBucketIds(null)
            if (pendingRoadTripIds) {
              setBulkRoadTripIds(pendingRoadTripIds)
              setPendingRoadTripIds(null)
              setToast(`Added to ${listName}. Pick a road trip next.`)
            } else {
              finishBulkActions(`Added to ${listName}`)
            }
          }}
        />
      )}

      {bulkRoadTripIds && userEmail && (
        <AddToRoadTripModal
          eventIds={bulkRoadTripIds}
          userEmail={userEmail}
          onClose={() => setBulkRoadTripIds(null)}
          onSuccess={(trip) => {
            addStopsToRoadTrip(trip.id, bulkRoadTripIds)
            setBulkRoadTripIds(null)
            finishBulkActions(`Added to ${trip.name}`)
          }}
        />
      )}

      {detailEvent && (
        <DiscoverEventDetailPanel
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onSave={() => setDetailEvent(null)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
