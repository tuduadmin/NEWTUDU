import { Link } from 'react-router-dom'
import GradientButton from './GradientButton'

type DiscoverSignupPromptProps = {
  onClose?: () => void
}

export default function DiscoverSignupPrompt({ onClose }: DiscoverSignupPromptProps) {
  return (
    <>
      {onClose && (
        <button
          type="button"
          className="fixed inset-0 z-[var(--z-modal)] bg-black/70 backdrop-blur-sm"
          aria-label="Close"
          onClick={onClose}
        />
      )}
      {!onClose && (
        <div className="fixed inset-0 z-[var(--z-modal)] bg-black/70 backdrop-blur-sm" aria-hidden />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discover-signup-title"
        className="fixed left-1/2 top-1/2 z-[calc(var(--z-modal)+1)] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[14px] glass-surface p-6 shadow-float"
      >
        <h2 id="discover-signup-title" className="mb-2 font-display text-xl font-extrabold text-white">
          Sign up to keep exploring
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-white/65">
          You&apos;ve browsed three events - create a free account to keep swiping the deck and save what
          catches your eye.
        </p>
        <div className="flex flex-col gap-3">
          <GradientButton to="/signup" className="w-full px-6 py-3">
            Join Tudu
          </GradientButton>
          <Link
            to="/signin"
            className="text-center text-sm font-semibold text-peach no-underline hover:underline"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </>
  )
}
