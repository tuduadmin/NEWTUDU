import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import type { BucketList } from '../../types/bucketList'
import type { VibeTag } from '../../types/bucketList'
import { BUCKET_LIST_VIBE_TAGS } from '../../lib/vibeTags'
import { FieldHelper, FieldLabel, TextInput } from '../create-event/CreateEventLayout'
import { appFieldClass } from '../../lib/formFieldClasses'
import VibeBadge from '../VibeBadge'
import { IMAGE_ACCEPT } from '../../lib/mediaUpload'
import {
  compressImageFile,
  ImageCompressError,
  PROFILE_STORAGE_QUOTA_MESSAGE,
} from '../../lib/imageCompress'

type BucketListBasicsStepProps = {
  list: BucketList
  onUpdate: (partial: {
    name?: string
    description?: string
    coverImageUrl?: string
    vibe?: VibeTag
    isPrivate?: boolean
    spotifyUrl?: string
    appleMusicUrl?: string
  }) => boolean
}

export default function BucketListBasicsStep({ list, onUpdate }: BucketListBasicsStepProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)

  const coverUrl = list.coverImageUrl?.trim() || ''

  async function handleCoverFile(file: File | undefined) {
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const dataUrl = await compressImageFile(file)
      const saved = onUpdate({ coverImageUrl: dataUrl })
      if (!saved) {
        setUploadError(PROFILE_STORAGE_QUOTA_MESSAGE)
      }
    } catch (err) {
      setUploadError(
        err instanceof ImageCompressError ? err.message : 'Could not upload image. Try again.',
      )
    } finally {
      setUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  return (
    <section className="space-y-5 pt-3">
      <div>
        <FieldLabel>Cover art</FieldLabel>
        <div className="mt-2 overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-sm">
          {coverUrl ? (
            <div className="relative aspect-[2.2/1] w-full">
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="font-display text-lg font-bold text-white">
                  {list.name.trim() || 'Your list title'}
                </p>
                {list.vibe && (
                  <span className="mt-1 inline-block">
                    <VibeBadge vibe={list.vibe} />
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex aspect-[2.2/1] w-full flex-col items-center justify-center gap-3 bg-cream-dark/40 px-4">
              <p className="text-center text-sm text-brown-muted">No cover art yet</p>
            </div>
          )}
          <div className="border-t border-app-subtle p-3">
            <button
              type="button"
              disabled={uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-app-subtle bg-cream py-3 text-sm font-semibold text-brown transition hover:border-orange/40 hover:text-orange disabled:opacity-60"
              onClick={() => coverInputRef.current?.click()}
            >
              <ImagePlus size={18} strokeWidth={2} />
              {uploading ? 'Uploading…' : coverUrl ? 'Change cover art' : 'Upload cover art'}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => void handleCoverFile(e.target.files?.[0])}
            />
            {uploadError && <p className="mt-2 text-xs text-error">{uploadError}</p>}
          </div>
        </div>
      </div>

      <div>
        <FieldLabel required>List title</FieldLabel>
        <TextInput
          value={list.name}
          onChange={(name) => onUpdate({ name })}
          placeholder="e.g. Saskatchewan Summer Hits"
        />
      </div>

      <div>
        <FieldLabel>Description</FieldLabel>
        <FieldHelper>Short hook for discovery — what makes this list special?</FieldHelper>
        <textarea
          value={list.description ?? ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Chase sunsets, small towns, and live music across the prairies."
          className={`${appFieldClass} mt-2 min-h-[88px] w-full resize-y text-sm`}
        />
      </div>

      <div>
        <FieldLabel>Vibe tag</FieldLabel>
        <select
          value={list.vibe ?? 'Adventurous'}
          onChange={(e) => onUpdate({ vibe: e.target.value as VibeTag })}
          className={`${appFieldClass} mt-1 w-full text-sm`}
        >
          {BUCKET_LIST_VIBE_TAGS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel>Visibility</FieldLabel>
        <select
          value={list.isPrivate ? 'private' : 'public'}
          onChange={(e) => onUpdate({ isPrivate: e.target.value === 'private' })}
          className={`${appFieldClass} mt-1 w-full text-sm`}
        >
          <option value="public">Public — show in Explore</option>
          <option value="private">Private — only you</option>
        </select>
      </div>

      <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-brown-muted">Soundtrack (optional)</p>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-brown-muted">Spotify playlist</span>
          <input
            type="url"
            value={list.spotifyUrl ?? ''}
            onChange={(e) => onUpdate({ spotifyUrl: e.target.value })}
            placeholder="https://open.spotify.com/playlist/..."
            className={`${appFieldClass} mt-1 w-full text-sm`}
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-brown-muted">Apple Music playlist</span>
          <input
            type="url"
            value={list.appleMusicUrl ?? ''}
            onChange={(e) => onUpdate({ appleMusicUrl: e.target.value })}
            placeholder="https://music.apple.com/..."
            className={`${appFieldClass} mt-1 w-full text-sm`}
          />
        </label>
      </div>
    </section>
  )
}
