import { useState } from 'react'
import { Car } from 'lucide-react'
import SettingsLayout, {
  SettingsCard,
  SettingsSectionTitle,
} from '../../components/settings/SettingsLayout'
import RoadTripStopSettings from '../../components/road-trip/RoadTripStopSettings'
import GradientButton from '../../components/GradientButton'
import { FieldHelper, FieldLabel, TextInput } from '../../components/create-event/CreateEventLayout'
import {
  getRoadTripPreferences,
  ROAD_TRIP_MAX_STOP_OPTIONS,
  updateRoadTripPreferences,
} from '../../lib/roadTripPreferences'
import { getCurrentUser } from '../../lib/auth'
import { Link } from 'react-router-dom'

export default function MyTuduRoadTripSettingsPage() {
  const user = getCurrentUser()
  const [prefs, setPrefs] = useState(() => getRoadTripPreferences(user?.email))
  const [saved, setSaved] = useState(false)

  function handleDetourChange(km: number) {
    const next = updateRoadTripPreferences({ defaultDetourKm: km }, user?.email)
    setPrefs(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  function handleMaxStopsChange(count: number) {
    const next = updateRoadTripPreferences({ defaultMaxStops: count }, user?.email)
    setPrefs(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  function handleHomeBaseChange(homeBase: string) {
    const next = updateRoadTripPreferences({ defaultHomeBase: homeBase }, user?.email)
    setPrefs(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsLayout title="Road Trip" subtitle="Defaults for new trips and discover">
      <SettingsCard className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-orange/10 text-orange">
            <Car size={22} aria-hidden />
          </span>
          <div>
            <SettingsSectionTitle>Trip defaults</SettingsSectionTitle>
            <p className="text-xs text-brown-muted">
              Applied when you create a new road trip. Change per trip anytime on Find more.
            </p>
          </div>
        </div>

        <RoadTripStopSettings
          detourKm={prefs.defaultDetourKm}
          maxStops={prefs.defaultMaxStops}
          currentStopCount={0}
          showStopCount={false}
          onDetourChange={handleDetourChange}
          onMaxStopsChange={handleMaxStopsChange}
        />

        <div className="mt-5 border-t border-app-subtle pt-4">
          <FieldLabel>Default home base</FieldLabel>
          <FieldHelper className="mt-1">
            Starting point for new trips and for Google Maps when a trip doesn&apos;t set its own.
          </FieldHelper>
          <TextInput
            className="mt-2"
            value={prefs.defaultHomeBase ?? ''}
            onChange={handleHomeBaseChange}
            placeholder="e.g. Kindersley, SK"
          />
        </div>
      </SettingsCard>

      <SettingsCard className="p-4">
        <SettingsSectionTitle>Your trips</SettingsSectionTitle>
        <p className="mt-1 text-sm text-brown-muted">
          View planned routes, track stop progress, and manage active trips.
        </p>
        <GradientButton to="/road-trip" fullWidth className="mt-4 px-4 py-2.5 text-sm">
          Open Road Trip hub
        </GradientButton>
      </SettingsCard>

      <p className="text-center text-xs text-brown-muted">
        Max stop options: {ROAD_TRIP_MAX_STOP_OPTIONS.join(', ')}.
        {saved && <span className="ml-1 font-semibold text-success">Saved.</span>}
      </p>

      {!user && (
        <p className="text-center text-sm text-brown-muted">
          <Link to="/signin" className="font-semibold text-orange no-underline">
            Sign in
          </Link>{' '}
          to save preferences.
        </p>
      )}
    </SettingsLayout>
  )
}
