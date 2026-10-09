import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import GradientButton from '../GradientButton'
import { formatPlatformRateLabel, getPlanFeatures } from '../../lib/tierPricing'
import { getTierConfig, type UserPlanId } from '../../lib/tierConfig'

const USER_PLAN_ORDER: UserPlanId[] = ['verified', 'explorer']

const TIER_ACCESS: Record<UserPlanId, string> = {
  unverified: 'Free · private events only',
  verified: 'Free · verify to unlock',
  explorer: 'Upgrade when ready',
}

const TIER_AUDIENCE: Record<UserPlanId, string> = {
  unverified: 'Getting started',
  verified: 'Personal & community hosts',
  explorer: 'Solo organizers',
}

function landingFeatures(planId: UserPlanId) {
  const config = getTierConfig()
  const fees =
    planId === 'explorer'
      ? config.explorer.fees
      : planId === 'verified'
        ? config.verified.fees
        : config.verified.fees
  const platformRate = { text: formatPlatformRateLabel(fees) }

  return getPlanFeatures(planId)
    .filter((f) => !f.text.includes('$'))
    .concat(platformRate)
}

function OrganizerTierCard({ planId }: { planId: UserPlanId }) {
  const config = getTierConfig()
  const badge = config.badges[planId]
  const features = landingFeatures(planId)

  return (
    <article
      className="flex flex-col rounded-[14px] border bg-white p-5 shadow-sm"
      style={{ borderColor: badge.cardBorderColor, borderTopWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-brown">{badge.label}</h3>
          <p className="text-xs text-brown-muted">{TIER_AUDIENCE[planId]}</p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-[14px] px-2 py-0.5 text-[10px] font-bold uppercase ${badge.pillClass}`}
        >
          {planId === 'explorer' ? badge.label : 'Free'}
        </span>
      </div>

      <p className="mt-3 font-display text-sm font-bold text-brown">{TIER_ACCESS[planId]}</p>

      <ul className="mt-4 flex-1 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-brown-muted">
            <Check size={14} className="mt-0.5 shrink-0 text-success" />
            <span className={f.highlight ? 'font-semibold text-brown' : undefined}>{f.text}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function LandingOrganizerTiers() {
  const config = getTierConfig()

  return (
    <section className="mx-auto max-w-6xl border-t border-white/10 px-4 py-14 sm:px-6 lg:px-8">
      <p className="mb-3 text-center font-display text-xs font-bold uppercase tracking-wider text-white/60">
        For Event Organizers
      </p>
      <h2 className="mb-2 text-center font-display text-2xl font-extrabold text-gradient sm:text-3xl">
        Host on your terms.
      </h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-sm leading-relaxed text-white/72">
        Start with private events, verify to publish publicly, then upgrade when you need
        more reach and ad-free perks — no listing fees, transparent platform rates.
      </p>

      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        {USER_PLAN_ORDER.map((planId) => (
          <OrganizerTierCard key={planId} planId={planId} />
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-lg text-center text-xs text-white/72">
        Host Accounts: Verified, Pioneer, and Trusted Host org plans on{' '}
        <Link to="/host/subscription" className="font-semibold text-peach no-underline hover:underline">
          plans &amp; pricing
        </Link>
        .
      </p>

      {config.partnerInviteOnly && (
        <p className="mx-auto mt-4 max-w-lg text-center text-xs text-white/72">
          <span className="font-semibold text-white">Partner</span> tier is invite-only -{' '}
          <a href="mailto:sales@tudu.ca" className="font-semibold text-peach no-underline hover:underline">
            contact us
          </a>{' '}
          for organization partnerships.
        </p>
      )}

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <GradientButton to="/host" className="px-8 py-3">
          Host an Event
        </GradientButton>
        <GradientButton to="/host/subscription" variant="outline" className="px-8 py-3">
          View plans &amp; rates
        </GradientButton>
      </div>
    </section>
  )
}
