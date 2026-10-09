import { useState } from 'react'
import { Bookmark, Plus, X } from 'lucide-react'
import {
  addEventsToBucketList,
  createBucketList,
  getMyBucketLists,
} from '../lib/bucketLists'
import { appFieldClassLg } from '../lib/formFieldClasses'
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
  const [lists, setLists] = useState<BucketList[]>(() => getMyBucketLists())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  function handleSelectList(listId: string) {
    const list = addEventsToBucketList(listId, eventIds)
    if (list) {
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
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([8, 40, 8])
    }
    onSuccess(list.name)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm"
        aria-label="Close bucket list picker"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bucket-picker-title"
        className="fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] left-1/2 z-[calc(var(--z-modal)+1)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[14px] border border-app-subtle bg-app-elevated p-5 shadow-float"
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-tagline">Now you know</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-brown-muted transition hover:bg-cream-dark hover:text-brown"
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <h2 id="bucket-picker-title" className="font-display text-lg font-bold text-brown">
          Save to Bucket List
        </h2>
        <p className="mt-1 text-sm text-brown-muted">
          {eventTitle ? `"${eventTitle}"` : `${eventIds.length} experience${eventIds.length === 1 ? '' : 's'}`}
        </p>
        <p className="mt-2 text-xs text-brown-muted/80">
          Saved items also appear in My Tudu under <strong className="text-brown">Your Saved</strong>.
        </p>

        {creating ? (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Summer in Saskatchewan"
              autoFocus
              className={`${appFieldClassLg} px-4 py-3`}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-[14px] border border-brown/15 text-sm font-semibold text-brown"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex h-11 flex-1 items-center justify-center rounded-[14px] bg-gradient-tudu text-sm font-bold text-white disabled:opacity-50"
              >
                Create &amp; Save
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {lists.length === 0 && (
              <p className="rounded-[14px] bg-cream-dark px-4 py-6 text-center text-sm text-brown-muted">
                No lists yet — create your first bucket list below.
              </p>
            )}
            {lists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => handleSelectList(list.id)}
                className="flex min-h-[56px] w-full items-center gap-3 rounded-[14px] border border-brown/10 bg-cream/40 px-4 py-3 text-left transition hover:border-orange/40 hover:bg-orange/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-orange/10 text-orange">
                  <Bookmark size={20} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-semibold text-brown">
                    {list.name}
                  </span>
                  <span className="text-xs text-brown-muted">
                    {list.eventIds.length} item{list.eventIds.length === 1 ? '' : 's'}
                  </span>
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setCreating(true)
                setLists(getMyBucketLists())
              }}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-brown/20 py-3 font-display text-sm font-bold text-orange"
            >
              <Plus size={18} aria-hidden />
              Create New List
            </button>
          </div>
        )}
      </div>
    </>
  )
}
