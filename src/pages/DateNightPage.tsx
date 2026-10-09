import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cake, Heart, MapPin, Sparkles } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import DateNightPickSheet from '../components/date-night/DateNightPickSheet'
import EventCoverDisplay from '../components/EventCoverDisplay'
import { BackLink } from '../components/NavActionButtons'
import type { DiscoverEvent } from '../data/discoverEvents'
import { useCurrentAccount } from '../hooks/useCurrentAccount'
import { hasExplorerQuickPickAccess } from '../lib/quickPickOverride'
import {
  DATE_NIGHT_CITY_CHANGED_EVENT,
  DATE_NIGHT_CITY_OPTIONS,
  DATE_NIGHT_LIVE,
  DATE_NIGHT_PLAN_CHANGED_EVENT,
  DATE_NIGHT_PREVIEW,
  dateNightPickFromDiscoverEvent,
  dateNightSlotLabel,
  getDateNightCandidates,
  getDateNightCity,
  getDateNightPlanForCity,
  setDateNightCity,
  setDateNightPick,
  type DateNightPick,
  type DateNightSlotKind,
} from '../lib/dateNight'
import { formatCityFull, formatCityLabel } from '../lib/location'

function SlotIcon({ kind }: { kind: DateNightSlotKind }) {
  if (kind === 'eat') {
    return <Cake className="h-5 w-5 text-orange" aria-hidden />
  }
  return <Sparkles className="h-5 w-5 text-[#7F77DD]" aria-hidden />
}

function slotDisplay(
  kind: DateNightSlotKind,
  saved: DateNightPick | null,
): { title: string; subtitle: string; meta: string; image?: string; isSaved: boolean } {
  if (saved) {
    return {
      title: saved.title,
      subtitle: saved.subtitle,
      meta: saved.meta,
      image: saved.image,
      isSaved: true,
    }
  }
  const preview = DATE_NIGHT_PREVIEW[kind]
  return {
    title: preview.title,
    subtitle: preview.subtitle,
    meta: preview.meta,
    isSaved: false,
  }
}

export default function DateNightPage() {
  const { account } = useCurrentAccount()
  const canUseQuickPick = hasExplorerQuickPickAccess(account)
  const [cityFull, setCityFull] = useState(() => getDateNightCity(account))
  const areaLabel = formatCityLabel(cityFull)
  const [plan, setPlan] = useState(() => getDateNightPlanForCity(cityFull))
  const [pickerKind, setPickerKind] = useState<DateNightSlotKind | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const pickerCandidates = useMemo(
    () => (pickerKind ? getDateNightCandidates(cityFull, pickerKind) : []),
    [pickerKind, cityFull],
  )

  useEffect(() => {
    setCityFull(getDateNightCity(account))
  }, [account])

  useEffect(() => {
    function sync() {
      const city = getDateNightCity(account)
      setCityFull(city)
      setPlan(getDateNightPlanForCity(city))
    }
    window.addEventListener(DATE_NIGHT_CITY_CHANGED_EVENT, sync)
    window.addEventListener(DATE_NIGHT_PLAN_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(DATE_NIGHT_CITY_CHANGED_EVENT, sync)
      window.removeEventListener(DATE_NIGHT_PLAN_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [account])

  useEffect(() => {
    setPlan(getDateNightPlanForCity(cityFull))
  }, [cityFull])

  function handleCityChange(next: string) {
    if (!canUseQuickPick || !next) return
    setDateNightCity(next)
    setCityFull(next)
  }

  function openPicker(kind: DateNightSlotKind) {
    if (!canUseQuickPick) return
    setPickerKind(kind)
  }

  function handleSelectFromPicker(event: DiscoverEvent) {
    if (!pickerKind) return
    const pick = dateNightPickFromDiscoverEvent(event, pickerKind)
    setDateNightPick(cityFull, pickerKind, pick)
    setPlan(getDateNightPlanForCity(cityFull))
    setPickerKind(null)
    setToast(pickerKind === 'eat' ? 'Dinner spot added to your plan.' : 'Event added to your plan.')
  }

  function handleRemove(kind: DateNightSlotKind) {
    if (!canUseQuickPick) return
    setDateNightPick(cityFull, kind, null)
    setPlan(getDateNightPlanForCity(cityFull))
  }

  function handleRegenerate() {
    if (!canUseQuickPick) return
    if (DATE_NIGHT_LIVE) {
      setToast('Suggest another pair — launching soon.')
      return
    }
    setToast('Auto-suggest pairs coming soon — add places and events manually for now.')
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar />

      <main className="px-4 pt-2">
        <BackLink to="/my-tudu" variant="chevron" className="mb-3">
          My Tudu
        </BackLink>

        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#7F77DD]/15"
            aria-hidden
          >
            <Heart className="h-6 w-6 text-[#7F77DD]" />
          </div>
          <div>
            <p className="text-tagline">Quick pick</p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
              Date night
            </h1>
            <p className="mt-1 text-sm text-brown-muted">
              Dinner + something to do — pick a city, then add your own spots (separate from Discover).
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated p-3 shadow-sm">
          <label
            htmlFor="date-night-city"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brown-muted"
          >
            <MapPin size={14} className="text-orange" aria-hidden />
            Tonight in
          </label>
          {canUseQuickPick ? (
            <select
              id="date-night-city"
              value={cityFull}
              onChange={(e) => handleCityChange(e.target.value)}
              className="app-field mt-2 w-full py-2.5 text-sm font-semibold text-brown"
            >
              {DATE_NIGHT_CITY_OPTIONS.map((city) => {
                const value = formatCityFull(city)
                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                )
              })}
            </select>
          ) : (
            <p className="mt-2 text-sm font-semibold text-brown">{areaLabel}</p>
          )}
          <p className="mt-2 text-[11px] leading-snug text-brown-muted">
            {canUseQuickPick ? (
              <>
                Planning around <span className="font-semibold text-brown">{areaLabel}</span>.
                Change location above to plan Date night in a different area — your dinner and event
                picks follow this city, not your Discover header city.
              </>
            ) : (
              <>
                Tonight in <span className="font-semibold text-brown">{areaLabel}</span> (home city).
                Change location here to pick another area for Date night when available.
              </>
            )}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {(['eat', 'do'] as const).map((kind) => {
            const saved = kind === 'eat' ? plan.eat : plan.do
            const display = slotDisplay(kind, saved)
            const stepLabel = kind === 'eat' ? '1 · Eat' : '2 · Do'
            return (
              <article
                key={kind}
                className={`rounded-[14px] border border-app-subtle bg-app-elevated p-4 shadow-sm ${
                  !canUseQuickPick ? 'opacity-80' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {display.image && display.isSaved ? (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px]">
                      <EventCoverDisplay coverImage={display.image} className="h-full w-full" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-cream">
                      <SlotIcon kind={kind} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">
                      {stepLabel}
                    </p>
                    <h2 className="font-display text-base font-bold text-brown">{display.title}</h2>
                    <p className="text-xs text-brown-muted">{display.subtitle}</p>
                    <p className="mt-1 text-[11px] text-brown-muted/90">{display.meta}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!canUseQuickPick}
                    onClick={() => openPicker(kind)}
                    className="rounded-[14px] border border-orange/30 bg-orange/10 px-3 py-1.5 text-xs font-bold text-orange transition enabled:hover:bg-orange/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {dateNightSlotLabel(kind, display.isSaved ? 'change' : 'add')}
                  </button>
                  {display.isSaved && (
                    <>
                      <button
                        type="button"
                        disabled={!canUseQuickPick}
                        onClick={() => handleRemove(kind)}
                        className="rounded-[14px] border border-app-subtle px-3 py-1.5 text-xs font-bold text-brown-muted transition enabled:hover:text-brown disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <Link
                        to={`/discover?event=${encodeURIComponent(saved!.discoverId)}`}
                        className="text-xs font-bold text-purple no-underline hover:underline"
                      >
                        View on Discover
                      </Link>
                    </>
                  )}
                  {!display.isSaved && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-brown-muted">
                      Suggestion preview
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <button
          type="button"
          disabled={!canUseQuickPick}
          onClick={handleRegenerate}
          className="mt-4 w-full rounded-[14px] border border-dashed border-brown/20 bg-cream/40 py-3 text-sm font-bold text-brown transition enabled:hover:border-orange/35 enabled:hover:text-orange disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suggest another pair
        </button>

        {canUseQuickPick && (
          <Link
            to="/host/create-event?new=1"
            className="mt-3 flex w-full items-center justify-center rounded-[14px] border border-app-subtle bg-app-elevated py-2.5 text-xs font-bold text-brown no-underline transition hover:border-orange/30"
          >
            List an event on Tudu
          </Link>
        )}

        <p className="mt-4 text-center text-[11px] leading-snug text-brown-muted">
          Plans are saved per city on this device.{' '}
          <Link to="/discover" className="font-semibold text-orange no-underline hover:underline">
            Browse Discover
          </Link>
        </p>
      </main>

      <BottomNav />
      {pickerKind && (
        <DateNightPickSheet
          kind={pickerKind}
          cityFull={cityFull}
          candidates={pickerCandidates}
          onSelect={handleSelectFromPicker}
          onClose={() => setPickerKind(null)}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
