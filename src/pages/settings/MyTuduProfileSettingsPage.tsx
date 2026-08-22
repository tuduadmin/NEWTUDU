import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MapPin, Sparkles } from 'lucide-react'
import SettingsLayout from '../../components/settings/SettingsLayout'
import SaveButton from '../../components/host/SaveButton'
import { FormField, IconInput, IconSelect } from '../../components/FormFields'
import CategoryGrid from '../../components/CategoryGrid'
import PreferenceChoiceGrid from '../../components/settings/PreferenceChoiceGrid'
import ThemeGrid from '../../components/settings/ThemeGrid'
import { BUDGET_OPTIONS, TIMEFRAME_FILTER_OPTIONS } from '../../data/categories'
import type { BudgetId, TimeframeId } from '../../data/categories'
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
} from '../../lib/location'
import { getPreferences, savePreferences } from '../../lib/preferences'
import { updateCurrentAccount } from '../../lib/account'

const PROFILE_CARD = 'app-surface-card p-4'

export default function MyTuduProfileSettingsPage() {
  const { hash } = useLocation()
  const primaryLocationRef = useRef<HTMLElement>(null)
  const [homeCity, setHomeCityState] = useState(getHomeCity())
  const [travelCity, setTravelCityState] = useState(getTravelPassCity() ?? '')
  const [travelPass, setTravelPass] = useState(hasTravelPass())
  const [interests, setInterests] = useState<Set<string>>(new Set())
  const [budget, setBudget] = useState<BudgetId>('any')
  const [travelKm, setTravelKm] = useState(85)
  const [timeframe, setTimeframe] = useState<TimeframeId>('today')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showTravelUpsell, setShowTravelUpsell] = useState(false)

  useEffect(() => {
    const prefs = getPreferences()
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
    setSaveError('')

    setHomeCity(homeCity)
    if (travelPass && travelCity) setTravelPassCity(travelCity)

    savePreferences({
      location: homeCity,
      interests: Array.from(interests),
      budget,
      travelDistanceKm: travelKm,
      timeframe,
    })
    updateCurrentAccount({ homeCity })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

  return (
    <SettingsLayout showTitle={false} backLabel="Back">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
        Interests and preferences
      </h1>
      <p className="mt-1 text-sm text-brown-muted">
        Location, interests, themes, and what you see on Discover
      </p>

      <section
        id="primary-location"
        ref={primaryLocationRef}
        className="scroll-mt-[calc(52px+env(safe-area-inset-top))] mt-5"
      >
        <div className={PROFILE_CARD}>
          <h2 className="mb-4 font-display text-base font-bold text-brown">Primary Location</h2>

          <div className="space-y-4">
            <FormField id="home-city" label="Home City">
              <IconInput
                id="home-city"
                type="text"
                icon={<MapPin size={18} />}
                value={homeCity}
                readOnly
                className="bg-cream/40"
              />
            </FormField>

            <p className="text-xs leading-relaxed text-brown-muted">
              Your home city is {formatCityLabel(homeCity)}. Events and recommendations default to
              this location.
            </p>

            {travelPass ? (
              <FormField id="travel-city" label="Travel City (Travel Pass)">
                <IconSelect
                  id="travel-city"
                  icon={<Sparkles size={18} />}
                  value={travelCity}
                  onChange={(e) => handleTravelCityChange(e.target.value)}
                >
                  <option value="">Use home city</option>
                  {CITIES.map((city) => (
                    <option key={city.name} value={formatCityFull(city)}>
                      {formatCityFull(city)}
                    </option>
                  ))}
                </IconSelect>
              </FormField>
            ) : (
              <div className="rounded-[14px] border border-orange/20 bg-orange/5 p-4">
                <p className="text-sm font-bold text-orange">Travel Pass</p>
                <p className="mt-1 text-xs leading-relaxed text-brown-muted">
                  Explore events in other cities while you travel.
                </p>
                {showTravelUpsell && (
                  <p className="mt-2 text-xs font-semibold text-maroon">
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
                  className="mt-3 rounded-[14px] border border-orange/40 px-4 py-2 text-xs font-bold text-orange transition hover:bg-orange/10"
                >
                  Enable Travel Pass (demo)
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className={PROFILE_CARD}>
        <h2 className="mb-4 font-display text-base font-bold text-brown">
          Interests &amp; Preferences
        </h2>

        <p className="mb-2 text-sm font-medium text-brown">My Interests</p>
        <CategoryGrid selected={interests} onToggle={toggleInterest} variant="light" />

        <p className="mb-2 mt-5 text-sm font-medium text-brown">Event Budget</p>
        <PreferenceChoiceGrid
          options={BUDGET_OPTIONS}
          value={budget}
          onChange={(id) => {
            setBudget(id as BudgetId)
            setSaved(false)
          }}
        />

        <p className="mb-2 mt-5 text-sm font-medium text-brown">
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
          className="w-full accent-emerald-500"
        />

        <p className="mb-2 mt-5 text-sm font-medium text-brown">Event Timeframe</p>
        <PreferenceChoiceGrid
          options={TIMEFRAME_FILTER_OPTIONS}
          value={timeframe}
          onChange={(id) => {
            setTimeframe(id as TimeframeId)
            setSaved(false)
          }}
        />

        <div className="mt-6 border-t border-brown/10 pt-5">
          <p className="mb-1 text-sm font-medium text-brown">App Theme</p>
          <ThemeGrid />
        </div>
      </div>

      <SaveButton
        fullWidth
        className="mt-5 py-3.5"
        label="Save All Changes"
        savedLabel="Saved!"
        justSaved={saved}
        onClick={handleSave}
      />
      {saveError && (
        <p className="mt-3 text-center text-sm font-semibold text-maroon">{saveError}</p>
      )}
    </SettingsLayout>
  )
}
