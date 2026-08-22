import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import BucketListCoverCard from '../../components/BucketListCoverCard'
import MediaTile from '../../components/MediaTile'
import VibeBadge from '../../components/VibeBadge'
import {
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from '../../components/admin/AdminUI'
import {
  adminBucketListToForm,
  bucketListToPublic,
  createAdminBucketList,
  getBucketListById,
  updateAdminBucketList,
  type AdminBucketListInput,
} from '../../lib/bucketLists'
import type { CustomBucketListItem, VibeTag } from '../../types/bucketList'
import {
  IMAGE_ACCEPT,
  VIDEO_ACCEPT,
  isVideoFile,
  mediaUploadErrorMessage,
  readMediaFileAsDataUrl,
} from '../../lib/mediaUpload'

const VIBES: VibeTag[] = [
  'Adventurous',
  'Chill',
  'Romantic',
  'Family',
  'Foodie',
  'Wild',
  'Local',
  'Luxury',
  'Weekend',
  'Road Trip',
]

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'

function emptyItem(): CustomBucketListItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    image: '',
    mediaType: 'image',
    caption: '',
    link: '',
  }
}

function emptyForm(): AdminBucketListInput {
  return {
    name: '',
    description: '',
    coverImageUrl: '',
    customItems: [emptyItem()],
    isPrivate: false,
    vibe: 'Adventurous',
    region: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    ownerName: 'TUDU',
    ownerInitials: 'TU',
    ownerAvatarUrl: '',
    ownerAvatarSecondaryUrl: '',
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return readMediaFileAsDataUrl(file).then((result) => {
    if ('error' in result) throw new Error(result.error)
    return result.dataUrl
  })
}

function AdminOwnerAvatarSlot({
  avatarUrl,
  ringClass,
  emptyBorderClass,
  onFileSelect,
  onRemove,
}: {
  avatarUrl: string
  ringClass: string
  emptyBorderClass: string
  onFileSelect: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadHint = avatarUrl ? 'Tap to change' : 'Tap to upload'

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={avatarUrl ? 'Change avatar' : 'Upload avatar'}
        onClick={() => inputRef.current?.click()}
        className="group relative h-16 w-16 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)] focus-visible:ring-offset-2"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className={`h-16 w-16 rounded-full object-cover ring-2 ${ringClass}`}
          />
        ) : (
          <span
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border border-dashed ${emptyBorderClass} bg-[var(--admin-bg)] text-[var(--admin-text-dim)]`}
          >
            <ImagePlus size={16} />
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Camera size={16} className="text-white" strokeWidth={2} />
          <span className="mt-0.5 text-[9px] font-semibold leading-none text-white">{uploadHint}</span>
        </span>
      </button>
      {avatarUrl && (
        <button
          type="button"
          aria-label="Remove avatar"
          className="absolute -right-1 -top-1 z-10 rounded-full bg-[var(--admin-surface)] p-0.5"
          onClick={onRemove}
        >
          <X size={12} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function AdminBucketListCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const existing = useMemo(() => (editId ? getBucketListById(editId) : undefined), [editId])

  const [form, setForm] = useState<AdminBucketListInput>(() =>
    existing ? adminBucketListToForm(existing) : emptyForm(),
  )
  const [previewItemIndex, setPreviewItemIndex] = useState(0)
  const [coverUrlInput, setCoverUrlInput] = useState('')
  const [error, setError] = useState('')

  const previewPublic = useMemo(() => {
    const draftList = {
      id: editId ?? 'preview',
      name: form.name.trim() || 'Untitled List',
      description: form.description,
      coverImageUrl: form.coverImageUrl || form.customItems?.[0]?.image || DEFAULT_COVER,
      customItems: form.customItems,
      eventIds: form.eventIds ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedIds: [],
      isPrivate: form.isPrivate,
      seededByAdmin: true,
      vibe: form.vibe,
      region: form.region,
      spotifyUrl: form.spotifyUrl,
      appleMusicUrl: form.appleMusicUrl,
      ownerName: form.ownerName,
      ownerInitials: form.ownerInitials,
      ownerAvatarUrl: form.ownerAvatarUrl,
      ownerAvatarSecondaryUrl: form.ownerAvatarSecondaryUrl,
    }
    return bucketListToPublic(draftList) ?? null
  }, [form, editId])

  const previewItems = previewPublic?.events ?? []
  const activePreviewItem = previewItems[previewItemIndex] ?? previewItems[0]

  function updateForm(partial: Partial<AdminBucketListInput>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function updateItem(index: number, partial: Partial<CustomBucketListItem>) {
    const items = [...(form.customItems ?? [])]
    items[index] = { ...items[index], ...partial }
    updateForm({ customItems: items })
  }

  function addItem() {
    updateForm({ customItems: [...(form.customItems ?? []), emptyItem()] })
  }

  function removeItem(index: number) {
    const items = (form.customItems ?? []).filter((_, i) => i !== index)
    updateForm({ customItems: items.length > 0 ? items : [emptyItem()] })
    setPreviewItemIndex(0)
  }

  async function handleCoverFile(file: File | undefined) {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      updateForm({ coverImageUrl: dataUrl })
    } catch (err) {
      setError(mediaUploadErrorMessage(err instanceof Error && err.message === 'too_large' ? 'too_large' : 'read_failed'))
    }
  }

  async function handleOwnerAvatarFile(field: 'ownerAvatarUrl' | 'ownerAvatarSecondaryUrl', file: File | undefined) {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      updateForm({ [field]: dataUrl })
    } catch (err) {
      setError(mediaUploadErrorMessage(err instanceof Error && err.message === 'too_large' ? 'too_large' : 'read_failed'))
    }
  }

  async function handleItemFile(index: number, file: File | undefined) {
    if (!file) return
    try {
      const result = await readMediaFileAsDataUrl(file)
      if ('error' in result) {
        setError(mediaUploadErrorMessage(result.error))
        return
      }

      if (isVideoFile(file)) {
        updateItem(index, { videoUrl: result.dataUrl, mediaType: 'video', image: '' })
      } else {
        updateItem(index, { image: result.dataUrl, mediaType: 'image', videoUrl: undefined })
      }
    } catch {
      setError(mediaUploadErrorMessage('read_failed'))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Title is required.')
      return
    }

    const hasItem = (form.customItems ?? []).some(
      (item) => item.title.trim() || item.image.trim() || item.videoUrl?.trim(),
    )
    if (!hasItem && !(form.eventIds?.length ?? 0)) {
      setError('Add at least one item with a title or image.')
      return
    }

    if (editId) {
      const updated = updateAdminBucketList(editId, form)
      if (!updated) {
        setError('Could not update list.')
        return
      }
    } else {
      createAdminBucketList(form)
    }

    navigate('/admin/content?view=bucket-lists')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={editId ? 'Edit bucket list' : 'Create bucket list'}
        subtitle="Platform-created lists with cover art, reel-style items, and playlist links. Public lists merge into discovery."
        actions={
          <Link to="/admin/content?view=bucket-lists" className="admin-btn admin-btn-secondary no-underline">
            ← Back to lists
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {error && (
            <AdminPanel className="border border-[var(--admin-danger)] text-xs text-[var(--admin-danger)]">
              {error}
            </AdminPanel>
          )}

          <AdminPanel>
            <p className="admin-label mb-3">List details</p>
            <div className="space-y-3">
              <label className="block">
                <span className="admin-label">Title</span>
                <AdminInput
                  className="mt-1 w-full"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="e.g. Saskatchewan Summer Hits"
                  required
                />
              </label>
              <label className="block">
                <span className="admin-label">Description / hook</span>
                <textarea
                  className="admin-input mt-1 min-h-[72px] w-full resize-y"
                  value={form.description ?? ''}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="Short punchy copy for the discovery card"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="admin-label">Region</span>
                  <AdminInput
                    className="mt-1 w-full"
                    value={form.region ?? ''}
                    onChange={(e) => updateForm({ region: e.target.value })}
                    placeholder="Saskatchewan, Canada"
                  />
                </label>
                <label className="block">
                  <span className="admin-label">Vibe</span>
                  <AdminSelect
                    className="mt-1 w-full"
                    value={form.vibe ?? 'Adventurous'}
                    onChange={(e) => updateForm({ vibe: e.target.value as VibeTag })}
                  >
                    {VIBES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </AdminSelect>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="admin-label">Owner display name</span>
                  <AdminInput
                    className="mt-1 w-full"
                    value={form.ownerName ?? ''}
                    onChange={(e) => updateForm({ ownerName: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="admin-label">Owner initials</span>
                  <AdminInput
                    className="mt-1 w-full"
                    maxLength={3}
                    value={form.ownerInitials ?? ''}
                    onChange={(e) => updateForm({ ownerInitials: e.target.value.toUpperCase() })}
                  />
                </label>
              </div>

              <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                <p className="admin-label mb-2">Owner avatar</p>
                <p className="mb-3 text-[10px] text-[var(--admin-text-dim)]">
                  Upload TUDU icon or custom image. Falls back to initials when empty.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold text-[var(--admin-text-muted)]">Primary</p>
                    <AdminOwnerAvatarSlot
                      avatarUrl={form.ownerAvatarUrl ?? ''}
                      ringClass="ring-[var(--admin-accent)]"
                      emptyBorderClass="border-[var(--admin-border)]"
                      onFileSelect={(file) => void handleOwnerAvatarFile('ownerAvatarUrl', file)}
                      onRemove={() => updateForm({ ownerAvatarUrl: '' })}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-semibold text-[var(--admin-text-muted)]">TUDU Black slot</p>
                    <AdminOwnerAvatarSlot
                      avatarUrl={form.ownerAvatarSecondaryUrl ?? ''}
                      ringClass="ring-black"
                      emptyBorderClass="border-black/40"
                      onFileSelect={(file) => void handleOwnerAvatarFile('ownerAvatarSecondaryUrl', file)}
                      onRemove={() => updateForm({ ownerAvatarSecondaryUrl: '' })}
                    />
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="admin-label">Visibility</span>
                <AdminSelect
                  className="mt-1 w-full"
                  value={form.isPrivate ? 'private' : 'public'}
                  onChange={(e) => updateForm({ isPrivate: e.target.value === 'private' })}
                >
                  <option value="public">Public — appears in discovery feed</option>
                  <option value="private">Private — owner device only</option>
                </AdminSelect>
              </label>
            </div>
          </AdminPanel>

          <AdminPanel>
            <p className="admin-label mb-3">Cover image</p>
            <div className="flex flex-wrap gap-2">
              <AdminInput
                className="min-w-[200px] flex-1"
                value={coverUrlInput}
                onChange={(e) => setCoverUrlInput(e.target.value)}
                placeholder="Paste image URL"
              />
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  if (coverUrlInput.trim()) updateForm({ coverImageUrl: coverUrlInput.trim() })
                }}
              >
                Use URL
              </AdminButton>
              <label className="admin-btn admin-btn-secondary cursor-pointer">
                <ImagePlus size={14} className="mr-1 inline" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleCoverFile(e.target.files?.[0])}
                />
              </label>
            </div>
            {(form.coverImageUrl || previewPublic?.coverImage) && (
              <img
                src={form.coverImageUrl || previewPublic?.coverImage}
                alt=""
                className="mt-3 h-32 w-full max-w-xs rounded-[var(--admin-radius)] object-cover"
              />
            )}
          </AdminPanel>

          <AdminPanel>
            <p className="admin-label mb-3">Playlist links</p>
            <div className="space-y-3">
              <label className="block">
                <span className="admin-label">Spotify playlist URL</span>
                <AdminInput
                  className="mt-1 w-full"
                  value={form.spotifyUrl ?? ''}
                  onChange={(e) => updateForm({ spotifyUrl: e.target.value })}
                  placeholder="https://open.spotify.com/playlist/..."
                />
              </label>
              <label className="block">
                <span className="admin-label">Apple Music playlist URL</span>
                <AdminInput
                  className="mt-1 w-full"
                  value={form.appleMusicUrl ?? ''}
                  onChange={(e) => updateForm({ appleMusicUrl: e.target.value })}
                  placeholder="https://music.apple.com/..."
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="mb-3 flex items-center justify-between">
              <p className="admin-label">Items</p>
              <AdminButton type="button" variant="secondary" onClick={addItem}>
                <Plus size={14} className="mr-1 inline" />
                Add item
              </AdminButton>
            </div>
            <p className="mb-1 text-[10px] text-[var(--admin-text-dim)]">Upload MP4 from CapCut (max 8 MB)</p>
            <div className="space-y-4">
              {(form.customItems ?? []).map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--admin-text-muted)]">
                      Item {index + 1}
                    </span>
                    {(form.customItems?.length ?? 0) > 1 && (
                      <button
                        type="button"
                        className="text-[var(--admin-danger)]"
                        onClick={() => removeItem(index)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
                    <div>
                      {item.image || item.videoUrl ? (
                        <div className="relative h-24 w-24 overflow-hidden rounded-[var(--admin-radius)]">
                          <MediaTile
                            src={item.image || item.videoUrl || ''}
                            videoUrl={item.videoUrl}
                            mediaType={item.mediaType}
                            className="h-full w-full object-cover"
                            autoPlay
                            muted
                            loop
                          />
                          <button
                            type="button"
                            className="absolute -right-1 -top-1 rounded-full bg-[var(--admin-surface)] p-0.5"
                            onClick={() =>
                              updateItem(index, { image: '', videoUrl: undefined, mediaType: 'image' })
                            }
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-border)] text-[10px] text-[var(--admin-text-dim)]">
                          <label className="flex cursor-pointer flex-col items-center">
                            <ImagePlus size={16} className="mb-0.5" />
                            Image
                            <input
                              type="file"
                              accept={IMAGE_ACCEPT}
                              className="hidden"
                              onChange={(e) => void handleItemFile(index, e.target.files?.[0])}
                            />
                          </label>
                          <label className="flex cursor-pointer flex-col items-center">
                            Video
                            <input
                              type="file"
                              accept={VIDEO_ACCEPT}
                              className="hidden"
                              onChange={(e) => void handleItemFile(index, e.target.files?.[0])}
                            />
                          </label>
                        </div>
                      )}
                      <AdminInput
                        className="mt-2 w-24 text-[10px]"
                        placeholder="Media URL"
                        value={
                          item.image.startsWith('data:') || item.videoUrl?.startsWith('data:')
                            ? ''
                            : item.image || item.videoUrl || ''
                        }
                        onChange={(e) => {
                          const value = e.target.value
                          if (/\.(mp4|webm|mov)(\?|$)/i.test(value)) {
                            updateItem(index, { videoUrl: value, mediaType: 'video', image: '' })
                          } else {
                            updateItem(index, { image: value, mediaType: 'image', videoUrl: undefined })
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <AdminInput
                        className="w-full"
                        placeholder="Item title"
                        value={item.title}
                        onChange={(e) => updateItem(index, { title: e.target.value })}
                      />
                      <textarea
                        className="admin-input min-h-[56px] w-full resize-y text-xs"
                        placeholder="Caption / write-up"
                        value={item.caption ?? ''}
                        onChange={(e) => updateItem(index, { caption: e.target.value })}
                      />
                      <AdminInput
                        className="w-full text-xs"
                        placeholder="Optional link (tickets, Instagram, etc.)"
                        value={item.link ?? ''}
                        onChange={(e) => updateItem(index, { link: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <div className="flex flex-wrap gap-2">
            <AdminButton type="submit" variant="primary">
              {editId ? 'Save changes' : 'Create bucket list'}
            </AdminButton>
            <Link to="/admin/content?view=bucket-lists" className="admin-btn admin-btn-secondary no-underline">
              Cancel
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <AdminPanel className="!p-0 overflow-hidden">
            <div className="border-b border-[var(--admin-border)] px-3 py-2">
              <p className="admin-label">Reels preview</p>
              <p className="text-[10px] text-[var(--admin-text-dim)]">
                Live preview · 9:16 discovery mockup
              </p>
            </div>

            <div className="bg-[#0B0F1A] p-4">
              <div className="mx-auto w-full max-w-[280px] rounded-[20px] border-4 border-[#1a2332] bg-black p-1 shadow-xl">
                <div className="overflow-hidden rounded-[16px]">
                  {previewPublic ? (
                    <>
                      <div className="scale-[0.72] origin-top -mb-[28%] pointer-events-none">
                        <BucketListCoverCard list={previewPublic} />
                      </div>
                      <div className="border-t border-white/10 px-3 py-2">
                        <div className="mb-2 flex flex-wrap gap-1">
                          <AdminBadge tone="cyan">Platform</AdminBadge>
                          {!form.isPrivate && <AdminBadge tone="emerald">Public</AdminBadge>}
                        </div>
                        {activePreviewItem ? (
                          <div className="relative aspect-[9/14] overflow-hidden rounded-[12px]">
                            <MediaTile
                              src={activePreviewItem.image}
                              videoUrl={activePreviewItem.videoUrl}
                              mediaType={activePreviewItem.mediaType}
                              className="absolute inset-0 h-full w-full object-cover"
                              autoPlay
                              muted
                              loop
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-3">
                              {form.vibe && (
                                <div className="mb-2">
                                  <VibeBadge vibe={form.vibe} />
                                </div>
                              )}
                              <p className="font-display text-sm font-bold text-white">
                                {activePreviewItem.title || 'Item title'}
                              </p>
                              {activePreviewItem.city && (
                                <p className="mt-1 text-[11px] text-white/70">
                                  {activePreviewItem.city}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="py-8 text-center text-[11px] text-white/40">
                            Add items to preview reel
                          </p>
                        )}
                        {previewItems.length > 1 && (
                          <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
                            {previewItems.map((item, idx) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setPreviewItemIndex(idx)}
                                className={`h-12 w-9 shrink-0 overflow-hidden rounded-[4px] border ${
                                  idx === previewItemIndex
                                    ? 'border-[var(--admin-accent)]'
                                    : 'border-white/20'
                                }`}
                              >
                                <MediaTile
                                  src={item.image}
                                  videoUrl={item.videoUrl}
                                  mediaType={item.mediaType}
                                  className="h-full w-full object-cover"
                                  muted
                                />
                              </button>
                            ))}
                          </div>
                        )}
                        {(form.spotifyUrl || form.appleMusicUrl) && (
                          <p className="mt-2 text-center text-[10px] text-white/50">🎵 Soundtrack</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="py-16 text-center text-xs text-white/40">Set visibility to public</p>
                  )}
                </div>
              </div>
            </div>
          </AdminPanel>
        </aside>
      </form>
    </div>
  )
}
