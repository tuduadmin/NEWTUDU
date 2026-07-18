import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, ShieldCheck } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import { DEMO_VERIFICATION_CODE, getCurrentAccount, verifyPhone } from '../lib/account'
import { getCurrentUser } from '../lib/auth'

type Step = 'phone' | 'code' | 'done'

export default function VerifyPhonePage() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const account = getCurrentAccount()
  const alreadyVerified = account?.verificationStatus === 'phone_verified'

  const [step, setStep] = useState<Step>(alreadyVerified ? 'done' : 'phone')
  const [phone, setPhone] = useState(account?.phone ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
        <AppHeaderBar logoLinkTo="/my-tudu" />
        <main className="px-4 pt-6 text-center">
          <p className="text-brown-muted">Sign in to verify your phone.</p>
          <Link to="/signin" className="mt-4 inline-block font-semibold text-orange no-underline">
            Sign in
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!phone.trim()) {
      setError('Enter a phone number.')
      return
    }
    setStep('code')
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = verifyPhone(user!.email, phone, code)
    if (!result.ok) {
      setError(result.error ?? 'Verification failed.')
      return
    }
    setStep('done')
  }

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream pb-28">
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main className="px-4 pt-2">
        <Link
          to="/my-tudu/settings"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-brown"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Verify Phone</h1>
        <p className="mt-1 text-sm text-brown-muted">
          Phone verification unlocks public events and builds trust with attendees.
        </p>

        <section className="mt-5 rounded-[var(--radius-xl)] border border-brown/10 bg-white p-5 shadow-sm">
          {step === 'phone' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange/15">
                <Phone size={24} className="text-orange" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brown-muted">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 306 555 0100"
                  className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                />
              </div>
              <p className="text-xs text-brown-muted">
                Demo mode: any number works. Use code <strong>{DEMO_VERIFICATION_CODE}</strong> on the next step.
              </p>
              {error && <p className="text-sm font-semibold text-maroon">{error}</p>}
              <GradientButton type="submit" fullWidth>
                Send Verification Code
              </GradientButton>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple/15">
                <ShieldCheck size={24} className="text-purple" />
              </div>
              <p className="text-center text-sm text-brown-muted">
                Enter the 6-digit code sent to <strong>{phone}</strong>
              </p>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brown-muted">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full rounded-[var(--radius-lg)] border border-brown/15 bg-cream/40 px-3 py-2.5 text-center text-lg tracking-widest text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
                />
              </div>
              {error && <p className="text-sm font-semibold text-maroon">{error}</p>}
              <GradientButton type="submit" fullWidth>
                Verify
              </GradientButton>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-sm text-brown-muted transition hover:text-brown"
              >
                Change phone number
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <ShieldCheck size={24} className="text-emerald-600" />
              </div>
              <h2 className="font-display text-lg font-bold text-brown">Phone Verified!</h2>
              <p className="text-sm text-brown-muted">
                You can now post up to 2 public events. Upgrade later for more slots and analytics.
              </p>
              <GradientButton fullWidth onClick={() => navigate('/host')}>
                Go to Event Manager
              </GradientButton>
              <Link
                to="/my-tudu/settings"
                className="block text-sm font-semibold text-orange no-underline"
              >
                Back to Settings
              </Link>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
