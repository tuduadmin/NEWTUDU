import {
  Accessibility,
  Baby,
  Banknote,
  Bath,
  Bus,
  Car,
  ChevronDown,
  ChevronUp,
  Coffee,
  Dog,
  Droplets,
  Home,
  ParkingCircle,
  Plus,
  Shield,
  Stethoscope,
  Tent,
  Trash2,
  TreePine,
  UtensilsCrossed,
  Wifi,
  Wine,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import type { HostEventFormData, TicketTier } from '../../lib/account'
import { ADDITIONAL_AMENITIES, PRIMARY_AMENITIES } from '../../data/eventCategories'
import { FieldLabel, TextInput } from './CreateEventLayout'

type FinalStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
  updateTicketTier: (tierId: string, partial: Partial<TicketTier>) => void
  addTicketTier: () => void
  removeTicketTier: (tierId: string) => void
}

const AGE_OPTIONS = [
  { id: 'all-ages' as const, label: 'All Ages' },
  { id: 'family-friendly' as const, label: 'Family Friendly' },
  { id: '18+' as const, label: '18+' },
]

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'food-drink': <UtensilsCrossed size={16} className="text-orange" />,
  alcohol: <Wine size={16} className="text-orange" />,
  bathrooms: <Bath size={16} className="text-orange" />,
  parking: <ParkingCircle size={16} className="text-orange" />,
  wheelchair: <Accessibility size={16} className="text-orange" />,
  wifi: <Wifi size={16} className="text-orange" />,
  'kid-friendly': <Baby size={16} className="text-orange" />,
  'baby-changing': <Baby size={16} className="text-orange" />,
  'pet-friendly': <Dog size={16} className="text-orange" />,
  power: <Zap size={16} className="text-orange" />,
  water: <Droplets size={16} className="text-orange" />,
  atm: <Banknote size={16} className="text-orange" />,
  'ev-charging': <Zap size={16} className="text-orange" />,
  security: <Shield size={16} className="text-orange" />,
  medical: <Stethoscope size={16} className="text-orange" />,
  lodging: <Home size={16} className="text-orange" />,
  camping: <Tent size={16} className="text-orange" />,
  'camper-trailers': <Car size={16} className="text-orange" />,
  'outdoor-seating': <TreePine size={16} className="text-orange" />,
  transit: <Bus size={16} className="text-orange" />,
}

export default function FinalStep({
  form,
  updateForm,
  updateTicketTier,
  addTicketTier,
  removeTicketTier,
}: FinalStepProps) {
  const [showAdditional, setShowAdditional] = useState(false)

  function toggleAmenity(id: string) {
    const current = form.amenities
    if (current.includes(id)) {
      updateForm({ amenities: current.filter((a) => a !== id) })
    } else {
      updateForm({ amenities: [...current, id] })
    }
  }

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Final Details</h2>
      <p className="mt-1 text-sm text-brown-muted">Ticketing, rules, and what to expect.</p>

      <div className="mt-5 space-y-6">
        <div>
          <h3 className="font-display text-sm font-bold text-brown">Ticketing</h3>
          <p className="mt-0.5 text-xs text-brown-muted">
            Set your price tiers. If your event is free, simply leave the price as $0.
          </p>

          <div className="mt-3 space-y-4">
            {form.ticketTiers.map((tier, index) => (
              <TierEditor
                key={tier.id}
                tier={tier}
                index={index}
                canRemove={form.ticketTiers.length > 1}
                onUpdate={(partial) => updateTicketTier(tier.id, partial)}
                onRemove={() => removeTicketTier(tier.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addTicketTier}
            className="mt-3 flex items-center gap-1 text-sm font-bold text-orange"
          >
            <Plus size={16} />
            Add Another Price Tier
          </button>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brown">Age Restriction</h3>
          <p className="mt-0.5 text-xs text-brown-muted">
            Who is this event for? Setting this accurately helps recommend it to the right demographic.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {AGE_OPTIONS.map((opt) => {
              const selected = form.ageRestriction === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateForm({ ageRestriction: opt.id })}
                  className={`rounded-[var(--radius-lg)] border-2 px-2 py-3 text-xs font-bold transition ${
                    selected
                      ? 'border-orange bg-orange/10 text-orange'
                      : 'border-brown/10 bg-white text-brown hover:border-orange/30'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] text-brown-muted">
            Please select one — this helps Tudu show your event to the right audience.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brown">Amenities</h3>
          <p className="mt-0.5 text-xs text-brown-muted">
            What can your guests expect? Help them prepare for an amazing time by listing out the on-site
            facilities.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PRIMARY_AMENITIES.map((amenity) => (
              <AmenityCheckbox
                key={amenity.id}
                label={amenity.label}
                icon={AMENITY_ICONS[amenity.id] ?? <Coffee size={16} className="text-orange" />}
                checked={form.amenities.includes(amenity.id)}
                onChange={() => toggleAmenity(amenity.id)}
              />
            ))}
          </div>

          <div className="mt-3 rounded-[var(--radius-lg)] border border-brown/10 bg-cream-dark/50">
            <button
              type="button"
              onClick={() => setShowAdditional((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-bold text-brown">Additional Amenities</p>
                <p className="text-[10px] text-brown-muted">
                  The more you add, the better Tudu can match your event.
                </p>
              </div>
              {showAdditional ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showAdditional && (
              <div className="space-y-4 border-t border-brown/10 px-4 pb-4 pt-3">
                {Object.entries(ADDITIONAL_AMENITIES).map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brown-muted">{group}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((amenity) => (
                        <AmenityCheckbox
                          key={amenity.id}
                          label={amenity.label}
                          icon={AMENITY_ICONS[amenity.id] ?? <Coffee size={16} className="text-orange" />}
                          checked={form.amenities.includes(amenity.id)}
                          onChange={() => toggleAmenity(amenity.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function TierEditor({
  tier,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  tier: TicketTier
  index: number
  canRemove: boolean
  onUpdate: (partial: Partial<TicketTier>) => void
  onRemove: () => void
}) {
  const priceDisplay = tier.priceCents === 0 ? 'FREE' : `$${(tier.priceCents / 100).toFixed(2)}`

  function handlePriceChange(raw: string) {
    const cleaned = raw.replace(/[^0-9.]/g, '')
    if (cleaned === '' || cleaned.toLowerCase() === 'free') {
      onUpdate({ priceCents: 0 })
      return
    }
    const dollars = parseFloat(cleaned)
    if (!Number.isNaN(dollars)) {
      onUpdate({ priceCents: Math.round(Math.min(dollars, 9999) * 100) })
    }
  }

  function handleQuantityChange(raw: string) {
    if (raw === '' || raw === '∞') {
      onUpdate({ quantity: null })
      return
    }
    const num = parseInt(raw.replace(/\D/g, ''), 10)
    if (!Number.isNaN(num)) {
      onUpdate({ quantity: Math.min(2000, Math.max(0, num)) })
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-brown/10 bg-white p-3">
      {index > 0 && (
        <div className="mb-2 flex justify-end">
          <button type="button" onClick={onRemove} disabled={!canRemove} className="text-brown-muted disabled:opacity-30">
            <Trash2 size={14} />
          </button>
        </div>
      )}
      <div className="grid grid-cols-[1fr_72px_56px] gap-2">
        <div>
          <FieldLabel required>Tier Name</FieldLabel>
          <TextInput
            value={tier.name}
            onChange={(name) => onUpdate({ name })}
            placeholder="e.g. General Admis"
          />
        </div>
        <div>
          <FieldLabel required>Price</FieldLabel>
          <input
            type="text"
            value={tier.priceCents === 0 ? 'FREE' : (tier.priceCents / 100).toString()}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="FREE"
            className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white px-2 py-2.5 text-center text-sm font-bold text-brown outline-none focus:border-purple"
          />
        </div>
        <div>
          <FieldLabel>Qty</FieldLabel>
          <input
            type="text"
            value={tier.quantity == null ? '∞' : tier.quantity.toString()}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="∞"
            className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-white px-1 py-2.5 text-center text-sm text-brown outline-none focus:border-purple"
          />
        </div>
      </div>
      <div className="mt-2">
        <TextInput
          value={tier.description}
          onChange={(description) => onUpdate({ description })}
          placeholder="Description (e.g. Includes 1 drink ticket)"
        />
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs font-medium text-brown">
        <input
          type="checkbox"
          checked={tier.availableAtDoor}
          onChange={(e) => onUpdate({ availableAtDoor: e.target.checked })}
          className="h-4 w-4 rounded accent-orange"
        />
        Available at Door
      </label>
      {tier.priceCents === 0 && (
        <p className="mt-1 text-[10px] text-success-deep">Free tier — attendees will RSVP on the event card</p>
      )}
      {tier.priceCents > 0 && (
        <p className="mt-1 text-[10px] text-brown-muted">Current price: {priceDisplay}</p>
      )}
    </div>
  )
}

function AmenityCheckbox({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-[var(--radius-lg)] border px-3 py-2.5 transition ${
        checked ? 'border-orange/40 bg-orange/5' : 'border-brown/10 bg-white'
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-brown">
        {icon}
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-orange" />
    </label>
  )
}
