import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Lock, Mail, X } from 'lucide-react'
import GradientButton from '../components/GradientButton'
import TuduLogo from '../components/TuduLogo'
import { PasswordInput } from '../components/FormFields'
import { findUserByEmail, resetPasswordByEmail } from '../lib/auth'

type Step = 'email' | 'password' | 'success'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const inputClass =
    'w-full rounded-[14px] border border-brown/15 bg-white py-3.5 pl-12 pr-4 text-brown outline-none transition placeholder:text-brown-muted/60 focus:border-purple focus:ring-2 focus:ring-purple/20'

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your email address.')
      return
    }
    if (!findUserByEmail(trimmed)) {
      setError('No account found with that email address.')
      return
    }
    setStep('password')
  }

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    const result = resetPasswordByEmail(email.trim(), password)
    if (!result.ok) {
      setError(result.error ?? 'Unable to reset password. Please try again.')
      return
    }
    setStep('success')
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f68e5d]/35 via-pink-200/50 to-[#c02e8d]/35" />
      <div className="absolute inset-0 backdrop-blur-md" />

      <div className="relative w-full max-w-md rounded-[14px] bg-white p-8 shadow-xl">
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

        {step === 'success' ? (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <CheckCircle2 size={48} className="text-success-deep" aria-hidden />
            </div>
            <h1 className="mb-2 font-display text-2xl font-extrabold text-gradient">
              Password updated
            </h1>
            <p className="mb-8 text-sm text-brown-muted">
              Your password has been reset. Sign in with your new password.
            </p>
            <GradientButton fullWidth className="py-3.5" onClick={() => navigate('/signin')}>
              Back to Sign In
            </GradientButton>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="mb-2 font-display text-2xl font-extrabold text-gradient">
                Reset password
              </h1>
              <p className="text-sm text-brown-muted">
                {step === 'email'
                  ? 'Enter the email for your account. We will verify it exists before you choose a new password.'
                  : `Choose a new password for ${email.trim()}.`}
              </p>
            </div>

            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brown-muted"
                  />
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <GradientButton type="submit" fullWidth className="py-3.5">
                  Continue
                </GradientButton>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <PasswordInput
                  id="forgot-password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  icon={<Lock size={18} />}
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <PasswordInput
                  id="forgot-confirm"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  icon={<Lock size={18} />}
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />

                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <GradientButton type="submit" fullWidth className="py-3.5">
                  Reset password
                </GradientButton>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setPassword('')
                    setConfirm('')
                    setError('')
                  }}
                  className="flex w-full items-center justify-center gap-2 text-sm font-medium text-brown-muted transition hover:text-brown"
                >
                  <ArrowLeft size={16} />
                  Use a different email
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-brown-muted">
              Phase 1 demo: password resets happen in-app. Email delivery is planned for Phase 2.
            </p>
          </>
        )}

        {step !== 'success' && (
          <p className="mt-6 text-center text-sm text-brown-muted">
            Remember your password?{' '}
            <Link to="/signin" className="font-semibold text-orange no-underline hover:underline">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
