import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AdminBadge, AdminButton, AdminPanel } from './AdminUI'
import { FEATURE_FLAGS_CHANGED_EVENT } from '../../lib/adminSettings'
import {
  isHostMerchGloballyEnabled,
  applyHostMerchSettingsUpdate,
  isHostMerchAllowedForHost,
  isHostMerchVisible,
  type HostMerchSettings,
  type HostMerchHostKey,
} from '../../lib/hostMerch'

type AdminMerchControlsProps = {
  settings: HostMerchSettings
  onUpdate: (partial: Partial<HostMerchSettings>) => void
  hostKey: HostMerchHostKey
  profileLabel: string
  /** Render inside a drawer section instead of a standalone panel. */
  embedded?: boolean
}

export default function AdminMerchControls({
  settings,
  onUpdate,
  hostKey,
  profileLabel,
  embedded = false,
}: AdminMerchControlsProps) {
  const [blockReason, setBlockReason] = useState(settings.merchBlockedReason ?? '')
  const [globalOn, setGlobalOn] = useState(() => isHostMerchGloballyEnabled())
  const hostAllowed = isHostMerchAllowedForHost(settings)
  const liveOnProfile = isHostMerchVisible(settings)

  useEffect(() => {
    function refreshGlobal() {
      setGlobalOn(isHostMerchGloballyEnabled())
    }
    window.addEventListener(FEATURE_FLAGS_CHANGED_EVENT, refreshGlobal)
    window.addEventListener('storage', refreshGlobal)
    return () => {
      window.removeEventListener(FEATURE_FLAGS_CHANGED_EVENT, refreshGlobal)
      window.removeEventListener('storage', refreshGlobal)
    }
  }, [])

  function applyUpdate(partial: Partial<HostMerchSettings>) {
    applyHostMerchSettingsUpdate(onUpdate, partial, hostKey)
  }

  function handleReport() {
    applyUpdate({
      merchReportedAt: new Date().toISOString(),
    })
  }

  function handleBlock() {
    applyUpdate({
      merchBlocked: true,
      merchBlockedReason: blockReason.trim() || 'Reported merchandise',
      merchShutOff: true,
    })
  }

  function handleUnblock() {
    applyUpdate({
      merchBlocked: false,
      merchBlockedReason: undefined,
      merchShutOff: false,
    })
  }

  return (
    <Wrapper embedded={embedded} className={embedded ? 'border-t border-[var(--admin-border)] pt-4' : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="admin-label">Marketplace — {profileLabel}</p>
        <div className="flex flex-wrap gap-1">
          {!globalOn && <AdminBadge tone="neutral">Platform off</AdminBadge>}
          {globalOn && !hostAllowed && !settings.merchBlocked && (
            <AdminBadge tone="neutral">Shut off</AdminBadge>
          )}
          {settings.merchReportedAt && !settings.merchBlocked && (
            <AdminBadge tone="amber">Reported</AdminBadge>
          )}
          {settings.merchBlocked && <AdminBadge tone="rose">Blocked</AdminBadge>}
          {liveOnProfile && <AdminBadge tone="emerald">Live</AdminBadge>}
        </div>
      </div>

      {!globalOn ? (
        <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
          Marketplace is controlled platform-wide. Turn on{' '}
          <Link to="/admin/rollout" className="font-medium text-[var(--admin-accent)] no-underline hover:underline">
            Host merch shop
          </Link>{' '}
          in Settings to show Marketplace on all host profiles.
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
          Platform marketplace is on. Use the toggle below to hide Marketplace for this host only.
        </p>
      )}

      <label className="mt-3 flex cursor-pointer items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Allow marketplace on profile</p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Uncheck to shut off Marketplace for this org or user. Does not affect other hosts.
          </p>
        </div>
        <input
          type="checkbox"
          checked={hostAllowed}
          disabled={!globalOn || settings.merchBlocked}
          onChange={(e) =>
            applyUpdate({ merchShutOff: !e.target.checked, merchShopEnabled: e.target.checked })
          }
          className="mt-1 h-4 w-4 accent-[var(--admin-accent)] disabled:opacity-40"
        />
      </label>

      <label className="mt-3 block">
        <span className="admin-label">Shop URL (optional)</span>
        <input
          type="url"
          value={settings.merchShopUrl ?? ''}
          placeholder="https://…"
          disabled={!globalOn}
          onChange={(e) => applyUpdate({ merchShopUrl: e.target.value.trim() || undefined })}
          className="admin-input mt-1 w-full disabled:opacity-40"
        />
        <p className="mt-1 text-[10px] text-[var(--admin-text-dim)]">
          External link for MVP. In-app checkout comes later.
        </p>
      </label>

      {settings.merchReportedAt && (
        <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
          Reported {new Date(settings.merchReportedAt).toLocaleString()}
        </p>
      )}

      <div className="mt-4 space-y-2 border-t border-[var(--admin-border)] pt-4">
        {!settings.merchBlocked ? (
          <>
            <label className="block">
              <span className="admin-label">Block reason</span>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Policy violation, counterfeit goods, etc."
                className="admin-input mt-1 w-full"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <AdminButton type="button" variant="secondary" onClick={handleReport}>
                Mark reported
              </AdminButton>
              <AdminButton type="button" variant="danger" onClick={handleBlock}>
                Block marketplace
              </AdminButton>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {settings.merchBlockedReason && (
              <p className="text-xs text-[var(--admin-text-muted)]">
                Reason: {settings.merchBlockedReason}
              </p>
            )}
            <AdminButton type="button" variant="secondary" onClick={handleUnblock}>
              Unblock marketplace
            </AdminButton>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

function Wrapper({
  children,
  className,
  embedded,
}: {
  children: ReactNode
  className?: string
  embedded?: boolean
}) {
  if (embedded) {
    return <section className={className}>{children}</section>
  }
  return <AdminPanel className={className}>{children}</AdminPanel>
}
