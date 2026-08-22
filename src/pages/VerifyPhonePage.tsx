import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Phone, ShieldCheck } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'
import PhoneInput from '../components/PhoneInput'
import { DEMO_VERIFICATION_CODE, getCurrentAccount, verifyPhone } from '../lib/account'
import { clearCreateEventDraft, clearCreateEventSession } from '../lib/createEventDraft'
import { getCurrentUser } from '../lib/auth'
import { formatPhoneDisplay, isValidPhone, parsePhoneDigits } from '../lib/phoneFormat'
import {
  getVerifyPhoneReturnLabel,
  getVerifyPhoneReturnUrl,
} from '../lib/verifyPhoneNav'

type Step = 'phone' | 'code' | 'done'

export default function VerifyPhonePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnTo = getVerifyPhoneReturnUrl(
    searchParams,
    location.state as { returnTo?: string } | null,
  )
  const returnLabel = getVerifyPhoneReturnLabel(returnTo)
  const user = getCurrentUser()
  const account = getCurrentAccount()
  const alreadyVerified = account?.verificationStatus === 'phone_verified'

  const [step, setStep] = useState<Step>(alreadyVerified ? 'done' : 'phone')
  const [phone, setPhone] = useState(() => parsePhoneDigits(account?.phone ?? ''))
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="app-page-shell pb-28">
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
    if (!isValidPhone(phone)) {
      setError('Enter a valid 10-digit phone number.')
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
    clearCreateEventDraft()
    clearCreateEventSession()
    setStep('done')
  }

  return (
    <div
      className={`app-page-shell ${step === 'done' ? 'flex flex-col' : 'pb-28'}`}
    >
      <AppHeaderBar logoLinkTo="/my-tudu" />

      <main
        className={
          step === 'done'
            ? 'flex flex-1 items-center justify-center px-4 py-8'
            : 'px-4 pt-2'
        }
      >
        {step !== 'done' && (
          <>
            <Link
              to={returnTo}
              className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-brown-muted no-underline transition hover:text-brown"
            >
              <ArrowLeft size={16} />
              {returnLabel}
            </Link>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">Verify Phone</h1>
            <p className="mt-1 text-sm text-brown-muted">
              Phone verification unlocks public events and builds trust with attendees.
            </p>
          </>
        )}

        <section
          className={`app-surface-card w-full p-5 ${step === 'done' ? '' : 'mt-5'}`}
        >
          {step === 'phone' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange/15">
                <Phone size={24} className="text-orange" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brown-muted">Phone Number</label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  className="w-full rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-sm text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
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
                Enter the 6-digit code sent to <strong>{formatPhoneDisplay(phone)}</strong>
              </p>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brown-muted">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  enterKeyHint="done"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full rounded-[14px] border border-brown/15 bg-cream/40 px-3 py-2.5 text-center text-lg tracking-widest text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
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
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-brown">
                Phone verified
              </h1>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <ShieldCheck size={24} className="text-success" />
              </div>
              <p className="text-sm text-brown-muted">
                You can now post up to 2 public events. Upgrade later for more slots and analytics.
              </p>
              {returnTo === '/host' ? (
                <>
                  <GradientButton fullWidth to="/host/create-event?new=1">
                    Create Event
                  </GradientButton>
                  <Link
                    to="/host"
                    className="inline-block text-sm font-semibold text-orange no-underline transition hover:text-orange/80"
                  >
                    Return to Event Manager
                  </Link>
                </>
              ) : (
                <GradientButton fullWidth onClick={() => navigate(returnTo)}>
                  {returnLabel}
                </GradientButton>
              )}
            </div>
          )}
        </section>
      </main>

      {step !== 'done' && <BottomNav />}
    </div>
  )
}
