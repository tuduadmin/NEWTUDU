import {
  Briefcase,
  Clock,
  CreditCard,
  ExternalLink,
  Heart,
  Landmark,
  Receipt,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react'
import SettingsLayout, {
  SettingsAccordion,
  SettingsCard,
  SettingsSectionTitle,
} from '../../components/settings/SettingsLayout'
import { getPaymentsData } from '../../lib/userSettings'

function formatAmount(amount: number | null): string {
  if (amount === null) return 'Free'
  const prefix = amount < 0 ? '-' : ''
  return `${prefix}$${Math.abs(amount).toFixed(2)}`
}

export default function MyTuduPaymentsSettingsPage() {
  const data = getPaymentsData()
  const { subscription, stripeConnectStatus, transactions } = data
  const hasSubscription = subscription.status === 'active'

  return (
    <SettingsLayout title="Payments & Payouts" showTitle={false}>
      <SettingsSectionTitle icon={<Sparkles size={18} className="text-orange" />}>
        Your Subscription
      </SettingsSectionTitle>
      <SettingsCard className="overflow-hidden p-4">
        {hasSubscription ? (
          <>
            <div className="rounded-tudu-lg bg-gradient-to-br from-orange/15 via-sunset-pink/10 to-purple/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brown-muted">
                Current Plan
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="font-display text-xl font-extrabold text-gradient">
                  {subscription.planName}
                </p>
                <span className="rounded-[14px] bg-success/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-success-deep">
                  Active
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-brown-muted">Billing Cycle</dt>
                  <dd className="font-semibold text-brown">{subscription.billingCycle}</dd>
                </div>
                <div>
                  <dt className="text-brown-muted">Next Payment</dt>
                  <dd className="font-semibold text-brown">{subscription.nextPaymentDate}</dd>
                </div>
                <div>
                  <dt className="text-brown-muted">Amount</dt>
                  <dd className="font-semibold text-success-deep">
                    ${subscription.amountCad.toFixed(2)} CAD
                  </dd>
                </div>
                <div>
                  <dt className="text-brown-muted">Member Since</dt>
                  <dd className="font-semibold text-brown">{subscription.memberSince}</dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={() => window.alert('Stripe billing portal — coming soon.')}
              className="mt-3 w-full rounded-[14px] border border-brown/15 bg-app-elevated py-2.5 text-sm font-bold text-brown transition hover:bg-cream"
            >
              Manage Subscription
            </button>
            <SettingsAccordion title="What happens if I cancel?">
              You keep access until the end of your billing period. Pioneer perks end when the period
              expires; you can resubscribe anytime.
            </SettingsAccordion>
          </>
        ) : (
          <div className="rounded-tudu-lg border border-dashed border-brown/15 bg-cream/30 px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 text-orange">
              <Sparkles size={22} aria-hidden />
            </div>
            <p className="font-display text-sm font-bold text-brown">No active subscription</p>
            <p className="mt-1 text-xs leading-relaxed text-brown-muted">
              Paid plans aren&apos;t live yet. When subscriptions launch, you&apos;ll manage billing
              here via Stripe.
            </p>
          </div>
        )}
      </SettingsCard>

      <SettingsSectionTitle icon={<CreditCard size={18} className="text-purple" />}>
        Payment Methods
      </SettingsSectionTitle>
      <SettingsCard className="p-4">
        <p className="text-sm text-brown-muted">
          Cards will be managed securely via Stripe once billing goes live. Saved cards will work for
          subscriptions and ticket purchases.
        </p>
        <button
          type="button"
          disabled
          className="mt-3 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[14px] bg-brown/10 py-3 text-sm font-bold text-brown-muted"
        >
          <CreditCard size={16} />
          Manage Billing & Cards
        </button>
        <p className="mt-2 text-center text-[11px] text-brown-muted">
          Stripe integration coming when Tudu moves to GitHub and Supabase.
        </p>
      </SettingsCard>

      <SettingsSectionTitle icon={<Clock size={18} className="text-warm-yellow" />}>
        Recent Transactions
      </SettingsSectionTitle>
      <p className="-mt-2 mb-2 px-1 text-xs text-brown-muted">
        Subscriptions and ticket purchases will show here once billing is connected.
      </p>
      {transactions.length === 0 ? (
        <div className="app-surface-card flex flex-col items-center px-4 py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm-yellow/15 text-warm-yellow">
            <Receipt size={22} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-brown">No transactions yet</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-brown-muted">
            Membership charges and event ticket purchases will appear in this list.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="app-surface-card flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brown">{tx.label}</p>
                  <p className="text-[11px] text-brown-muted">{tx.date}</p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    tx.amountCad === null ? 'text-brown-muted' : 'text-success-deep'
                  }`}
                >
                  {formatAmount(tx.amountCad)}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-sm font-semibold text-orange"
            onClick={() => window.alert('Full transaction history — coming soon.')}
          >
            View Full Transaction History →
          </button>
        </>
      )}

      <SettingsSectionTitle icon={<Landmark size={18} className="text-success" />}>
        Organizer Payouts
      </SettingsSectionTitle>
      <SettingsCard className="space-y-3 p-4">
        <p className="rounded-tudu-lg bg-electric-blue/10 px-3 py-2 text-xs text-brown-muted">
          Payouts for ticket sales and donations will be handled via Stripe Connect. Connect once to
          receive funds from your events.
        </p>
        <div className="flex items-center gap-3 rounded-tudu-lg border border-brown/8 bg-cream/30 px-4 py-3">
          <Landmark size={20} className="text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brown">Stripe Connect</p>
            <p className="text-xs text-brown-muted">
              {stripeConnectStatus === 'connected'
                ? 'Your payout account is connected and active.'
                : 'Connect your bank account to receive payouts once Stripe is live.'}
            </p>
          </div>
          {stripeConnectStatus === 'connected' ? (
            <span className="rounded-[14px] bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success-deep">
              Connected
            </span>
          ) : (
            <span className="rounded-[14px] bg-warm-yellow/20 px-2 py-0.5 text-[10px] font-bold uppercase text-brown">
              Not connected
            </span>
          )}
        </div>
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[14px] border-2 border-brown/15 bg-app-elevated py-2.5 text-sm font-bold text-brown-muted"
        >
          <ExternalLink size={16} />
          Open Payout Dashboard
        </button>
        <SettingsAccordion title="Payout Hold Periods" icon={<Briefcase size={14} />}>
          Standard holds apply for new Connect accounts (typically 7–14 days). Ticket revenue is
          released after the event date unless a dispute is opened.
        </SettingsAccordion>
      </SettingsCard>

      <SettingsSectionTitle icon={<Shield size={18} className="text-maroon" />}>
        Refund Policy
      </SettingsSectionTitle>
      <SettingsCard className="divide-y divide-brown/5 p-0">
        <PolicyRow
          icon={<Clock size={18} className="text-success" />}
          title="24-Hour Refund Window"
          body="Full refunds on ticket purchases within 24 hours of purchase, before the event starts."
        />
        <PolicyRow
          icon={<XCircle size={18} className="text-maroon" />}
          title="Event Cancellation"
          body="If an organizer cancels, all ticket holders receive automatic refunds within 5 business days."
        />
        <PolicyRow
          icon={<Heart size={18} className="text-purple" />}
          title="Subscription Refunds"
          body="Monthly plans cancel at period end. Annual plans may qualify for prorated refunds within 14 days."
        />
      </SettingsCard>
    </SettingsLayout>
  )
}

function PolicyRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3 px-4 py-4">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-bold text-brown">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-brown-muted">{body}</p>
      </div>
    </div>
  )
}
