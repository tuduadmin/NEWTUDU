import { useState } from 'react'
import { appFieldClass } from '../../lib/formFieldClasses'
import { Building2, Eye, EyeOff, Lock, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import SettingsLayout, {
  SettingsCard,
  SettingsSectionTitle,
} from '../../components/settings/SettingsLayout'
import GradientButton from '../../components/GradientButton'
import { getCurrentUser, updateUserPassword } from '../../lib/auth'
import { getCurrentAccount } from '../../lib/account'
import { formatStoredPhone } from '../../lib/phoneFormat'
import { getVerifyPhoneUrl } from '../../lib/verifyPhoneNav'
import { getPreferences } from '../../lib/preferences'

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-brown-muted">{label}</label>
      <div className="relative">
        <Lock
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted"
        />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${appFieldClass} py-3 pl-10 pr-10`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brown-muted"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function MyTuduSecuritySettingsPage() {
  const user = getCurrentUser()
  const account = getCurrentAccount()
  const prefs = getPreferences()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const email = user?.email ?? prefs.email
  const phone = account?.phone ?? prefs.phone

  function handleUpdatePassword() {
    setError('')
    setMessage('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!user) {
      setError('Sign in to update your password.')
      return
    }
    updateUserPassword(user.email, password)
    setPassword('')
    setConfirm('')
    setMessage('Password updated successfully.')
  }

  return (
    <SettingsLayout title="Password & Security" showTitle={false}>
      <SettingsCard className="p-4">
        <h1 className="text-xl font-bold text-brown">Change Password</h1>
        <p className="mt-1 text-xs text-brown-muted">
          Your new password must meet all strength requirements below.
        </p>

        <div className="mt-4 space-y-3">
          <PasswordField
            label="New Password"
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
          />
        </div>

        {error && <p className="mt-2 text-xs font-semibold text-maroon">{error}</p>}
        {message && <p className="mt-2 text-xs font-semibold text-success-deep">{message}</p>}

        <GradientButton fullWidth className="mt-4" onClick={handleUpdatePassword}>
          Update Password
        </GradientButton>
      </SettingsCard>

      <SettingsCard className="p-4">
        <SettingsSectionTitle>Two-Factor Authentication</SettingsSectionTitle>
        <p className="mt-1 text-xs text-brown-muted">
          Secure your account with additional verification methods.
        </p>

        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-3 rounded-tudu-lg border border-brown/8 bg-cream/30 px-4 py-3">
            <Mail size={18} className="shrink-0 text-brown-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brown">Email</p>
              <p className="truncate text-xs text-brown-muted">{email}</p>
            </div>
            <span className="shrink-0 rounded-[14px] bg-success/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-success-deep">
              Verified
            </span>
          </li>

          <li className="flex items-center gap-3 rounded-tudu-lg border border-brown/8 bg-cream/30 px-4 py-3">
            <Phone size={18} className="shrink-0 text-brown-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brown">Phone Number</p>
              <p className="truncate text-xs text-brown-muted">
                {formatStoredPhone(phone) || 'Not set'}
              </p>
            </div>
            {account?.verificationStatus === 'phone_verified' ? (
              <span className="shrink-0 rounded-[14px] bg-success/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-success-deep">
                Verified
              </span>
            ) : (
              <Link
                to={getVerifyPhoneUrl('/my-tudu/settings/security')}
                className="shrink-0 rounded-[14px] bg-electric-blue/15 px-2.5 py-1 text-[10px] font-bold uppercase text-electric-blue no-underline"
              >
                Verify
              </Link>
            )}
          </li>

          <li className="flex items-center gap-3 rounded-tudu-lg border border-brown/8 bg-cream/30 px-4 py-3">
            <Building2 size={18} className="shrink-0 text-brown-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brown">Bank Account</p>
              <p className="text-xs text-brown-muted">Connect for organizer payouts.</p>
            </div>
            <Link
              to="/my-tudu/settings/payments"
              className="shrink-0 rounded-[14px] border border-electric-blue/30 bg-electric-blue/10 px-3 py-1 text-xs font-bold text-electric-blue no-underline"
            >
              Connect
            </Link>
          </li>
        </ul>
      </SettingsCard>
    </SettingsLayout>
  )
}
