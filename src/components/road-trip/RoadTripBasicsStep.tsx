import { useState, type KeyboardEventHandler } from 'react'
import { Plus, X } from 'lucide-react'
import type { RoadTrip } from '../../lib/roadTrips'
import {
  DEFAULT_ROAD_TRIP_DETOUR_KM,
  getTripPlannedCities,
  normalizePlannedCity,
} from '../../lib/roadTripRoute'
import RoadTripFollowerPicker from './RoadTripFollowerPicker'
import { FieldHelper, FieldLabel, TextInput } from '../create-event/CreateEventLayout'

type RoadTripBasicsStepProps = {
  trip: RoadTrip
  onUpdate: (partial: {
    name?: string
    plannedCities?: string[]
    taggedFollowerIds?: string[]
  }) => void
}

export default function RoadTripBasicsStep({ trip, onUpdate }: RoadTripBasicsStepProps) {
  const cities = getTripPlannedCities(trip)
  const [draftCity, setDraftCity] = useState('')

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
