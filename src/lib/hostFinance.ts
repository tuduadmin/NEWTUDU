import { getPaymentsData, type PayoutStatus } from './userSettings'

export type FinancePeriod = '24h' | '7d' | 'all'

export type PayoutRecord = {
  id: string
  label: string
  amountCents: number
  date: string
  status: 'pending' | 'paid' | 'failed'
}

export type NetSalesPoint = {
  label: string
  amountCents: number
}

export type HostFinanceSnapshot = {
  stripeConnectStatus: PayoutStatus
  withdrawableCents: number
  escrowedCents: number
  withdrawnCents: number
  netSales: NetSalesPoint[]
  payouts: PayoutRecord[]
}

const EMPTY_FINANCE: HostFinanceSnapshot = {
  stripeConnectStatus: 'not_connected',
  withdrawableCents: 0,
  escrowedCents: 0,
  withdrawnCents: 0,
  netSales: [],
  payouts: [],
}

const PERIOD_LABELS: Record<FinancePeriod, string> = {
  '24h': 'Last 24h',
  '7d': 'Last 7d',
  all: 'All time',
}

export function getFinancePeriodLabel(period: FinancePeriod): string {
  return PERIOD_LABELS[period]
}

/** Host payout balances and history — Stripe Connect integration pending. */
export function getHostFinance(_email?: string, _period: FinancePeriod = 'all'): HostFinanceSnapshot {
  const payments = getPaymentsData()
  return {
    ...EMPTY_FINANCE,
    stripeConnectStatus: payments.stripeConnectStatus,
  }
}

export function formatFinanceAmount(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function canWithdraw(snapshot: HostFinanceSnapshot): boolean {
  return snapshot.stripeConnectStatus === 'connected' && snapshot.withdrawableCents > 0
}
