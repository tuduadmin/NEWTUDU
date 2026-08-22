import { useState } from 'react'
import SettingsLayout, {
  SettingsCard,
  SettingsSectionTitle,
  SettingsToggleRow,
} from '../../components/settings/SettingsLayout'
import ShareListsManager from '../../components/settings/ShareListsManager'
import PreferenceChoiceGrid from '../../components/settings/PreferenceChoiceGrid'
import GradientButton from '../../components/GradientButton'
import {
  getPrivacyPreferences,
  savePrivacyPreferences,
  type PrivacyPreferences,
  type ShareAfterPublish,
} from '../../lib/userSettings'

export default function MyTuduPrivacySettingsPage() {
  const [prefs, setPrefs] = useState<PrivacyPreferences>(() => getPrivacyPreferences())
  const [saved, setSaved] = useState(false)

  function update<K extends keyof PrivacyPreferences>(key: K, value: PrivacyPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    savePrivacyPreferences(prefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsLayout title="Privacy & Sharing" subtitle="Control how you share and appear on Tudu">
      <SettingsCard className="p-4">
        <SettingsSectionTitle>After Publishing</SettingsSectionTitle>
        <p className="mt-1 text-xs text-brown-muted">
          When you publish a private event, should we open the share sheet?
        </p>
        <div className="mt-3">
          <PreferenceChoiceGrid
            options={[
              { id: 'always_ask', label: 'Always ask' },
              { id: 'skip', label: 'Skip by default' },
            ]}
            value={prefs.shareAfterPublish}
            onChange={(id) => update('shareAfterPublish', id as ShareAfterPublish)}
          />
        </div>
      </SettingsCard>

      <SettingsCard className="p-4">
        <SettingsSectionTitle>Private Share Lists</SettingsSectionTitle>
        <div className="mt-3">
          <ShareListsManager />
        </div>
      </SettingsCard>

      <SettingsSectionTitle>Discover Visibility</SettingsSectionTitle>
      <div className="space-y-2">
        <SettingsToggleRow
          label="Show my profile in Discover search"
          checked={prefs.profileVisibleInDiscover}
          onChange={(v) => update('profileVisibleInDiscover', v)}
        />
        <SettingsToggleRow
          label="Show attended events on my public profile"
          checked={prefs.showAttendedEventsOnProfile}
          onChange={(v) => update('showAttendedEventsOnProfile', v)}
        />
      </div>

      <GradientButton fullWidth onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Privacy Settings'}
      </GradientButton>
    </SettingsLayout>
  )
}
