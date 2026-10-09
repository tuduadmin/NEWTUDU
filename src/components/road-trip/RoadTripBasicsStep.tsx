import { useRef, useState, type KeyboardEventHandler } from 'react'
import { ImagePlus, Plus, X } from 'lucide-react'
import type { RoadTrip } from '../../lib/roadTrips'
import {
  DEFAULT_ROAD_TRIP_DETOUR_KM,
  getTripPlannedCities,
  normalizePlannedCity,
} from '../../lib/roadTripRoute'
import RoadTripFollowerPicker from './RoadTripFollowerPicker'
import { FieldHelper, FieldLabel, TextInput } from '../create-event/CreateEventLayout'
import { IMAGE_ACCEPT } from '../../lib/mediaUpload'
import {
  compressImageFile,
  ImageCompressError,
  PROFILE_STORAGE_QUOTA_MESSAGE,
} from '../../lib/imageCompress'

type RoadTripBasicsStepProps = {
  trip: RoadTrip
  onUpdate: (partial: {
    name?: string
    plannedCities?: string[]
    taggedFollowerIds?: string[]
    coverImageUrl?: string
  }) => boolean
}

export default function RoadTripBasicsStep({ trip, onUpdate }: RoadTripBasicsStepProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const cities = getTripPlannedCities(trip)
  const [draftCity, setDraftCity] = useState('')

  const coverUrl = trip.coverImageUrl?.trim() || ''

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

  function addCity() {
    const next = normalizePlannedCity(draftCity)
    if (!next) return
    const exists = cities.some((c) => c.toLowerCase() === next.toLowerCase())
    if (exists) {
      setDraftCity('')
      return
    }
    onUpdate({ plannedCities: [...cities, next] })
    setDraftCity('')
  }

  function removeCity(index: number) {
    onUpdate({ plannedCities: cities.filter((_, i) => i !== index) })
  }

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCity()
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
                  {trip.name.trim() || 'Your trip title'}
                </p>
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
        <FieldLabel required>Trip Title</FieldLabel>
        <TextInput
          value={trip.name}
          onChange={(name) => onUpdate({ name })}
          placeholder="e.g. Weekend to Saskatoon"
        />
      </div>

      <div>
        <FieldLabel>Planned stops</FieldLabel>
        <FieldHelper>
          Cities you&apos;ll drive through, in order. Events within{' '}
          {trip.detourKm ?? DEFAULT_ROAD_TRIP_DETOUR_KM} km of this route show up when you find
          stops.
        </FieldHelper>

        {cities.length > 0 && (
          <ol className="mt-3 space-y-2">
            {cities.map((city, index) => (
              <li
                key={`${index}-${city}`}
                className="flex items-center gap-2 rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-2"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange/15 text-[11px] font-bold text-orange">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brown">
                  {city}
                </span>
                <button
                  type="button"
                  onClick={() => removeCity(index)}
                  className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-brown-muted transition hover:bg-error/10 hover:text-error"
                  aria-label={`Remove ${city}`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-3 flex gap-2">
          <TextInput
            value={draftCity}
            onChange={setDraftCity}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Kindersley, Saskatoon"
          />
          <button
            type="button"
            onClick={addCity}
            disabled={!draftCity.trim()}
            className="inline-flex shrink-0 items-center gap-1 rounded-[14px] border border-orange/30 bg-orange/10 px-3 py-2 text-xs font-bold text-orange transition hover:border-orange/50 disabled:opacity-40"
          >
            <Plus size={14} />
            Add stop
          </button>
        </div>
      </div>

      <div className="border-t border-app-subtle pt-4">
        <RoadTripFollowerPicker
          taggedFollowerIds={trip.taggedFollowerIds ?? []}
          onChange={(taggedFollowerIds) => onUpdate({ taggedFollowerIds })}
        />
      </div>
    </section>
  )
}
