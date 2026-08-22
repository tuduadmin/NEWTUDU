import { BookmarkIcon, MapPinIcon } from '@heroicons/react/24/solid'
import GradientButton from '../GradientButton'

type SavedBulkActionBarProps = {
  selectedCount: number
  addToBucketList: boolean
  addToRoadTrip: boolean
  onToggleBucketList: () => void
  onToggleRoadTrip: () => void
  onApply: () => void
  onClearSelection: () => void
}

export default function SavedBulkActionBar({
  selectedCount,
  addToBucketList,
  addToRoadTrip,
  onToggleBucketList,
  onToggleRoadTrip,
  onApply,
  onClearSelection,
}: SavedBulkActionBarProps) {
  if (selectedCount === 0) return null

  const canApply = addToBucketList || addToRoadTrip

  return (
    <div className="sticky bottom-[calc(var(--app-bottom-nav-h)+0.5rem)] z-20 mt-3 rounded-[14px] border border-app-subtle bg-app-elevated p-3 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-brown">
          {selectedCount} selected
        </p>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-[11px] font-semibold text-brown-muted transition hover:text-brown"
        >
          Clear
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-app-subtle bg-cream/50 px-3 py-2 text-xs font-semibold text-brown">
          <input
            type="checkbox"
            checked={addToBucketList}
            onChange={onToggleBucketList}
            className="h-4 w-4 rounded border-brown/25 text-teal-600 focus:ring-teal-600/30"
          />
          <BookmarkIcon className="h-4 w-4 text-teal-600" aria-hidden />
          Bucket list
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-app-subtle bg-cream/50 px-3 py-2 text-xs font-semibold text-brown">
          <input
            type="checkbox"
            checked={addToRoadTrip}
            onChange={onToggleRoadTrip}
            className="h-4 w-4 rounded border-brown/25 text-orange focus:ring-orange/30"
          />
          <MapPinIcon className="h-4 w-4 text-orange" aria-hidden />
          Road trip
        </label>
      </div>

      <GradientButton
        type="button"
        onClick={onApply}
        disabled={!canApply}
        fullWidth
        className="mt-3 py-2.5 text-xs disabled:opacity-40"
      >
        Add selected
      </GradientButton>
    </div>
  )
}
