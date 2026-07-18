import { useNavigate } from 'react-router-dom'
import FriendsPage from '../FriendsPage'
import GradientButton from '../../components/GradientButton'
import { completeOnboarding } from '../../lib/preferences'

export default function OnboardingFriendsPage() {
  const navigate = useNavigate()

  function finishOnboarding() {
    completeOnboarding()
    navigate('/discover')
  }

  return (
    <div className="relative">
      <FriendsPage onboarding />

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/[0.08] bg-midnight/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <GradientButton fullWidth onClick={finishOnboarding}>
            Continue to Discover
          </GradientButton>
          <button
            type="button"
            onClick={finishOnboarding}
            className="text-center text-sm text-white/48 transition hover:text-white"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
