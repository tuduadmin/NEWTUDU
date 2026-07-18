import { Link } from 'react-router-dom'
import { Sparkles, Ticket } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import GradientButton from '../components/GradientButton'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80&auto=format&fit=crop'

export default function HostPage() {
  return (
    <div className="mx-auto min-h-svh max-w-lg bg-midnight pb-28">
      <AppHeader />

      <main>
        <div className="relative mx-4 mt-2 h-48 overflow-hidden rounded-[var(--radius-xl)]">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="overlay-readability absolute inset-0" />
          <div className="relative flex h-full flex-col justify-end p-5">
            <p className="text-tagline">Now you know</p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
              Host Events
            </h1>
            <p className="mt-1 text-sm text-white/72">
              Create community moments with low flat fees.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-4 py-6">
          <div className="rounded-[var(--radius-xl)] glass-surface p-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-magenta/20">
              <Ticket size={24} className="text-sunset-orange" />
            </div>
            <h2 className="font-display text-lg font-bold">Your event deserves better</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Publish events for free. Keep more of what you earn with instant payouts and no listing fees.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/72">
              {[
                'Low flat-fees — keep more of what you earn',
                'No listing fees — publish events for free',
                'Instant payouts when attendees RSVP',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <GradientButton to="/signup" fullWidth className="py-3.5">
            Start Hosting For Free
          </GradientButton>
          <Link
            to="/discover"
            className="block text-center text-sm font-semibold text-white/48 no-underline transition hover:text-sunset-orange"
          >
            Browse events instead →
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
