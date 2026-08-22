import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, User, X } from 'lucide-react'
import GradientButton from '../components/GradientButton'
import TuduLogo from '../components/TuduLogo'
import AddToHomeScreenButton from '../components/AddToHomeScreenButton'
import InstallAppOverlay from '../components/settings/InstallAppOverlay'
import { PasswordInput } from '../components/FormFields'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { getPostAuthPath, getRememberedEmail, repairKnownDemoUsers, signIn } from '../lib/auth'
import { appFieldClassWithIconLg } from '../lib/formFieldClasses'

export default function SignInPage() {
  const navigate = useNavigate()
  const pwaInstall = usePwaInstall()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    repairKnownDemoUsers()
    const remembered = getRememberedEmail()
    if (remembered) {
      setEmail(remembered)
      setRemember(true)
    }
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const result = signIn(email.trim(), password, { remember })
    if (!result.ok) {
      setError(result.error ?? 'Invalid email or password. Please try again.')
      return
    }

    navigate(getPostAuthPath())
  }

  const inputClass = appFieldClassWithIconLg

  return (
    <div className="auth-flow-page relative flex min-h-svh items-center justify-center px-4 py-8">
      <div className="auth-flow-gradient absolute inset-0 bg-gradient-to-br from-[#f68e5d]/35 via-pink-200/50 to-[#c02e8d]/35" />
      <div className="auth-flow-blur absolute inset-0 backdrop-blur-md" />

      <div className="app-surface-card relative w-full max-w-md p-8 shadow-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-brown-muted transition hover:bg-cream hover:text-brown"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex justify-center">
          <TuduLogo variant="iconOnly" size="lg" linkTo="" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-gradient">Welcome Back</h1>
          <p className="text-sm text-brown-muted">Sign in to continue your journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted"
            />
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <PasswordInput
            id="signin-password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            icon={<Lock size={18} />}
            visible={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-brown-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded accent-purple"
              />
              Remember me
            </label>
            <Link
              to="/signin/forgot-password"
              className="font-medium text-maroon no-underline hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <GradientButton type="submit" fullWidth className="py-3.5">
            Sign In
          </GradientButton>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-brown/10" />
          <span className="text-sm text-brown-muted">Or</span>
          <div className="h-px flex-1 bg-brown/10" />
        </div>

        <button
          type="button"
          className="auth-oauth-button flex w-full items-center justify-center gap-3 rounded-[14px] border border-brown/15 bg-white py-3.5 font-medium text-brown transition hover:bg-cream active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        {!pwaInstall.isInstalled && (
          <div className="mt-8">
            <AddToHomeScreenButton
              busy={pwaInstall.installBusy}
              onClick={() => void pwaInstall.requestInstall()}
            />
            {pwaInstall.installHint ? (
              <p className="mt-2 text-center text-xs text-red-400" role="status">
                {pwaInstall.installHint}
              </p>
            ) : (
              <p className="mt-2 text-center text-xs text-brown-muted">
                One tap installs Tudu on this device when your browser supports it.
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-brown-muted">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-orange no-underline hover:underline">
            Sign Up
          </Link>
        </p>
      </div>

      <InstallAppOverlay open={pwaInstall.instructionsOpen} onClose={pwaInstall.closeInstructions} />
    </div>
  )
}
