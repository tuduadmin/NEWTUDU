import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Car,
  Church,
  Clock,
  Gem,
  GraduationCap,
  Heart,
  Landmark,
  MapPin,
  Music,
  Palette,
  Plus,
  Search,
  ShoppingCart,
  Snowflake,
  Trash2,
  Upload,
  UtensilsCrossed,
  Wine,
} from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'

type Category = {
  id: string
  label: string
  icon: React.ReactNode
}

const HIDDEN_GEM_CATEGORIES: Category[] = [
  { id: 'music', label: 'Music', icon: <Music size={16} /> },
  { id: 'arts-culture', label: 'Arts & Culture', icon: <Palette size={16} /> },
  { id: 'lifestyle', label: 'Lifestyle & Wellness', icon: <Heart size={16} /> },
  { id: 'community', label: 'Community & Causes', icon: <Heart size={16} /> },
  { id: 'faith', label: 'Faith & Spirituality', icon: <Church size={16} /> },
  { id: 'sports', label: 'Sports & Fitness', icon: <Heart size={16} /> },
  { id: 'business', label: 'Business & Professional', icon: <Landmark size={16} /> },
  { id: 'food-drink', label: 'Food & Drink', icon: <UtensilsCrossed size={16} /> },
  { id: 'nightlife', label: 'Nightlife & Social', icon: <Wine size={16} /> },
  { id: 'health', label: 'Health & Medical', icon: <Heart size={16} /> },
  { id: 'holiday', label: 'Holiday & Seasonal', icon: <Snowflake size={16} /> },
  { id: 'shopping', label: 'Shopping & Retail', icon: <ShoppingCart size={16} /> },
  { id: 'education', label: 'Education & Children', icon: <GraduationCap size={16} /> },
  { id: 'government', label: 'Government & Public Services', icon: <Landmark size={16} /> },
  { id: 'real-estate', label: 'Real Estate & Home Services', icon: <MapPin size={16} /> },
  { id: 'automotive', label: 'Automotive & Transport', icon: <Car size={16} /> },
  { id: 'fashion', label: 'Fashion & Beauty', icon: <Gem size={16} /> },
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

type DayHours = {
  open: boolean
  openTime: string
  closeTime: string
}

const DEFAULT_HOURS: Record<(typeof DAYS)[number], DayHours> = {
  Sunday: { open: false, openTime: '08:00', closeTime: '17:00' },
  Monday: { open: true, openTime: '08:00', closeTime: '17:00' },
  Tuesday: { open: true, openTime: '08:00', closeTime: '17:00' },
  Wednesday: { open: true, openTime: '08:00', closeTime: '17:00' },
  Thursday: { open: true, openTime: '08:00', closeTime: '17:00' },
  Friday: { open: true, openTime: '08:00', closeTime: '17:00' },
  Saturday: { open: true, openTime: '08:00', closeTime: '17:00' },
}

export default function AddHiddenGemPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [hours, setHours] = useState(DEFAULT_HOURS)

  function toggleDay(day: (typeof DAYS)[number]) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open },
    }))
  }

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
      <AppHeaderBar logoLinkTo="/host" />

      <main className="px-4 pt-2">
        <Link
          to="/host"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-brown"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10">
            <Gem size={28} className="text-orange" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Add a Hidden Gem</h1>
          <p className="mt-2 text-sm leading-relaxed text-brown-muted">
            Showcase your permanent location — a venue, shop, or experience the community should know about year-round.
          </p>
        </div>

        {/* Business Details */}
        <section className="mb-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-display text-base font-bold text-brown">Business Details</h2>

          <label htmlFor="listing-name" className="mb-1 block text-sm font-medium text-brown">
            Listing Name <span className="text-orange">*</span>
          </label>
          <input
            id="listing-name"
            type="text"
            placeholder="TUDU Entertainment Inc"
            className="mb-4 w-full rounded-[var(--radius-tudu)] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
          />

          <label htmlFor="brand-name" className="mb-1 block text-sm font-medium text-brown">
            Brand Name
          </label>
          <input
            id="brand-name"
            type="text"
            placeholder="e.g. Fresh Flower Farm"
            className="mb-4 w-full rounded-[var(--radius-tudu)] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
          />

          <label htmlFor="street-address" className="mb-1 block text-sm font-medium text-brown">
            Street Address <span className="text-orange">*</span>
          </label>
          <div className="relative mb-1">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted" />
            <input
              id="street-address"
              type="text"
              placeholder="Search for a location or drop a pin..."
              className="w-full rounded-[var(--radius-tudu)] border border-brown/15 bg-white py-3 pl-11 pr-4 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </div>
          <p className="mb-4 text-xs text-brown-muted">Use current location while making adjustments</p>

          <label htmlFor="description" className="mb-1 block text-sm font-medium text-brown">
            Description <span className="text-orange">*</span>
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Tell the people what makes this place special..."
            className="w-full resize-none rounded-[var(--radius-tudu)] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </section>

        {/* Cover Photo */}
        <section className="mb-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-display text-base font-bold text-brown">Cover Photo</h2>
          <p className="mb-4 text-xs leading-relaxed text-brown-muted">
            Upload a high-quality image that represents your location. This will appear on your Hidden Gem listing.
          </p>
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-brown/20 bg-cream/50 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-cream-dark text-brown-muted">
              <Upload size={24} />
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-brown/15 px-3 py-1.5 text-xs font-semibold text-brown"
              >
                <Upload size={14} />
                Upload Photo
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-brown/15 px-3 py-1.5 text-xs font-semibold text-brown-muted"
              >
                <Trash2 size={14} />
                Delete Photo
              </button>
            </div>
          </div>
        </section>

        {/* Category */}
        <section className="mb-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-display text-base font-bold text-brown">
            Category <span className="text-orange">*</span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {HIDDEN_GEM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 rounded-[var(--radius-lg)] border px-3 py-2.5 text-left text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? 'border-orange bg-orange/10 text-orange'
                    : 'border-brown/10 bg-cream/30 text-brown'
                }`}
              >
                <span className="text-orange">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="mb-4 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-brown">
            Contact Phone (Optional)
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="e.g. +1 555-555-5555"
            className="mb-4 w-full rounded-[var(--radius-tudu)] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
          />

          <label htmlFor="website" className="mb-1 block text-sm font-medium text-brown">
            Website URL
          </label>
          <input
            id="website"
            type="url"
            placeholder="https://"
            className="w-full rounded-[var(--radius-tudu)] border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20"
          />
        </section>

        {/* Operating Hours */}
        <section className="mb-5 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} className="text-orange" />
            <h2 className="font-display text-base font-bold text-brown">Operating Hours</h2>
          </div>

          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayHours = hours[day]
              return (
                <div key={day} className="border-b border-brown/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-brown">{day}</span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-brown-muted">
                      Open
                      <input
                        type="checkbox"
                        checked={dayHours.open}
                        onChange={() => toggleDay(day)}
                        className="h-4 w-4 rounded border-brown/20 accent-orange"
                      />
                    </label>
                  </div>

                  {dayHours.open ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <TimeSelect value={dayHours.openTime} />
                        <span className="text-xs text-brown-muted">to</span>
                        <TimeSelect value={dayHours.closeTime} />
                      </div>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange"
                      >
                        <Plus size={12} />
                        Add a break
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-brown-muted/70">
                      System defaults to closed if no hours set.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <GradientButton fullWidth className="py-3.5">
          Publish Hidden Gem
        </GradientButton>
      </main>

      <BottomNav />
    </div>
  )
}

function TimeSelect({ value }: { value: string }) {
  const [hour, minute] = value.split(':')
  const hourNum = parseInt(hour, 10)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum % 12 || 12

  return (
    <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-brown/15 bg-cream/50 px-2 py-1.5 text-xs font-medium text-brown">
      <span>{String(displayHour).padStart(2, '0')}</span>
      <span className="text-brown-muted">:</span>
      <span>{minute}</span>
      <span className="ml-1 text-brown-muted">{ampm}</span>
    </div>
  )
}
