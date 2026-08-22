import type { DiscoverEvent } from '../../data/discoverEvents'
import SavedEventListRow from '../my-tudu/SavedEventListRow'
import { filterAndSortSavedEvents } from '../../lib/savedEventDisplay'
import { splitEventsByPast } from '../../lib/savedEventDates'

type SavedEventPickerProps = {
  events: DiscoverEvent[]
  selectedIds: Set<string>
  onToggle: (eventId: string, selected: boolean) => void
  searchQuery?: string
  emptyMessage?: string
}

export default function SavedEventPicker({
  events,
  selectedIds,
  onToggle,
  searchQuery = '',
  emptyMessage = 'Nothing saved yet. Swipe right on Discover to save events.',
}: SavedEventPickerProps) {
  const upcoming = splitEventsByPast(events.map((event) => ({ event }))).upcoming.map(
    (item) => item.event,
  )
  const filtered = filterAndSortSavedEvents(upcoming, searchQuery, 'any', 'soonest')

  if (filtered.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-app-subtle bg-app-elevated px-4 py-6 text-center">
        <p className="text-sm text-brown-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-app-subtle overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated">
      {filtered.map((event) => (
        <li key={event.id}>
          <SavedEventListRow
            event={event}
            selectable
            selected={selectedIds.has(event.id)}
            onSelectChange={(selected) => onToggle(event.id, selected)}
            onOpen={() => onToggle(event.id, !selectedIds.has(event.id))}
          />
        </li>
      ))}
    </ul>
  )
}
