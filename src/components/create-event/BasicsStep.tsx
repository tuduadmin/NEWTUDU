import { Camera, ImagePlus, MapPin, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import type { HostEventFormData } from '../../lib/account'
import { RECENT_VENUES } from '../../data/eventCategories'
import { FieldLabel, TextArea, TextInput } from './CreateEventLayout'

type BasicsStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
  addPhoto: (dataUrl: string) => void
  removePhoto: (index: number) => void
}

export default function BasicsStep({ form, updateForm, addPhoto, removePhoto }: BasicsStepProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const activeSlot = useRef<number>(0)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') addPhoto(reader.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function openUpload(slot: number) {
    activeSlot.current = slot
    fileRef.current?.click()
  }

  function openCamera(slot: number) {
    activeSlot.current = slot
    cameraRef.current?.click()
  }

  function selectVenue(venue: (typeof RECENT_VENUES)[number]) {
    updateForm({
      venueName: venue.venueName,
      streetAddress: venue.streetAddress,
      city: venue.city,
      province: venue.province,
      country: venue.country,
    })
  }

  const photoSlots = [0, 1, 2]

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">The Essentials</h2>
      <p className="mt-1 text-sm leading-relaxed text-brown-muted">
        Let&apos;s get the basics down. What is your event about and where will it take place? Give
        attendees a clear idea of what to expect.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <FieldLabel required>Event Title</FieldLabel>
          <TextInput
            value={form.title}
            onChange={(title) => updateForm({ title })}
            placeholder="e.g. Summer Fest"
          />
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brown-muted">
            Quick Select: Recent Venues
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {RECENT_VENUES.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => selectVenue(venue)}
                className="min-w-[140px] shrink-0 rounded-[var(--radius-lg)] border border-brown/10 bg-white px-3 py-2.5 text-left transition hover:border-orange/40"
              >
                <p className="truncate text-xs font-bold uppercase text-brown">{venue.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-brown-muted">{venue.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel required>Venue Name</FieldLabel>
          <TextInput
            value={form.venueName}
            onChange={(venueName) => updateForm({ venueName })}
            placeholder="e.g., Community Hall, Tim Hortons, Backyard"
          />
        </div>

        <div>
          <FieldLabel required>Street Address</FieldLabel>
          <div className="relative">
            <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted" />
            <TextInput
              value={form.streetAddress}
              onChange={(streetAddress) => updateForm({ streetAddress })}
              placeholder="Search address or type manually..."
              className="pl-9"
            />
          </div>
          <p className="mt-1 text-[10px] text-brown-muted">
            Select a suggestion to auto-fill city and province, or type the address manually
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <FieldLabel>City</FieldLabel>
            <TextInput value={form.city} onChange={(city) => updateForm({ city })} placeholder="City" />
          </div>
          <div>
            <FieldLabel>Province</FieldLabel>
            <TextInput value={form.province} onChange={(province) => updateForm({ province })} placeholder="Province" />
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <TextInput value={form.country} onChange={(country) => updateForm({ country })} placeholder="Country" />
          </div>
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea
            value={form.description}
            onChange={(description) => updateForm({ description })}
            placeholder="e.g. Join us for a night of live jazz and curated cocktails..."
            rows={5}
            maxLength={4000}
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-brown-muted">
            <span>Minimum 50 characters recommended for better discovery</span>
            <span>{form.description.length}/4000</span>
          </div>
        </div>

        <div>
          <FieldLabel>Event Photos (up to 3)</FieldLabel>
          <p className="mb-3 text-xs text-brown-muted">
            Upload captivating images to draw attendees in. Images will be cropped to a 3:4 portrait
            ratio for the discovery feed.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {photoSlots.map((slot) => {
              const photo = form.photos[slot]
              return (
                <div key={slot} className="flex flex-col gap-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] border border-brown/10 bg-cream-dark">
                    {photo ? (
                      <>
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(slot)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                          aria-label="Remove photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-brown-muted/60">
                        <ImagePlus size={20} />
                        <span className="mt-1 text-[10px]">No Image</span>
                      </div>
                    )}
                  </div>
                  {!photo && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => openUpload(slot)}
                        className="flex items-center justify-center gap-1 rounded-md border border-brown/10 bg-white py-1.5 text-[10px] font-semibold text-brown"
                      >
                        <ImagePlus size={12} />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => openCamera(slot)}
                        className="flex items-center justify-center gap-1 rounded-md border border-brown/10 bg-white py-1.5 text-[10px] font-semibold text-brown"
                      >
                        <Camera size={12} />
                        Take Photo
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
    </section>
  )
}
