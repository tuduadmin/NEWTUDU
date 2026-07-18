import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Mail, MapPin, Phone, Sparkles, User } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import AvatarStoryRing from '../components/AvatarStoryRing'
import CategoryGrid from '../components/CategoryGrid'
import GradientButton from '../components/GradientButton'
import { BUDGET_OPTIONS, TIMEFRAME_FILTER_OPTIONS } from '../data/categories'
import type { BudgetId, TimeframeId } from '../data/categories'
import {
  CITIES,
  formatCityFull,
  formatCityLabel,
  getHomeCity,
  getTravelPassCity,
  hasTravelPass,
  setHomeCity,
  setTravelPassCity,
  setTravelPassEnabled,
} from '../lib/location'
import { DEFAULT_PREFERENCES, getPreferences, savePreferences } from '../lib/preferences'
import { getCurrentAccount } from '../lib/account'
import VerificationBadge from '../components/VerificationBadge'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function MyTuduSettingsPage() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const primaryLocationRef = useRef<HTMLElement>(null)
  const [screenName, setScreenName] = useState(DEFAULT_PREFERENCES.screenName)
  const [email, setEmail] = useState(DEFAULT_PREFERENCES.email)
  const [dob, setDob] = useState(DEFAULT_PREFERENCES.dob)
  const [phone] = useState(DEFAULT_PREFERENCES.phone)
  const account = getCurrentAccount()
  const phoneVerified = account?.verificationStatus === 'phone_verified'
  const displayPhone = account?.phone ?? phone
  const [homeCity, setHomeCityState] = useState(getHomeCity())
  const [travelCity, setTravelCityState] = useState(getTravelPassCity() ?? '')
  const [travelPass, setTravelPass] = useState(hasTravelPass())
  const [interests, setInterests] = useState<Set<string>>(new Set())
  const [budget, setBudget] = useState<BudgetId>('any')
  const [travelKm, setTravelKm] = useState(85)
  const [timeframe, setTimeframe] = useState<TimeframeId>('today')
  const [saved, setSaved] = useState(false)
  const [showTravelUpsell, setShowTravelUpsell] = useState(false)

  useEffect(() => {
    const prefs = getPreferences()
    setScreenName(prefs.screenName)
    setEmail(prefs.email)
    setDob(prefs.dob)
    setHomeCityState(getHomeCity())
    setTravelCityState(getTravelPassCity() ?? '')
    setTravelPass(hasTravelPass())
    setInterests(new Set(prefs.interests))
    setBudget(prefs.budget)
    setTravelKm(prefs.travelDistanceKm)
    setTimeframe(prefs.timeframe)
  }, [])

  useEffect(() => {
    if (hash === '#primary-location') {
      primaryLocationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash])

  function toggleInterest(id: string) {
    setInterests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    setHomeCity(homeCity)
    if (travelPass && travelCity) {
      setTravelPassCity(travelCity)
    }
    savePreferences({
      screenName,
      email,
      dob,
      location: homeCity,
      interests: Array.from(interests),
      budget,
      travelDistanceKm: travelKm,
      timeframe,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDiscard() {
    navigate('/my-tudu')
  }

  function handleTravelCityChange(value: string) {
    if (!travelPass) {
      setShowTravelUpsell(true)
      return
    }
    setTravelCityState(value)
    setTravelPassCity(value)
    setSaved(false)
  }

  const inputClass =
    'w-full rounded-[var(--radius-lg)] border border-white/[0.08] bg-midnight px-3 py-2.5 text-sm text-white outline-none transition focus:border-magenta/50 focus:ring-1 focus:ring-magenta/30'

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-midnight pb-28 text-white">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main className="space-y-4 px-4 pt-3">
        <Link
          to="/my-tudu"
          className="inline-flex items-center gap-1 text-sm text-white/60 no-underline transition hover:text-sunset-orange"
        >
          ← Back to Profile
        </Link>

        <p className="text-tagline">Now you know</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Settings</h1>

        <section className="rounded-[var(--radius-xl)] glass-surface p-4">
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <User size={18} className="text-sunset-orange" />
            Personal Information
          </h2>

          <div className="mt-4 flex justify-center">
            <AvatarStoryRing initials={getInitials(screenName)} size={80} />
          </div>

          <div className="mt-4 space-y-3">
            <Field label="Screen Name" icon={<User size={14} />}>
              <input
                type="text"
                value={screenName}
                onChange={(e) => {
                  setScreenName(e.target.value)
                  setSaved(false)
                }}
                className={inputClass}
              />
            </Field>

            <Field label="Email" icon={<Mail size={14} />}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSaved(false)
                }}
                className={inputClass}
              />
            </Field>

            <Field label="Date of Birth" icon={<Calendar size={14} />}>
              <input
                type="date"
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value)
                  setSaved(false)
                }}
                className={inputClass}
              />
            </Field>

            <Field label="Phone Number" icon={<Phone size={14} />}>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={displayPhone}
                  readOnly
                  placeholder="Not set"
                  className={`min-w-0 flex-1 ${inputClass}`}
                />
                <VerificationBadge account={account} variant="dark" showLink={!phoneVerified} />
              </div>
              {!phoneVerified && (
                <Link
                  to="/verify-phone"
                  className="mt-2 inline-block text-xs font-semibold text-sunset-orange no-underline"
                >
                  Verify phone to unlock public events →
                </Link>
              )}
            </Field>
          </div>
        </section>

        <section
          id="primary-location"
          ref={primaryLocationRef}
          className="scroll-mt-[calc(52px+env(safe-area-inset-top))] rounded-[var(--radius-xl)] glass-surface p-4"
        >
          <h2 className="flex items-center gap-2 font-display text-base font-bold">
            <MapPin size={18} className="text-sunset-orange" />
            Primary Location
          </h2>

          <div className="mt-4 space-y-3">
            <Field label="Home City" icon={<MapPin size={14} />}>
              <input
                type="text"
                value={homeCity}
                readOnly
                className={`${inputClass} cursor-default text-white/72`}
                aria-describedby="home-city-help"
              />
            </Field>
            <p id="home-city-help" className="text-xs leading-relaxed text-white/48">
              Your home city is {formatCityLabel(homeCity)}. Events and recommendations default to this
              location.
            </p>

            {travelPass ? (
              <Field label="Travel City (Travel Pass)" icon={<Sparkles size={14} />}>
                <select
                  value={travelCity}
                  onChange={(e) => handleTravelCityChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Use home city</option>
                  {CITIES.map((city) => (
                    <option key={city.name} value={formatCityFull(city)}>
                      {formatCityFull(city)}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-magenta/20 bg-magenta/10 p-4">
                <p className="font-display text-sm font-bold text-sunset-orange">Travel Pass</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  Explore events in other cities while you travel. Your header location updates when a
                  Travel Pass is active.
                </p>
                {showTravelUpsell && (
                  <p className="mt-2 text-xs font-semibold text-sunset-pink">
                    Enable Travel Pass to browse outside {formatCityLabel(homeCity)}.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTravelPassEnabled(true)
                    setTravelPass(true)
                    setShowTravelUpsell(false)
                  }}
                  className="mt-3 rounded-full border border-magenta/40 px-4 py-2 text-xs font-bold text-sunset-orange transition hover:bg-magenta/15"
                >
                  Enable Travel Pass (demo)
                </button>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-white/48">
            Your location helps us show nearby events. We never share your exact address with other users.
          </p>
        </section>

        <section className="rounded-[var(--radius-xl)] glass-surface p-4">
          <h2 className="font-display text-base font-bold">Interests &amp; Preferences</h2>

          <p className="mt-3 text-sm font-semibold text-white/72">My Interests</p>
          <div className="mt-2">
            <CategoryGrid selected={interests} onToggle={toggleInterest} variant="dark" />
          </div>

          <p className="mt-5 text-sm font-semibold text-white/72">Event Budget</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setBudget(opt.id)
                  setSaved(false)
                }}
                className={`rounded-[var(--radius-lg)] border-2 px-3 py-3 text-left transition active:scale-[0.98] ${
                  budget === opt.id
                    ? 'border-magenta bg-magenta/15'
                    : 'border-white/[0.08] bg-midnight-surface hover:border-magenta/30'
                }`}
              >
                <span className="block text-sm font-semibold">{opt.label}</span>
                {opt.sublabel && <span className="text-xs text-white/48">{opt.sublabel}</span>}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm font-semibold text-white/72">
            Travel Distance: <span className="text-gradient">{travelKm} km</span>
          </p>
          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={travelKm}
            onChange={(e) => {
              setTravelKm(Number(e.target.value))
              setSaved(false)
            }}
            className="mt-2 w-full accent-sunset-orange"
          />

          <p className="mt-5 text-sm font-semibold text-white/72">Event Timeframe</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TIMEFRAME_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTimeframe(opt.id)
                  setSaved(false)
                }}
                className={`rounded-[var(--radius-lg)] border-2 px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
                  timeframe === opt.id
                    ? 'border-magenta bg-magenta/15 text-sunset-orange'
                    : 'border-white/[0.08] bg-midnight-surface text-white/72 hover:border-magenta/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <GradientButton fullWidth onClick={handleSave}>
          {saved ? 'Saved!' : 'Save All Changes'}
        </GradientButton>
        <button
          type="button"
          onClick={handleDiscard}
          className="w-full py-2 text-center text-sm text-white/48 transition hover:text-white"
        >
          Discard Changes
        </button>
      </main>

      <BottomNav />
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-white/48">
        <span className="text-sunset-orange">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}
