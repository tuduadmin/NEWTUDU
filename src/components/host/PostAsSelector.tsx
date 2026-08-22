import { canUsePersonalHostMode, getHostAccountsForUser, getOrganization } from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'
import { useHostProfileStore } from '../../hooks/useHostProfileStore'
import { resolvePersonalHostDisplayName } from '../../lib/personalHostProfile'
import { FieldLabel } from '../create-event/CreateEventLayout'

type PostAsSelectorProps = {
  value: 'personal' | string
  onChange: (value: 'personal' | string) => void
}

export default function PostAsSelector({ value, onChange }: PostAsSelectorProps) {
  const profileRevision = useHostProfileStore()
  void profileRevision

  const user = getCurrentUser()
  const hostAccounts = user ? getHostAccountsForUser(user.email) : []
  const personalFallback = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const personalLabel = user
    ? resolvePersonalHostDisplayName(user.email, personalFallback)
    : 'Me'
  const showPersonal = user ? canUsePersonalHostMode(user.email) : true

  return (
    <div className="rounded-[14px] border border-brown/10 bg-white p-4 shadow-sm">
      <FieldLabel>Post as</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === 'personal' ? 'personal' : e.target.value)}
        className="mt-1 w-full rounded-[14px] border border-brown/20 bg-white px-3 py-2.5 text-sm font-semibold text-brown outline-none focus:border-purple focus:ring-2 focus:ring-purple/20"
      >
        {showPersonal && <option value="personal">{personalLabel}</option>}
        {hostAccounts.map((org) => (
          <option key={org.id} value={org.id}>
            {getOrganization(org.id)?.name ?? org.name}
          </option>
        ))}
      </select>
    </div>
  )
}
