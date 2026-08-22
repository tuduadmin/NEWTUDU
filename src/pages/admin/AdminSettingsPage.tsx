import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from 'lucide-react'
import {
  AdminButton,
  AdminPageHeader,
  AdminPanel,
} from '../../components/admin/AdminUI'
import {
  DEFAULT_ADMIN_NAV_ITEMS,
  getSidebarOrder,
  groupNavItemsBySection,
  hasCustomSidebarOrder,
  moveSidebarItem,
  resetSidebarOrder,
  saveSidebarOrder,
  SIDEBAR_ORDER_CHANGED_EVENT,
} from '../../lib/adminSidebarNav'
import {
  clearAllProfiles,
  clearHostProfiles,
  clearOrgHostProfiles,
  clearPersonalHostProfiles,
  HOST_PROFILE_RESET_RECORD_KEYS,
  HOST_PROFILE_STORAGE_KEYS,
  PROFILE_STORAGE_KEYS,
} from '../../lib/profileReset'

type HostProfilesClearScope = 'all' | 'personal' | 'org'

type HostProfilesClearedNotice = {
  scope: HostProfilesClearScope
  details: string | null
}

function hostProfilesClearedHeadline(scope: HostProfilesClearScope): string {
  switch (scope) {
    case 'personal':
      return 'Personal host profile cleared.'
    case 'org':
      return 'Organization host profiles cleared.'
    default:
      return 'Host profiles cleared.'
  }
}

export default function AdminSettingsPage() {
  const [sidebarOrder, setSidebarOrder] = useState(() => getSidebarOrder())
  const [customSidebarOrder, setCustomSidebarOrder] = useState(() => hasCustomSidebarOrder())
  const [sidebarLayoutExpanded, setSidebarLayoutExpanded] = useState(false)
  const [confirmClearProfiles, setConfirmClearProfiles] = useState(false)
  const [profilesCleared, setProfilesCleared] = useState<string | null>(null)
  const [confirmClearHostProfiles, setConfirmClearHostProfiles] = useState<
    'all' | 'personal' | 'org' | null
  >(null)
  const [hostProfilesCleared, setHostProfilesCleared] = useState<HostProfilesClearedNotice | null>(
    null,
  )

  useEffect(() => {
    function refreshSidebarOrder() {
      setSidebarOrder(getSidebarOrder())
      setCustomSidebarOrder(hasCustomSidebarOrder())
    }

    window.addEventListener(SIDEBAR_ORDER_CHANGED_EVENT, refreshSidebarOrder)
    window.addEventListener('storage', refreshSidebarOrder)
    return () => {
      window.removeEventListener(SIDEBAR_ORDER_CHANGED_EVENT, refreshSidebarOrder)
      window.removeEventListener('storage', refreshSidebarOrder)
    }
  }, [])

  const navByPath = new Map(DEFAULT_ADMIN_NAV_ITEMS.map((item) => [item.to, item]))
  const sidebarSections = groupNavItemsBySection(
    sidebarOrder
      .map((path) => navByPath.get(path))
      .filter((item): item is NonNullable<typeof item> => item != null),
  )

  function applySidebarOrder(order: string[]) {
    saveSidebarOrder(order)
    setSidebarOrder(getSidebarOrder())
    setCustomSidebarOrder(hasCustomSidebarOrder())
  }

  function handleMove(path: string, direction: 'up' | 'down') {
    applySidebarOrder(moveSidebarItem(sidebarOrder, path, direction))
  }

  function handleResetSidebarOrder() {
    resetSidebarOrder()
    setSidebarOrder(getSidebarOrder())
    setCustomSidebarOrder(false)
  }

  function handleClearProfiles() {
    if (!confirmClearProfiles) {
      setConfirmClearProfiles(true)
      return
    }

    const result = clearAllProfiles()
    setConfirmClearProfiles(false)
    setProfilesCleared(
      `Removed ${result.removedUserCount} user(s) and ${result.removedAccountCount} account(s). Kept ${result.keptEmails.join(', ')}.`,
    )
    setTimeout(() => setProfilesCleared(null), 5000)
  }

  function handleClearHostProfiles(scope: 'all' | 'personal' | 'org') {
    if (confirmClearHostProfiles !== scope) {
      setConfirmClearHostProfiles(scope)
      return
    }

    const result =
      scope === 'personal'
        ? clearPersonalHostProfiles()
        : scope === 'org'
          ? clearOrgHostProfiles()
          : clearHostProfiles()

    setConfirmClearHostProfiles(null)
    const parts = [
      `${result.clearedKeys.length} storage key${result.clearedKeys.length === 1 ? '' : 's'}`,
      result.clearedSlideshowKeys > 0
        ? `${result.clearedSlideshowKeys} slideshow entr${result.clearedSlideshowKeys === 1 ? 'y' : 'ies'}`
        : null,
      result.resetUserNameCount > 0
        ? `${result.resetUserNameCount} display name${result.resetUserNameCount === 1 ? '' : 's'} reset`
        : null,
      result.resetOrgProfileCount > 0
        ? `${result.resetOrgProfileCount} org bio${result.resetOrgProfileCount === 1 ? '' : 's'} cleared`
        : null,
      result.resetPostingAsCount > 0
        ? `${result.resetPostingAsCount} posting context${result.resetPostingAsCount === 1 ? '' : 's'} reset`
        : null,
    ].filter(Boolean)
    setHostProfilesCleared({
      scope,
      details: parts.length > 0 ? parts.join(' · ') : null,
    })
    setTimeout(() => setHostProfilesCleared(null), 8000)
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <AdminPageHeader
        title="Settings"
        subtitle="Control Room layout and dev profile resets. Landing rollout and feature flags live under Rollout & flags in the Content section."
      />

      <section>
        <button
          type="button"
          className="mb-3 flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setSidebarLayoutExpanded((open) => !open)}
          aria-expanded={sidebarLayoutExpanded}
        >
          <div>
            <h2 className="text-sm font-semibold text-[var(--admin-text)]">Sidebar layout</h2>
            <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
              {sidebarLayoutExpanded
                ? 'Reorder Control Room navigation links. Section headers follow each group and are not draggable.'
                : `${sidebarOrder.length} links · ${sidebarSections.length} sections${
                    customSidebarOrder ? ' · custom order' : ''
                  }`}
            </p>
          </div>
          <span className="mt-0.5 shrink-0 text-[var(--admin-text-dim)]">
            {sidebarLayoutExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        </button>

        {!sidebarLayoutExpanded && (
          <AdminPanel className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {sidebarSections.map(({ section, items }) => (
                <span
                  key={section}
                  className="inline-flex items-center gap-1 rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] bg-[var(--admin-bg)]/50 px-2 py-1 text-[10px] text-[var(--admin-text-muted)]"
                >
                  <span className="font-semibold text-[var(--admin-text)]">{section}</span>
                  <span className="admin-tabular text-[var(--admin-text-dim)]">{items.length}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--admin-text-dim)]">
              Expand to reorder links with the up/down controls.
            </p>
          </AdminPanel>
        )}

        {sidebarLayoutExpanded && (
          <>
            <AdminPanel className="divide-y divide-[var(--admin-border-subtle)] !p-0">
              {sidebarOrder.map((path, index) => {
                const item = navByPath.get(path)
                if (!item) return null
                const Icon = item.icon
                const prevSection = index > 0 ? navByPath.get(sidebarOrder[index - 1])?.section : undefined
                const showSectionHeader = index === 0 || prevSection !== item.section

                return (
                  <div key={path}>
                    {showSectionHeader && (
                      <div
                        className={`border-b border-[var(--admin-border-subtle)] bg-[var(--admin-bg)]/40 px-3 ${
                          index === 0 ? 'py-2' : 'py-2.5'
                        }`}
                      >
                        <p className="admin-label text-[var(--admin-text-dim)]">{item.section}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02]">
                      <Icon size={15} className="shrink-0 text-[var(--admin-text-muted)]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-[10px] text-[var(--admin-text-dim)]">{path}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost px-2 py-1"
                          aria-label={`Move ${item.label} up`}
                          disabled={index === 0}
                          onClick={() => handleMove(path, 'up')}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost px-2 py-1"
                          aria-label={`Move ${item.label} down`}
                          disabled={index === sidebarOrder.length - 1}
                          onClick={() => handleMove(path, 'down')}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </AdminPanel>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <AdminButton
                type="button"
                variant="secondary"
                onClick={handleResetSidebarOrder}
                disabled={!customSidebarOrder}
              >
                Reset to default
              </AdminButton>
              <span className="text-xs text-[var(--admin-text-dim)]">
                Stored in localStorage as{' '}
                <code className="text-[var(--admin-text-muted)]">tudu-admin-sidebar-order</code>
              </span>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">Dev: clear host profiles</h2>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
            Phase 1 reset for host branding only — clears avatars, bios, social links, logos, and
            profile slideshows. Keeps user accounts, organizations, memberships, and events.
            <strong className="font-medium text-[var(--admin-text)]">
              {' '}
              localStorage is per browser/device
            </strong>
            — run clear on each browser where you test (e.g. desktop at 172.16.1.78:5173).
          </p>
        </div>

        <AdminPanel className="space-y-3 p-4">
          <p className="text-xs text-[var(--admin-text-muted)]">
            Removes:{' '}
            {HOST_PROFILE_STORAGE_KEYS.map((key) => (
              <code key={key} className="mr-1 text-[var(--admin-text-dim)]">
                {key}
              </code>
            ))}
            . Also resets host-visible fields in{' '}
            {HOST_PROFILE_RESET_RECORD_KEYS.map((key) => (
              <code key={key} className="mr-1 text-[var(--admin-text-dim)]">
                {key}
              </code>
            ))}
            (demo/admin display names, org bios, postingAs, activeOrgId).
          </p>
          <p className="text-xs text-[var(--admin-text-dim)]">
            Preserves: organization names, memberships, login credentials, and{' '}
            <code className="text-[var(--admin-text-muted)]">tudu_host_events</code>.
          </p>
          <p className="text-xs text-[var(--admin-text-dim)]">
            One-time in devtools:{' '}
            <code className="text-[var(--admin-text-muted)]">
              localStorage.removeItem('tudu_personal_host_profiles');
              localStorage.removeItem('tudu_org_host_profiles');
              localStorage.removeItem('tudu_host_slideshows');
              localStorage.setItem('tudu-host-context', 'personal')
            </code>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <AdminButton
              type="button"
              variant={confirmClearHostProfiles === 'all' ? 'danger' : 'secondary'}
              onClick={() => handleClearHostProfiles('all')}
            >
              {confirmClearHostProfiles === 'all' ? 'Confirm clear host profiles' : 'Clear host profiles'}
            </AdminButton>
            <AdminButton
              type="button"
              variant={confirmClearHostProfiles === 'personal' ? 'danger' : 'secondary'}
              onClick={() => handleClearHostProfiles('personal')}
            >
              {confirmClearHostProfiles === 'personal'
                ? 'Confirm clear personal'
                : 'Clear personal only'}
            </AdminButton>
            <AdminButton
              type="button"
              variant={confirmClearHostProfiles === 'org' ? 'danger' : 'secondary'}
              onClick={() => handleClearHostProfiles('org')}
            >
              {confirmClearHostProfiles === 'org' ? 'Confirm clear org' : 'Clear org only'}
            </AdminButton>
            {confirmClearHostProfiles && (
              <button
                type="button"
                onClick={() => setConfirmClearHostProfiles(null)}
                className="text-xs text-[var(--admin-text-muted)] underline"
              >
                Cancel
              </button>
            )}
          </div>
          {hostProfilesCleared && (
            <div
              role="status"
              className="rounded-[var(--admin-radius)] border border-[var(--admin-success)]/30 bg-[var(--admin-success)]/10 px-3 py-2.5 text-xs text-[var(--admin-success)]"
            >
              <p className="font-medium">{hostProfilesClearedHeadline(hostProfilesCleared.scope)}</p>
              <p className="mt-1 leading-relaxed text-[var(--admin-text-muted)]">
                Open{' '}
                <Link
                  to="/host"
                  className="font-medium text-[var(--admin-success)] underline underline-offset-2"
                >
                  /host
                </Link>{' '}
                in this browser to see the reset profile. User accounts, organizations, and events
                were kept.
              </p>
              {hostProfilesCleared.details && (
                <p className="mt-1.5 text-[10px] text-[var(--admin-text-dim)]">
                  {hostProfilesCleared.details}
                </p>
              )}
            </div>
          )}
        </AdminPanel>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">Dev: clear profiles</h2>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
            Phase 1 reset — removes all user accounts except{' '}
            <code className="text-[var(--admin-text-muted)]">admin@tudu.ca</code> and{' '}
            <code className="text-[var(--admin-text-muted)]">demo@tudu.ca</code>, clears profile
            fields, avatars, preferences, and per-user settings keys.
          </p>
        </div>

        <AdminPanel className="space-y-3 p-4">
          <p className="text-xs text-[var(--admin-text-muted)]">
            Clears:{' '}
            {PROFILE_STORAGE_KEYS.map((key) => (
              <code key={key} className="mr-1 text-[var(--admin-text-dim)]">
                {key}
              </code>
            ))}
            plus all <code className="text-[var(--admin-text-dim)]">tudu-settings-*</code> keys.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <AdminButton
              type="button"
              variant={confirmClearProfiles ? 'danger' : 'secondary'}
              onClick={handleClearProfiles}
            >
              {confirmClearProfiles ? 'Confirm clear all profiles' : 'Clear all profiles'}
            </AdminButton>
            {confirmClearProfiles && (
              <button
                type="button"
                onClick={() => setConfirmClearProfiles(false)}
                className="text-xs text-[var(--admin-text-muted)] underline"
              >
                Cancel
              </button>
            )}
            {profilesCleared && (
              <span className="text-xs text-[var(--admin-success)]">{profilesCleared}</span>
            )}
          </div>
        </AdminPanel>
      </section>
    </div>
  )
}
