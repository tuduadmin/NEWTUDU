import { useMemo, useState, type FormEvent } from 'react'
import {
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminKpi,
  AdminKpiGrid,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from './AdminUI'
import TuduBlackMark from './TuduBlackMark'
import {
  addTuduBlackWaitlistEntry,
  getTuduBlackBenefits,
  getTuduBlackStats,
  getTuduBlackStore,
  getTuduBlackWaitlist,
  saveTuduBlackConfig,
  TUDU_BLACK_DISPLAY_NAME,
  toggleTuduBlackBenefit,
  updateTuduBlackWaitlistStatus,
  type TuduBlackWaitlistStatus,
} from '../../lib/adminTuduBlack'

const STATUS_LABELS: Record<TuduBlackWaitlistStatus, string> = {
  pending: 'Pending',
  invited: 'Invited',
  declined: 'Declined',
}

export default function AdminTuduBlackPanel() {
  const [refresh, setRefresh] = useState(0)
  const [config, setConfig] = useState(() => ({
    invitationOnly: getTuduBlackStore().invitationOnly,
    membershipFeeCad: getTuduBlackStore().membershipFeeCad,
  }))
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [referrer, setReferrer] = useState('')
  const [note, setNote] = useState('')

  const stats = useMemo(() => getTuduBlackStats(), [refresh])
  const waitlist = useMemo(() => getTuduBlackWaitlist(), [refresh])
  const benefits = useMemo(() => getTuduBlackBenefits(), [refresh])

  function bumpRefresh() {
    setRefresh((r) => r + 1)
  }

  function handleSaveConfig(e: FormEvent) {
    e.preventDefault()
    saveTuduBlackConfig(config)
    setSaved(true)
    bumpRefresh()
    setTimeout(() => setSaved(false), 2000)
  }

  function handleAddWaitlist(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    addTuduBlackWaitlistEntry({
      name: name.trim(),
      email: email.trim(),
      referrer: referrer.trim() || undefined,
      note: note.trim() || undefined,
    })
    setName('')
    setEmail('')
    setReferrer('')
    setNote('')
    bumpRefresh()
  }

  return (
    <>
      <AdminPanel className="mb-4 border border-amber-500/20 bg-gradient-to-br from-[#0f1419] to-[#1a1510]">
        <div className="flex flex-wrap items-start gap-3">
          <TuduBlackMark size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-100">{TUDU_BLACK_DISPLAY_NAME}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">
              {TUDU_BLACK_DISPLAY_NAME} sits above the core platform — a private, invitation-driven layer for
              elevated events, concierge perks, and discretion. Black-and-gold identity; separate
              from consumer orange/purple. Demo data in{' '}
              <code className="text-[var(--admin-text-dim)]">tudu-admin-tudu-black</code>.
            </p>
          </div>
          <AdminBadge tone="amber">Phase 0 — strategy</AdminBadge>
        </div>
      </AdminPanel>

      <AdminKpiGrid>
        <AdminKpi label="Waitlist" value={stats.waitlistTotal} accent="amber" />
        <AdminKpi label="Pending review" value={stats.pending} accent="cyan" />
        <AdminKpi label="Invited" value={stats.invited} accent="emerald" />
        <AdminKpi label="Active benefits" value={stats.activeBenefits} accent="neutral" />
      </AdminKpiGrid>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <AdminPanel>
          <h2 className="text-sm font-semibold">Waitlist</h2>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
            Application and referral queue for membership vetting (local demo).
          </p>
          <div className="mt-3">
            <AdminTable columns={['Name', 'Email', 'Referrer', 'Status', 'Submitted', '']}>
              {waitlist.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <p className="font-medium">{entry.name}</p>
                    {entry.note && (
                      <p className="text-[10px] text-[var(--admin-text-dim)]">{entry.note}</p>
                    )}
                  </td>
                  <td className="text-[var(--admin-text-muted)]">{entry.email}</td>
                  <td className="text-[var(--admin-text-dim)]">{entry.referrer ?? '—'}</td>
                  <td>
                    <AdminSelect
                      value={entry.status}
                      onChange={(e) => {
                        updateTuduBlackWaitlistStatus(
                          entry.id,
                          e.target.value as TuduBlackWaitlistStatus,
                        )
                        bumpRefresh()
                      }}
                      className="min-w-[7rem]"
                    >
                      {(Object.keys(STATUS_LABELS) as TuduBlackWaitlistStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </AdminSelect>
                  </td>
                  <td className="text-[var(--admin-text-dim)]">
                    {new Date(entry.submittedAt).toLocaleDateString()}
                  </td>
                  <td />
                </tr>
              ))}
            </AdminTable>
          </div>
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel>
            <h2 className="text-sm font-semibold">Add waitlist entry</h2>
            <form onSubmit={handleAddWaitlist} className="mt-3 space-y-2">
              <div>
                <label className="admin-label mb-1 block">Name</label>
                <AdminInput value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="admin-label mb-1 block">Email</label>
                <AdminInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="admin-label mb-1 block">Referrer</label>
                <AdminInput
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                  placeholder="Member referral, partner, etc."
                />
              </div>
              <div>
                <label className="admin-label mb-1 block">Note</label>
                <AdminInput
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Interests or vetting notes"
                />
              </div>
              <AdminButton type="submit" variant="primary" className="w-full">
                Add to waitlist
              </AdminButton>
            </form>
          </AdminPanel>

          <AdminPanel>
            <h2 className="text-sm font-semibold">Program config</h2>
            <form onSubmit={handleSaveConfig} className="mt-3 space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
                <span className="text-[var(--admin-text-muted)]">Invitation-only</span>
                <input
                  type="checkbox"
                  checked={config.invitationOnly}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, invitationOnly: e.target.checked }))
                  }
                  className="h-4 w-4 accent-amber-500"
                />
              </label>
              <div>
                <label className="admin-label mb-1 block">Membership fee (CAD)</label>
                <AdminInput
                  type="number"
                  min={0}
                  value={config.membershipFeeCad}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      membershipFeeCad: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <AdminButton type="submit" variant="secondary" className="w-full">
                Save config
              </AdminButton>
              {saved && (
                <p className="text-center text-xs text-[var(--admin-success)]">Saved</p>
              )}
            </form>
          </AdminPanel>
        </div>
      </div>

      <AdminPanel className="mt-4">
        <h2 className="text-sm font-semibold">Tier benefits</h2>
        <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
          Toggle planned perks for roadmap planning. Legal/compliance review required before launch.
        </p>
        <ul className="mt-3 divide-y divide-[var(--admin-border-subtle)]">
          {benefits.map((benefit) => (
            <li
              key={benefit.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{benefit.title}</p>
                <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">
                  {benefit.description}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost shrink-0 text-xs"
                onClick={() => {
                  toggleTuduBlackBenefit(benefit.id)
                  bumpRefresh()
                }}
              >
                {benefit.enabled ? (
                  <AdminBadge tone="emerald">On</AdminBadge>
                ) : (
                  <AdminBadge tone="neutral">Off</AdminBadge>
                )}
              </button>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </>
  )
}
