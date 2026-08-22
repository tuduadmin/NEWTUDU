import { Link } from 'react-router-dom'
import { MessagesSquare } from 'lucide-react'
import {
  AdminBadge,
  AdminPanel,
} from './AdminUI'
import {
  getFeatureFlags,
  type FeatureFlags,
} from '../../lib/adminSettings'
import {
  PLANNED_FEATURE_STATUS_LABELS,
  PLANNED_PRODUCT_FEATURES,
  type PlannedProductFeature,
} from '../../lib/adminProductRoadmap'

function statusTone(status: PlannedProductFeature['status']) {
  switch (status) {
    case 'shipped':
      return 'emerald' as const
    case 'beta':
      return 'cyan' as const
    case 'in_progress':
      return 'amber' as const
    default:
      return 'neutral' as const
  }
}

function FeatureFlagPill({ flagKey }: { flagKey: keyof FeatureFlags }) {
  const enabled = getFeatureFlags()[flagKey]
  return (
    <span className="text-[10px] text-[var(--admin-text-dim)]">
      Flag <code className="text-[var(--admin-text-muted)]">{flagKey}</code>:{' '}
      <span className={enabled ? 'text-[var(--admin-success)]' : 'text-[var(--admin-text-muted)]'}>
        {enabled ? 'ON' : 'OFF'}
      </span>
    </span>
  )
}

function RoadmapFeatureCard({ feature }: { feature: PlannedProductFeature }) {
  return (
    <AdminPanel className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--admin-radius)] bg-[var(--admin-accent)]/10 text-[var(--admin-accent)]">
            <MessagesSquare size={16} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--admin-text)]">{feature.title}</p>
            <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">{feature.summary}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <AdminBadge tone={statusTone(feature.status)}>
            {PLANNED_FEATURE_STATUS_LABELS[feature.status]}
          </AdminBadge>
          <AdminBadge tone="neutral">{feature.targetVersion}</AdminBadge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="admin-label mb-1.5 text-[var(--admin-text-dim)]">In scope</p>
          <ul className="space-y-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">
            {feature.inScope.map((item) => (
              <li key={item} className="flex gap-1.5">
                <span className="text-[var(--admin-success)]" aria-hidden>
                  +
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="admin-label mb-1.5 text-[var(--admin-text-dim)]">Out of scope</p>
          <ul className="space-y-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">
            {feature.outOfScope.map((item) => (
              <li key={item} className="flex gap-1.5">
                <span className="text-[var(--admin-text-dim)]" aria-hidden>
                  −
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {feature.retention && (
        <p className="rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] bg-[var(--admin-bg)]/50 px-3 py-2 text-xs text-[var(--admin-text-muted)]">
          <span className="font-semibold text-[var(--admin-text)]">Retention: </span>
          {feature.retention}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border-subtle)] pt-3">
        <div className="space-y-0.5">
          {feature.featureFlagKey && <FeatureFlagPill flagKey={feature.featureFlagKey} />}
          {feature.storageKey && (
            <p className="text-[10px] text-[var(--admin-text-dim)]">
              Storage: <code>{feature.storageKey}</code>
            </p>
          )}
        </div>
        <Link
          to="/admin/rollout"
          className="text-xs font-semibold text-[var(--admin-accent)] no-underline hover:underline"
        >
          Toggle flag in Rollout & flags →
        </Link>
      </div>
    </AdminPanel>
  )
}

export default function AdminProductRoadmapPanel({ embedded = false }: { embedded?: boolean }) {
  return (
    <section className={embedded ? undefined : 'mt-8'}>
      {!embedded && (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[var(--admin-text)]">Product roadmap</h2>
            <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
              Internal feature specs — scope, retention, and linked rollout flags.
            </p>
          </div>
          <AdminBadge tone="neutral">Reference</AdminBadge>
        </div>
      )}

      <div className="space-y-3">
        {PLANNED_PRODUCT_FEATURES.map((feature) => (
          <RoadmapFeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </section>
  )
}
