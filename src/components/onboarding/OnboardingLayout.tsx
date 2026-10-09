import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import GradientButton from '../GradientButton'
import { SkipButton } from '../NavActionButtons'
import { getCurrentUser, hasControlRoomAccess } from '../../lib/auth'
import { completeOnboarding } from '../../lib/preferences'

type OnboardingLayoutProps = {
  step: number
  totalSteps?: number
  title: string
  subtitle: string
  onContinue: () => void
  continueDisabled?: boolean
  children: ReactNode
}

export default function OnboardingLayout({
  step,
  totalSteps = 5,
  title,
  subtitle,
  onContinue,
  continueDisabled = false,
  children,
}: OnboardingLayoutProps) {
  const navigate = useNavigate()
  const progress = (step / totalSteps) * 100

  if (hasControlRoomAccess(getCurrentUser()?.email)) {
    return <Navigate to="/admin" replace />
  }

  function handleSkipOnboarding() {
    completeOnboarding()
    navigate('/discover', { replace: true })
  }

  return (
    <div className="relative mx-auto min-h-svh max-w-md bg-midnight pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-dusk opacity-20" aria-hidden />

      <main className="relative px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <p className="text-tagline">Now you know</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-[14px] bg-gradient-to-r from-magenta via-sunset-pink to-sunset-orange transition-all duration-[var(--duration-slow)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-display text-xs font-bold text-white/48">
            {step}/{totalSteps}
          </span>
        </div>

        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/60">{subtitle}</p>

        <div className="mt-8 rounded-[14px] glass-surface p-5">{children}</div>

        <GradientButton
          fullWidth
          className="mt-8 disabled:opacity-50"
          disabled={continueDisabled}
          onClick={onContinue}
        >
          Continue
        </GradientButton>
        <SkipButton variant="dark" onClick={handleSkipOnboarding} className="mt-4">
          Skip onboarding
        </SkipButton>
      </main>
    </div>
  )
}
