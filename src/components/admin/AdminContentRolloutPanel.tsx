import { useEffect, useState, type FormEvent } from 'react'
import {
  AdminButton,
  AdminPanel,
} from './AdminUI'
import {
  getFeatureFlags,
  saveFeatureFlags,
  setAllFeatureFlags,
  setAllLandingRolloutFlags,
  type FeatureFlags,
} from '../../lib/adminSettings'
import {
  getLandingFeatureFlags,
  LANDING_FEATURE_FLAGS_CHANGED_EVENT,
  LANDING_FLAG_LABELS,
  saveLandingFeatureFlags,
  type LandingFeatureFlags,
} from '../../lib/featureFlags'

const FLAG_LABELS: { key: keyof FeatureFlags; label: string; description: string }[] = [
  { key: 'discoverEnabled', label: 'Discover deck', description: 'Card swipe discover experience' },
  { key: 'roadTripEnabled', label: 'Road Trip mode', description: 'Road trip planning surfaces' },
  { key: 'bucketListEnabled', label: 'Bucket List mode', description: 'Bucket list collections' },
  { key: 'orgCreationEnabled', label: 'Org creation', description: 'Allow new host account signup' },
  { key: 'seedContentEnabled', label: 'Seed content', description: 'Admin-seeded deck filler' },
  { key: 'messagingEnabled', label: 'Admin messaging', description: 'Platform admin user messaging' },
  { key: 'boostsEnabled', label: 'Event Boosts shop', description: 'Micro-transaction boost purchases' },
  { key: 'extraEventsShopEnabled', label: 'Extra events shop', description: 'Buy additional public event slots' },
  { key: 'hiddenGemsShopEnabled', label: 'Hidden Gems shop', description: 'Purchase Hidden Gem listing slots' },
  { key: 'travelPassEnabled', label: 'Travel Pass', description: 'Discover events in other cities (weekly/monthly)' },
  {
    key: 'hostMerchEnabled',
    label: 'Host merch shop',
    description:
      'Platform master switch — shows Marketplace on host profiles. Per-host controls only shut off individual orgs/users.',
  },
  {
    key: 'privateEventChatEnabled',
    label: 'Private event chat',
    description:
      'One group thread per private event. Auto-locks after event, purges after 30 days.',
  },
]

const ALL_FLAG_KEYS = FLAG_LABELS.map(({ key }) => key)

export default function AdminContentRolloutPanel() {
  const [flags, setFlags] = useState<FeatureFlags>(() => getFeatureFlags())
  const [landingFlags, setLandingFlags] = useState<LandingFeatureFlags>(() => getLandingFeatureFlags())
  const [saved, setSaved] = useState(false)
  const [landingSaved, setLandingSaved] = useState(false)

  useEffect(() => {
    function refreshLandingFlags() {
      setLandingFlags(getLandingFeatureFlags())
    }

    window.addEventListener(LANDING_FEATURE_FLAGS_CHANGED_EVENT, refreshLandingFlags)
    window.addEventListener('storage', refreshLandingFlags)
    window.addEventListener('focus', refreshLandingFlags)

    return () => {
      window.removeEventListener(LANDING_FEATURE_FLAGS_CHANGED_EVENT, refreshLandingFlags)
      window.removeEventListener('storage', refreshLandingFlags)
      window.removeEventListener('focus', refreshLandingFlags)
    }
  }, [])

  function toggle(key: keyof FeatureFlags) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleLanding(key: keyof LandingFeatureFlags) {
    setLandingFlags((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleEnableAllFlags() {
    const next = setAllFeatureFlags(true)
    setFlags(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleEnableAllLanding() {
    const next = setAllLandingRolloutFlags(true)
    setLandingFlags(next)
    setLandingSaved(true)
    setTimeout(() => setLandingSaved(false), 2000)
  }

  const allFlagsOn = ALL_FLAG_KEYS.every((key) => flags[key])
  const allLandingOn = LANDING_FLAG_LABELS.every(({ key }) => landingFlags[key])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    saveFeatureFlags(flags)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLandingSubmit(e: FormEvent) {
    e.preventDefault()
    saveLandingFeatureFlags(landingFlags)
    setLandingFlags(getLandingFeatureFlags())
    setLandingSaved(true)
    setTimeout(() => setLandingSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">Landing page rollout</h2>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
            Choose which sections appear on the public landing page, then click Save changes.
          </p>
        </div>

        <form onSubmit={handleLandingSubmit}>
          <AdminPanel className="divide-y divide-[var(--admin-border-subtle)] !p-0">
            {LANDING_FLAG_LABELS.map(({ key, label, description }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start justify-between gap-4 px-3 py-3 hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={landingFlags[key]}
                  onChange={() => toggleLanding(key)}
                  className="mt-1 h-4 w-4 accent-[var(--admin-accent)]"
                />
              </label>
            ))}
          </AdminPanel>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AdminButton type="submit" variant="primary">
              Save landing sections
            </AdminButton>
            {!allLandingOn && (
              <AdminButton type="button" variant="secondary" onClick={handleEnableAllLanding}>
                Enable all landing
              </AdminButton>
            )}
            {landingSaved && (
              <span className="text-xs text-[var(--admin-success)]">
                Saved — refresh the landing page (Ctrl+Shift+R at /).
              </span>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">Feature flags</h2>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
            Platform toggles stored in localStorage — bottom nav and gated routes update on save.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <AdminPanel className="divide-y divide-[var(--admin-border-subtle)] !p-0">
            {FLAG_LABELS.map(({ key, label, description }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start justify-between gap-4 px-3 py-3 hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={() => toggle(key)}
                  className="mt-1 h-4 w-4 accent-[var(--admin-accent)]"
                />
              </label>
            ))}
          </AdminPanel>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AdminButton type="submit" variant="primary">
              Save feature flags
            </AdminButton>
            {!allFlagsOn && (
              <AdminButton type="button" variant="secondary" onClick={handleEnableAllFlags}>
                Enable all features
              </AdminButton>
            )}
            {saved && (
              <span className="text-xs text-[var(--admin-success)]">
                Saved — routes and nav update immediately in this browser.
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
