import { useMemo, useRef, useState } from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import type { BucketList, CustomBucketListItem } from '../../types/bucketList'
import type { DiscoverEvent } from '../../data/discoverEvents'
import {
  addEventsToBucketList,
  removeEventFromBucketList,
  resolveEventFromAnySource,
  resolveListDisplayEvents,
  updateBucketList,
} from '../../lib/bucketLists'
import SavedEventPicker from '../road-trip/SavedEventPicker'
import { getSavedEventIdsForUser } from '../../lib/savedEvents'
import { FieldLabel, TextInput } from '../create-event/CreateEventLayout'
import { appFieldClass } from '../../lib/formFieldClasses'
import {
  IMAGE_ACCEPT,
  mediaUploadErrorMessage,
  readMediaFileAsDataUrl,
} from '../../lib/mediaUpload'

type BucketListItemsStepProps = {
  list: BucketList
  userEmail: string
  onRefresh: () => void
}

function newCustomItem(): CustomBucketListItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    image: '',
    mediaType: 'image',
    location: '',
  }
}

export default function BucketListItemsStep({ list, userEmail, onRefresh }: BucketListItemsStepProps) {
  const [savedSearch, setSavedSearch] = useState('')
  const [draftCustom, setDraftCustom] = useState<CustomBucketListItem>(() => newCustomItem())
  const [customError, setCustomError] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const displayEvents = useMemo(() => resolveListDisplayEvents(list), [list])
  const selectedIds = useMemo(() => new Set(list.eventIds), [list.eventIds])

  const savedEvents = useMemo(() => {
    return getSavedEventIdsForUser(userEmail)
      .map((id) => resolveEventFromAnySource(id))
      .filter(Boolean) as DiscoverEvent[]
  }, [userEmail, list.eventIds])

  const heroUrl = list.coverImageUrl?.trim() || ''

  function handleToggleSaved(eventId: string, selected: boolean) {
    if (selected) addEventsToBucketList(list.id, [eventId])
    else removeEventFromBucketList(list.id, eventId)
    onRefresh()
  }

  function handleRemoveCustom(itemId: string) {
    const next = (list.customItems ?? []).filter((item) => item.id !== itemId)
    updateBucketList(list.id, { customItems: next })
    onRefresh()
  }

  async function handleCustomImage(file: File | undefined) {
    if (!file) return
    setCustomError('')
    const result = await readMediaFileAsDataUrl(file)
    if ('error' in result) {
      setCustomError(mediaUploadErrorMessage(result.error))
      return
    }
    setDraftCustom((prev) => ({ ...prev, image: result.dataUrl }))
  }

  function handleAddCustom() {
    const title = draftCustom.title.trim()
    const image = draftCustom.image.trim()
    const location = draftCustom.location?.trim() ?? ''
    if (!title || !image || !location) {
      setCustomError('Add a title, location, and photo for custom items.')
      return
    }
    setCustomError('')
    const next = [...(list.customItems ?? []), { ...draftCustom, title, image, location }]
    updateBucketList(list.id, { customItems: next })
    setDraftCustom(newCustomItem())
    onRefresh()
  }

  return (
    <section className="space-y-5 pt-3">
      {heroUrl && (
        <div className="overflow-hidden rounded-[14px] border border-app-subtle">
          <img src={heroUrl} alt="" className="h-28 w-full object-cover" />
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brown-muted">
          On this list ({displayEvents.length})
        </p>
        {displayEvents.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-app-subtle bg-app-elevated px-4 py-6 text-center">
            <p className="text-sm text-brown-muted">No items yet — add from saved events or create your own.</p>
          </div>
        ) : (
          <ul className="divide-y divide-app-subtle overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated">
            {displayEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 p-3">
                <img
                  src={event.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-[10px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brown">{event.title}</p>
                  <p className="truncate text-xs text-brown-muted">{event.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (list.eventIds.includes(event.id)) {
                      removeEventFromBucketList(list.id, event.id)
                    } else {
                      handleRemoveCustom(event.id)
                    }
                    onRefresh()
                  }}
                  className="rounded-full p-2 text-brown-muted hover:bg-error/10 hover:text-error"
                  aria-label={`Remove ${event.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <FieldLabel>Add from saved</FieldLabel>
        <div className="relative mt-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted"
          />
          <input
            type="search"
            value={savedSearch}
            onChange={(e) => setSavedSearch(e.target.value)}
            placeholder="Search saved events"
            className={`${appFieldClass} w-full pl-9 text-sm`}
          />
        </div>
        <div className="mt-3">
          <SavedEventPicker
            events={savedEvents}
            selectedIds={selectedIds}
            onToggle={handleToggleSaved}
            searchQuery={savedSearch}
          />
        </div>
      </div>

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-brown-muted">Custom item</p>
        <div className="mt-3 space-y-3">
          <TextInput
            value={draftCustom.title}
            onChange={(title) => setDraftCustom((prev) => ({ ...prev, title }))}
            placeholder="Title — e.g. Northern lights in Churchill"
          />
          <TextInput
            value={draftCustom.location ?? ''}
            onChange={(location) => setDraftCustom((prev) => ({ ...prev, location }))}
            placeholder="Location — e.g. Churchill, MB"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-[14px] border border-app-subtle bg-cream px-3 py-2 text-xs font-semibold text-brown"
            >
              {draftCustom.image ? 'Change photo' : 'Upload photo'}
            </button>
            {draftCustom.image && (
              <>
                <img
                  src={draftCustom.image}
                  alt=""
                  className="h-12 w-12 rounded-[10px] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setDraftCustom((prev) => ({ ...prev, image: '' }))}
                  className="rounded-full p-1 text-brown-muted hover:text-error"
                  aria-label="Remove photo"
                >
                  <X size={14} />
                </button>
              </>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => void handleCustomImage(e.target.files?.[0])}
            />
          </div>
          {customError && <p className="text-xs text-error">{customError}</p>}
          <button
            type="button"
            onClick={handleAddCustom}
            className="inline-flex items-center gap-1 rounded-[14px] bg-orange/15 px-4 py-2 text-sm font-semibold text-orange"
          >
            <Plus size={16} />
            Add to list
          </button>
        </div>
      </div>
    </section>
  )
}
