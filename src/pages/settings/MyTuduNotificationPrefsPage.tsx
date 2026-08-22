import { useState } from 'react'
import SettingsLayout, {
  SettingsSectionTitle,
  SettingsToggleRow,
} from '../../components/settings/SettingsLayout'
import { appFieldClass } from '../../lib/formFieldClasses'
import GradientButton from '../../components/GradientButton'
import {
  getMessagingPreferences,
  getNotificationPreferences,
  saveMessagingPreferences,
  saveNotificationPreferences,
  type MessagingPreferences,
  type NotificationPreferences,
} from '../../lib/userSettings'

export default function MyTuduNotificationPrefsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => getNotificationPreferences())
  const [messaging, setMessaging] = useState<MessagingPreferences>(() => getMessagingPreferences())
  const [saved, setSaved] = useState(false)

  function update<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function updateMsg<K extends keyof MessagingPreferences>(key: K, value: MessagingPreferences[K]) {
    setMessaging((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    saveNotificationPreferences(prefs)
    saveMessagingPreferences(messaging)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsLayout title="Notifications" showTitle={false}>
      <SettingsSectionTitle>Email Notifications</SettingsSectionTitle>
      <div className="space-y-2">
        <SettingsToggleRow
          label="RSVP Confirmations"
          checked={prefs.emailRsvpConfirmations}
          onChange={(v) => update('emailRsvpConfirmations', v)}
        />
        <SettingsToggleRow
          label="Recommendations"
          checked={prefs.emailRecommendations}
          onChange={(v) => update('emailRecommendations', v)}
        />
        <SettingsToggleRow
          label="Event Reminders (24h before)"
          checked={prefs.emailEventReminders24h}
          onChange={(v) => update('emailEventReminders24h', v)}
        />
        <SettingsToggleRow
          label="Followed Organizer Updates"
          checked={prefs.emailFollowedOrganizerUpdates}
          onChange={(v) => update('emailFollowedOrganizerUpdates', v)}
        />
        <SettingsToggleRow
          label="Deals & Promotions"
          checked={prefs.emailDealsPromotions}
          onChange={(v) => update('emailDealsPromotions', v)}
        />
      </div>

      <SettingsSectionTitle>Browser Push Notifications</SettingsSectionTitle>
      <div className="space-y-2">
        <SettingsToggleRow
          label="RSVP Reminders"
          checked={prefs.pushRsvpReminders}
          onChange={(v) => update('pushRsvpReminders', v)}
        />
        <SettingsToggleRow
          label="Nearby Event Alerts"
          checked={prefs.pushNearbyEventAlerts}
          onChange={(v) => update('pushNearbyEventAlerts', v)}
        />
        <SettingsToggleRow
          label="New Events from Followed Organizers"
          checked={prefs.pushFollowedOrganizerEvents}
          onChange={(v) => update('pushFollowedOrganizerEvents', v)}
        />
      </div>

      <SettingsSectionTitle>SMS Text Notifications</SettingsSectionTitle>
      <div className="space-y-2">
        <SettingsToggleRow
          label="RSVP Confirmations"
          checked={prefs.smsRsvpConfirmations}
          onChange={(v) => update('smsRsvpConfirmations', v)}
        />
        <SettingsToggleRow
          label="Event Reminders (24h before)"
          checked={prefs.smsEventReminders}
          onChange={(v) => update('smsEventReminders', v)}
        />
        <SettingsToggleRow
          label="Ticket Purchase Receipts"
          checked={prefs.smsTicketReceipts}
          onChange={(v) => update('smsTicketReceipts', v)}
        />
      </div>

      <SettingsSectionTitle>Messaging</SettingsSectionTitle>
      <div className="space-y-2">
        <SettingsToggleRow
          label="In-app message notifications"
          checked={messaging.inAppMessageNotifications}
          onChange={(v) => updateMsg('inAppMessageNotifications', v)}
        />
        <SettingsToggleRow
          label="Email digest for messages"
          checked={messaging.emailDigestForMessages}
          onChange={(v) => updateMsg('emailDigestForMessages', v)}
        />
        <label className="app-surface-card flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5">
          <span className="text-sm font-medium text-brown">Archived messages behavior</span>
          <select
            value={messaging.archiveBehavior}
            onChange={(e) =>
              updateMsg('archiveBehavior', e.target.value as MessagingPreferences['archiveBehavior'])
            }
            className={`${appFieldClass} w-auto shrink-0 px-2 py-1 text-xs font-semibold`}
          >
            <option value="archive">Archive</option>
            <option value="delete">Delete permanently</option>
          </select>
        </label>
      </div>

      <GradientButton fullWidth onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Notifications'}
      </GradientButton>
    </SettingsLayout>
  )
}
