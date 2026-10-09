import type { UserAccount } from './account'
import {
  getFoundingSubscriptionPrice,
  getStandardSubscriptionPrice,
  isFoundingOfferActive,
} from './foundingPricing'

export type SubscriptionPlanId = 'explorer' | 'pioneer' | 'trusted'
import type { BillingCycle } from './tierPricing'
import { formatMoney } from './tierPricing'
import { getTierConfig, type TierConfig } from './tierConfig'

export type FoundingSubscriptionLock = {
  billingCycle: BillingCycle
  /** ISO timestamp when the founding rate was locked at checkout. */
  lockedAt: string
  monthlyCad: number
  annualCad: number
}

export type SubscriptionFoundingLocks = Partial<Record<SubscriptionPlanId, FoundingSubscriptionLock>>

const PAID_PLAN_LABEL: Record<SubscriptionPlanId, string> = {
  explorer: 'Explorer',
  pioneer: 'Pioneer',
  trusted: 'Trusted Host',
}

/** Checkout price for new subscribers (founding cohort vs full rate). */
export function getCheckoutSubscriptionPrice(
  plan: SubscriptionPlanId,
  cycle: BillingCycle,
  config?: TierConfig,
): number {
  const c = config ?? getTierConfig()
  const offer = c[plan].foundingPricing
  if (isFoundingOfferActive(offer, plan)) {
    return getFoundingSubscriptionPrice(plan, cycle, c)
  }
  return getStandardSubscriptionPrice(plan, cycle, c)
}

export function accountHasFoundingSubscriptionLock(
  account: UserAccount | null | undefined,
  plan: SubscriptionPlanId,
): boolean {
  return Boolean(account?.subscriptionFounding?.[plan])
}

/** Price the account pays while the subscription stays active (grandfathered founding vs catalog). */
export function getEffectiveSubscriptionPrice(
  account: UserAccount | null | undefined,
  plan: SubscriptionPlanId,
  cycle: BillingCycle,
  config?: TierConfig,
): number {
  const lock = account?.subscriptionFounding?.[plan]
  if (lock) {
    return cycle === 'annual' ? lock.annualCad : lock.monthlyCad
  }
  return getCheckoutSubscriptionPrice(plan, cycle, config)
}

export function formatFoundingSubscriptionAdminLine(
  plan: SubscriptionPlanId,
  lock: FoundingSubscriptionLock,
): string {
  const amount = lock.billingCycle === 'annual' ? lock.annualCad : lock.monthlyCad
  const suffix = lock.billingCycle === 'annual' ? '/yr' : '/mo'
  const locked = new Date(lock.lockedAt).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return `${PAID_PLAN_LABEL[plan]} · ${formatMoney(amount)}${suffix} founding (locked ${locked})`
}

export function listFoundingSubscriptionLocks(
  account: UserAccount,
): { plan: SubscriptionPlanId; lock: FoundingSubscriptionLock }[] {
  const locks = account.subscriptionFounding
  if (!locks) return []
  return (['explorer', 'pioneer', 'trusted'] satisfies SubscriptionPlanId[])
    .filter((plan) => locks[plan])
    .map((plan) => ({ plan, lock: locks[plan]! }))
}
