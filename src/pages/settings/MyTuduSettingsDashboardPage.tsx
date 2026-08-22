import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Car,
  CreditCard,
  Download,
  Handshake,
  Lock,
  LogOut,
  Settings,
  Sparkles,
  User,
} from 'lucide-react'
import SettingsLayout, {
  SettingsCard,
  SettingsNavRow,
} from '../../components/settings/SettingsLayout'
import InstallAppOverlay from '../../components/settings/InstallAppOverlay'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { getLandingFeatureFlags } from '../../lib/featureFlags'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { signOut } from '../../lib/auth'

export default function MyTuduSettingsDashboardPage() {
  const navigate = useNavigate()
  const pwaInstall = usePwaInstall()
  const landingFlags = getLandingFeatureFlags()
  const featureFlags = useFeatureFlags()

  function handleSignOut() {
    signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <SettingsLayout showTitle={false} backTo="/my-tudu" backLabel="Back to My Tudu">
      <div className="pb-2 pt-1 text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-gradient">
          My Settings
        </h1>
        <p className="mt-1 text-sm text-brown-muted">
          Manage your profile, preferences, and account settings.
        </p>
      </div>

      <SettingsCard>
        <SettingsNavRow
          to="/my-tudu/settings/edit-profile"
          icon={<User size={18} className="text-electric-blue" />}
          iconBg="bg-electric-blue/10"
          title="Edit Profile"
          description="Name, photos, email, and contact details"
        />
        <SettingsNavRow
          to="/my-tudu/settings/profile"
          icon={<Sparkles size={18} className="text-magenta" />}
          iconBg="bg-magenta/10"
          title="Interests & preferences"
          description="Categories, budget, distance, and themes"
        />
        <SettingsNavRow
          to="/my-tudu/settings/payments"
          icon={<CreditCard size={18} className="text-purple" />}
          iconBg="bg-purple/10"
          title="Payments & Payouts"
          description="Manage cards and payout details"
        />
        <SettingsNavRow
          to="/my-tudu/settings/notifications"
          icon={<Bell size={18} className="text-warm-yellow" />}
          iconBg="bg-warm-yellow/15"
          title="Notification preferences"
          description="Email, browser push, and SMS alerts"
        />
        <SettingsNavRow
          to="/my-tudu/settings/security"
          icon={<Lock size={18} className="text-brown-muted" />}
          title="Password & Security"
          description="Change your password and 2FA"
        />
        <SettingsNavRow
          to="/my-tudu/settings/app"
          icon={<Settings size={18} className="text-brown-muted" />}
          title="App Settings"
          description="Data and account tools"
        />
        <SettingsNavRow
          to="/my-tudu/settings/privacy"
          icon={<Lock size={18} className="text-brown-muted" />}
          title="Privacy & Sharing"
          description="Share lists, visibility, publish defaults"
        />
        {featureFlags.roadTripEnabled && (
          <SettingsNavRow
            to="/my-tudu/settings/road-trip"
            icon={<Car size={18} className="text-orange" />}
            iconBg="bg-orange/10"
            title="Road Trip"
            description="Default radius, max stops, and trip hub"
          />
        )}
        <SettingsNavRow
          to="/my-tudu/settings/host"
          icon={<CalendarDays size={18} className="text-orange" />}
          iconBg="bg-orange/10"
          title="Host & Events"
          description="Defaults for creating events"
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsNavRow
          to="/terms-of-service"
          icon={<Handshake size={18} className="text-success" />}
          iconBg="bg-success/10"
          title="Our Community Vow"
          description="Review the terms of service and community guidelines"
        />
      </SettingsCard>

      <SettingsCard className="p-4">
        <button
          type="button"
          onClick={() => void pwaInstall.requestInstall()}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-cream/60"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-electric-blue/10">
            <Download size={18} className="text-electric-blue" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brown">Install Tudu App</p>
            <p className="text-xs text-brown-muted">
              Add Tudu to your home screen for the full mobile experience
            </p>
          </div>
        </button>
      </SettingsCard>

      {(featureFlags.bucketListEnabled || landingFlags.landingTuduCrew) && (
        <SettingsCard className="p-4">
          <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wide text-brown-muted">
            Feature Access
          </p>
          {featureFlags.bucketListEnabled && (
            <SettingsNavRow to="/bucket-list" icon="📋" title="Bucket List" description="Open Bucket List mode" />
          )}
          {landingFlags.landingTuduCrew && (
            <SettingsNavRow to="/crew" icon="👥" title="TUDU Crew" description="Join the brand ambassador program" />
          )}
        </SettingsCard>
      )}

      {!featureFlags.bucketListEnabled &&
        !featureFlags.roadTripEnabled &&
        !landingFlags.landingTuduCrew && (
        <SettingsCard className="px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-brown-muted">Feature Access</p>
          <p className="mt-1 text-sm text-brown-muted">
            Bucket List, Road Trip, and TUDU Crew — coming soon.
          </p>
        </SettingsCard>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-tudu-lg border border-maroon/25 bg-maroon/5 py-3.5 text-sm font-bold text-maroon transition hover:bg-maroon/10 active:scale-[0.98]"
      >
        <LogOut size={16} />
        Sign Out
      </button>

      <InstallAppOverlay open={pwaInstall.instructionsOpen} onClose={pwaInstall.closeInstructions} />
    </SettingsLayout>
  )
}
