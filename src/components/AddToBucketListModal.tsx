import { useState } from 'react'
import {
  addEventsToBucketList,
  createBucketList,
  getBucketLists,
} from '../lib/bucketLists'
import type { BucketList } from '../types/bucketList'

type AddToBucketListModalProps = {
  eventIds: string[]
  eventTitle?: string
  onClose: () => void
  onSuccess: (listName: string) => void
}

export default function AddToBucketListModal({
  eventIds,
  eventTitle,
  onClose,
  onSuccess,
}: AddToBucketListModalProps) {
  const [lists, setLists] = useState<BucketList[]>(() => getBucketLists())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  function handleSelectList(listId: string) {
    const list = addEventsToBucketList(listId, eventIds)
    if (list) {
      // Haptic recommendation: medium impact (Expo Haptics ImpactFeedbackStyle.Medium)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12)
      }
      onSuccess(list.name)
    }
  }

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const list = createBucketList(name, eventIds)
    // Haptic recommendation: success notification pattern
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([8, 40, 8])
    }
    onSuccess(list.name)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/70 backdrop-blur-sm"
        aria-label="Close bucket list picker"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bucket-picker-title"
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[calc(var(--z-modal)+1)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[var(--radius-xl)] glass-surface p-5 shadow-float"
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-tagline">Now you know</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <h2 id="bucket-picker-title" className="font-display text-lg font-bold text-white">
          Save to Bucket List
        </h2>
        <p className="mt-1 text-sm text-white/60">
          {eventTitle ? `"${eventTitle}"` : `${eventIds.length} experience${eventIds.length === 1 ? '' : 's'}`}
        </p>

        {creating ? (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Summer in Saskatchewan"
              autoFocus
              className="w-full rounded-[var(--radius-lg)] border border-white/10 bg-midnight px-4 py-3 text-sm text-white outline-none focus:border-orange/50"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex h-11 flex-1 items-center justify-center rounded-full bg-gradient-tudu text-sm font-bold text-white disabled:opacity-50"
              >
                Create &amp; Save
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {lists.length === 0 && (
              <p className="rounded-[var(--radius-lg)] bg-white/5 px-4 py-6 text-center text-sm text-white/50">
                No lists yet — create your first bucket list below.
              </p>
            )}
            {lists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => handleSelectList(list.id)}
                className="flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-midnight px-4 py-3 text-left transition hover:border-orange/40 hover:bg-midnight-surface"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-orange/15 text-lg">
                  🪣
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-semibold text-white">
                    {list.name}
                  </span>
                  <span className="text-xs text-white/50">
                    {list.eventIds.length} item{list.eventIds.length === 1 ? '' : 's'}
                  </span>
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setCreating(true)
                setLists(getBucketLists())
              }}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-white/20 py-3 font-display text-sm font-bold text-orange"
            >
              <span aria-hidden>＋</span>
              Create New List
            </button>
          </div>
        )}
      </div>
    </>
  )
}
