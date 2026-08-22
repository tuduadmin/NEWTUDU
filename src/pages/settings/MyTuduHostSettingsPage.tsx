import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import SettingsLayout, {
  SettingsCard,
  SettingsSectionTitle,
  SettingsToggleRow,
} from '../../components/settings/SettingsLayout'
import GradientButton from '../../components/GradientButton'
import {
  getHostPreferences,
  saveHostPreferences,
  type HostPreferences,
} from '../../lib/userSettings'

export default function MyTuduHostSettingsPage() {
  const [prefs, setPrefs] = useState<HostPreferences>(() => getHostPreferences())
  const [saved, setSaved] = useState(false)

  function update<K extends keyof HostPreferences>(key: K, value: HostPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    saveHostPreferences(prefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsLayout title="Host & Events" subtitle="Defaults for your Event Planner">
      <SettingsCard className="p-4">
        <SettingsSectionTitle>Default Event Visibility</SettingsSectionTitle>
        <p className="mt-1 text-xs text-brown-muted">
          New events start as public or private. You can change this per event.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['public', 'private'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update('defaultEventVisibility', v)}
              className={`rounded-tudu-lg border-2 px-3 py-2.5 text-sm font-semibold capitalize transition ${
                prefs.defaultEventVisibility === v
                  ? 'border-orange bg-orange/5 text-orange'
                  : 'border-brown/10 bg-app-elevated text-brown hover:border-brown/20'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </SettingsCard>

      <SettingsToggleRow
        label="Auto-open share sheet when I publish"
        checked={prefs.autoOpenShareSheetOnPublish}
        onChange={(v) => update('autoOpenShareSheetOnPublish', v)}
      />

      <SettingsCard className="p-4">
        <SettingsSectionTitle icon={<CreditCard size={18} className="text-success" />}>
          Payouts & Banking
        </SettingsSectionTitle>
        <p className="mt-2 text-xs text-brown-muted">
          Connect Stripe to receive ticket revenue and donations from your events.
        </p>
        <Link
          to="/my-tudu/settings/payments"
          className="mt-3 inline-block text-sm font-semibold text-orange no-underline"
        >
          Manage payouts in Payments & Payouts â†’
        </Link>
      </SettingsCard>

      <Link
        to="/host"
        className="flex w-full items-center justify-center rounded-[14px] border-2 border-orange bg-app-elevated py-3 text-sm font-bold text-orange no-underline transition hover:bg-orange/5"
      >
        Open Event Planner
      </Link>

      <GradientButton fullWidth onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Host Settings'}
      </GradientButton>
    </SettingsLayout>
  )
}
