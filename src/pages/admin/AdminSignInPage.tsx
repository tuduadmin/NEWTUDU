import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Moon, Shield, Sun } from 'lucide-react'
import { PasswordInput } from '../../components/FormFields'
import {
  getPostAuthPath,
  isAuthenticated,
  isPlatformAdmin,
  seedAdminUser,
  signIn,
  signOut,
} from '../../lib/auth'
import { PLATFORM_ADMIN } from '../../lib/demoAccounts'
import { AdminButton, AdminInput, AdminPanel } from '../../components/admin/AdminUI'
import {
  getAdminThemeModeLabel,
  getAdminThemeSwitchTitle,
  useAdminTheme,
} from '../../lib/adminTheme'

type AdminSignInState = {
  from?: string
  reason?: 'auth_required' | 'not_admin'
  signedInAs?: string
}

export default function AdminSignInPage() {
  const { theme, toggleTheme } = useAdminTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectState = (location.state as AdminSignInState | null) ?? null
  const [email, setEmail] = useState(PLATFORM_ADMIN.email)
  const [password, setPassword] = useState(PLATFORM_ADMIN.password)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    seedAdminUser()
    if (isAuthenticated() && !isPlatformAdmin()) {
      signOut()
    }
  }, [])

  const infoMessage =
    redirectState?.reason === 'not_admin'
      ? `You're signed in as ${redirectState.signedInAs ?? 'another user'}. Use platform admin credentials to open the control board.`
      : redirectState?.reason === 'auth_required'
        ? 'Sign in to access the TUDU Control board.'
        : null

  if (isPlatformAdmin()) {
    return <Navigate to="/admin" replace />
  }

  const signInFieldClass =
    'admin-input w-full min-w-0 !rounded-[var(--admin-radius)] !border-[var(--admin-border)] !bg-[var(--admin-bg)] !py-2 !text-[var(--admin-text)] placeholder:!text-[var(--admin-text-dim)] focus:!border-[var(--admin-accent)] focus:!shadow-[0_0_0_2px_var(--admin-focus-ring)] focus:!ring-0'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    seedAdminUser()

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    if (!trimmedEmail || !trimmedPassword) {
      setError('Enter your platform admin email and password.')
      return
    }

    const result = signIn(trimmedEmail, trimmedPassword)
    if (!result.ok) {
      setError(result.error ?? 'Invalid credentials. Demo: admin@tudu.ca / admin123')
      return
    }

    if (!isPlatformAdmin(trimmedEmail)) {
      signOut()
      setError('This account is not a platform admin.')
      return
    }

    const destination =
      redirectState?.from && redirectState.from.startsWith('/admin')
        ? redirectState.from
        : getPostAuthPath()
    navigate(destination, { replace: true })
  }

  return (
    <div
      className="admin-shell flex min-h-svh items-center justify-center px-4"
      data-admin-theme={theme}
    >
      <AdminPanel className="w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--admin-border)] pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--admin-radius)] bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]">
            <Shield size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="admin-label admin-brand-label">TUDU Control</p>
            <h1 className="text-base font-semibold">Platform Admin Sign In</h1>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="admin-theme-toggle shrink-0 self-center"
            title={getAdminThemeSwitchTitle(theme)}
            aria-label={getAdminThemeSwitchTitle(theme)}
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            {getAdminThemeModeLabel(theme)}
          </button>
        </div>

        {infoMessage && (
          <p className="mb-4 rounded-[var(--admin-radius)] border border-[var(--admin-accent)]/30 bg-[var(--admin-accent-muted)] px-3 py-2 text-xs text-[var(--admin-text-muted)]">
            {infoMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="admin-label">Email</span>
            <AdminInput
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder={PLATFORM_ADMIN.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${signInFieldClass} mt-1 px-3`}
            />
          </label>

          <label className="block">
            <span className="admin-label">Password</span>
            <div className="relative mt-1 w-full min-w-0">
              <Lock
                size={16}
                className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-[var(--admin-text-dim)]"
              />
              <PasswordInput
                id="admin-password"
                placeholder="Password"
                icon={null}
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dark={theme === 'dark'}
                toggleClassName="admin-password-toggle"
                className={`${signInFieldClass} !pl-8 !pr-10`}
              />
            </div>
          </label>

          {error && (
            <p className="text-xs text-[var(--admin-danger)]" role="alert">
              {error}
            </p>
          )}

          <AdminButton type="submit" variant="primary" className="mt-2 w-full py-2">
            Enter control room
          </AdminButton>
        </form>

        <p className="mt-4 text-center text-[10px] text-[var(--admin-text-dim)]">
          Demo: admin@tudu.ca / admin123
        </p>
      </AdminPanel>
    </div>
  )
}
