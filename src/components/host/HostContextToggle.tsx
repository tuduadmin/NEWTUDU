import { Link } from 'react-router-dom'
import { getOrganization, type Organization } from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'
import { useHostProfileStore } from '../../hooks/useHostProfileStore'
import { resolvePersonalHostDisplayName } from '../../lib/personalHostProfile'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../../lib/prefChoiceClasses'

type HostContextToggleProps = {
  isPersonal: boolean
  activeOrg: Organization | null
  hostAccounts: Organization[]
  onChange: (context: 'personal' | string) => void
  /** When false, org-only members see org context only (no Personal tab). */
  showPersonalOption?: boolean
}

function resolveOrgDisplayName(org: Organization): string {
  return getOrganization(org.id)?.name ?? org.name
}

const selectClassName =
  'host-context-select mx-auto block w-full max-w-xs rounded-[14px] border border-app-subtle bg-app-elevated px-3 py-1.5 text-xs font-medium text-brown outline-none focus:border-orange/40 focus:ring-2 focus:ring-orange/20'

const TAB_LAYOUT = 'min-h-[34px] flex-1 truncate px-3 py-1.5 text-xs text-center'

function tabClass(isActive: boolean) {
  return prefChoiceClasses(isActive, TAB_LAYOUT)
}

const tabDisabledClass =
  'min-h-[34px] flex-1 truncate cursor-not-allowed rounded-[14px] border border-app-subtle bg-transparent px-3 py-1.5 text-xs font-semibold text-brown-muted/45'

export default function HostContextToggle({
  isPersonal,
  activeOrg,
  hostAccounts,
  onChange,
  showPersonalOption = true,
}: HostContextToggleProps) {
  const profileRevision = useHostProfileStore()
  void profileRevision

  const user = getCurrentUser()
  const personalFallback = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const personalLabel = user
    ? resolvePersonalHostDisplayName(user.email, personalFallback)
    : 'Me'
  const activeOrgLabel = activeOrg
    ? resolveOrgDisplayName(activeOrg)
    : hostAccounts.length > 0
      ? resolveOrgDisplayName(hostAccounts[0])
      : 'Organization'
  const hasOrg = hostAccounts.length > 0

  if (!showPersonalOption && hasOrg) {
    return (
      <select
        value={activeOrg?.id ?? hostAccounts[0].id}
        onChange={(e) => onChange(e.target.value)}
        className={selectClassName}
        aria-label="Post as"
      >
        {hostAccounts.map((org) => (
          <option key={org.id} value={org.id}>
            {resolveOrgDisplayName(org)}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className="mx-auto flex w-full max-w-xs gap-1.5"
        role="tablist"
        aria-label="Post as"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isPersonal}
          onClick={() => onChange('personal')}
          className={tabClass(isPersonal)}
        >
          <span
            className={`pref-choice-label truncate ${isPersonal ? PREF_CHOICE_ACTIVE_TEXT : 'font-semibold text-brown-muted'}`}
          >
            {personalLabel}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isPersonal}
          onClick={() => {
            if (hasOrg) {
              onChange(activeOrg?.id ?? hostAccounts[0].id)
            }
          }}
          disabled={!hasOrg}
          className={
            !isPersonal ? tabClass(true) : hasOrg ? tabClass(false) : tabDisabledClass
          }
        >
          <span
            className={`pref-choice-label truncate ${!isPersonal ? PREF_CHOICE_ACTIVE_TEXT : 'font-semibold text-brown-muted'}`}
          >
            {activeOrgLabel}
          </span>
        </button>
      </div>

      {!hasOrg && (
        <p className="text-center text-xs text-brown-muted">
          Need a business page?{' '}
          <Link to="/host/create-org" className="font-semibold text-orange no-underline">
            Create organization
          </Link>
        </p>
      )}

      {!isPersonal && hostAccounts.length > 1 && (
        <select
          value={activeOrg?.id ?? hostAccounts[0].id}
          onChange={(e) => onChange(e.target.value)}
          className={selectClassName}
          aria-label="Select organization"
        >
          {hostAccounts.map((org) => (
            <option key={org.id} value={org.id}>
              {resolveOrgDisplayName(org)}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
