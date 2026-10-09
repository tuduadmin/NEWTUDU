import { AdminBadge } from './AdminUI'
import type { UserAccount } from '../../lib/account'
import { getTierConfig } from '../../lib/tierConfig'
import {
  formatFoundingSubscriptionAdminLine,
  listFoundingSubscriptionLocks,
} from '../../lib/subscriptionPricing'

type AdminAccountSubscriptionSectionProps = {
  account: UserAccount
  /** Optional context line (e.g. org owner). */
  subtitle?: string
}

export default function AdminAccountSubscriptionSection({
  account,
  subtitle,
}: AdminAccountSubscriptionSectionProps) {
  const config = getTierConfig()
  const foundingLocks = listFoundingSubscriptionLocks(account)

  return (
    <section>
      <p className="admin-label mb-2">Subscription &amp; billing</p>
      {subtitle && (
        <p className="mb-2 text-xs text-[var(--admin-text-muted)]">{subtitle}</p>
      )}
      {foundingLocks.length === 0 ? (
        <p className="text-xs text-[var(--admin-text-muted)]">
          No grandfathered founding rates on this account.
        </p>
      ) : (
        <ul className="space-y-2">
          {foundingLocks.map(({ plan, lock }) => (
            <li
              key={plan}
              className="rounded-[10px] border border-orange/30 bg-orange/5 px-3 py-2 text-xs text-[var(--admin-text)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <AdminBadge tone="amber">Founding rate</AdminBadge>
                <span className="font-medium">
                  {formatFoundingSubscriptionAdminLine(plan, lock)}
                </span>
              </div>
              {config[plan].foundingPricing.grandfatherNote && (
                <p className="mt-1 text-[11px] text-[var(--admin-text-dim)]">
                  {config[plan].foundingPricing.grandfatherNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
