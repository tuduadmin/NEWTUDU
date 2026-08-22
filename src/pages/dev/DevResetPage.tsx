import { useNavigate } from 'react-router-dom'
import {
  resetLocalUserDataForSignupTest,
  signupTestResetConfirmMessage,
} from '../../lib/resetLocalUserData'

export default function DevResetPage() {
  const navigate = useNavigate()

  function handleReset() {
    if (!window.confirm(signupTestResetConfirmMessage())) return
    resetLocalUserDataForSignupTest()
    navigate('/signup', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 bg-cream px-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold text-brown">Dev: reset local user data</h1>
        <p className="mt-2 text-sm text-brown-muted">
          One-click wipe of consumer localStorage for a full sign-up walkthrough. Admin theme and
          platform admin keys are preserved.
        </p>
      </div>
      <button
        type="button"
        onClick={handleReset}
        className="rounded-[14px] bg-maroon px-4 py-3 text-sm font-semibold text-white"
      >
        Clear local data (signup test)
      </button>
    </div>
  )
}
