import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Clock, Shirt, Ticket } from 'lucide-react'
import GradientButton from '../GradientButton'

const benefits = [
  { icon: BadgeCheck, title: 'Paid Gigs', description: 'Hourly pay + bonuses' },
  { icon: Ticket, title: 'Event Access', description: 'Festivals & concerts' },
  { icon: Shirt, title: 'Free Merch', description: 'Branded gear' },
  { icon: Clock, title: 'Flexible', description: 'Weekend-friendly' },
]

const highlightQualifications = [
  'Ages 19-28',
  'Outgoing & professional',
  'Weekend availability',
  'Social media savvy',
]

function CrewPinLogo() {
  return (
    <svg width={28} height={28} viewBox="0 0 48 48" fill="none" aria-hidden className="shrink-0">
      <path
        d="M24 4C16.27 4 10 10.27 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
        fill="#E53935"
      />
      <circle cx="24" cy="18" r="8" fill="white" />
      <text x="24" y="22" textAnchor="middle" fill="#E53935" fontSize="11" fontWeight="bold">
        T
      </text>
    </svg>
  )
}

export default function LandingCrewPromo() {
  return (
    <article className="relative overflow-hidden rounded-[14px] border border-[#1a1028] bg-[#0a0612] text-white shadow-lg">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative p-6 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CrewPinLogo />
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-warm-yellow">
                TUDU Crew
              </p>
              <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                Brand Ambassador Program{' '}
                <span className="text-gradient">2027</span>
              </h3>
            </div>
          </div>
          <span className="shrink-0 rounded-[14px] bg-gradient-tudu px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-white">
            Now Hiring
          </span>
        </div>

        <p className="mb-6 max-w-md text-sm leading-relaxed text-white/70">
          Represent Tudu at festivals, concerts, and activations across the city. We&apos;re looking for
          3-4 energetic brand ambassadors in their 20s.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-[14px] border border-white/10 bg-white/[0.04] p-3.5"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[14px] bg-warm-yellow/15 text-warm-yellow">
                <Icon size={16} strokeWidth={2.25} />
              </div>
              <p className="font-display text-sm font-bold text-white">{title}</p>
              <p className="mt-0.5 text-xs text-white/55">{description}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-[14px] border border-magenta/30 bg-white/[0.03] p-4">
          <p className="mb-2.5 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-sunset-pink">
            Qualifications
          </p>
          <div className="flex flex-wrap gap-2">
            {highlightQualifications.map((item) => (
              <span
                key={item}
                className="rounded-[14px] border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <GradientButton to="/crew" className="flex-1 px-6 py-3">
            Learn About the Crew
          </GradientButton>
          <GradientButton
            to="mailto:info@tudu.ca?subject=TUDU%20Crew%20Application"
            variant="outline"
            className="inline-flex flex-1 items-center justify-center gap-2 px-6 py-3"
          >
            Apply Now
            <ArrowRight size={16} />
          </GradientButton>
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          Or{' '}
          <Link to="/crew" className="font-semibold text-sunset-pink no-underline hover:underline">
            view the full recruitment page
          </Link>
        </p>
      </div>
    </article>
  )
}
