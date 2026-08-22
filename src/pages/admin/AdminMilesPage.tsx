import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AdminButton,
  AdminInput,
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
} from '../../components/admin/AdminUI'
import {
  getMilesConfig,
  getMilesStats,
  getMilesWallets,
  saveMilesConfig,
  type MilesEconomyConfig,
} from '../../lib/adminMiles'

export default function AdminMilesPage() {
  const [refresh, setRefresh] = useState(0)
  const [config, setConfig] = useState<MilesEconomyConfig>(() => getMilesConfig())
  const [saved, setSaved] = useState(false)

  const stats = useMemo(() => getMilesStats(), [refresh])
  const wallets = useMemo(() => getMilesWallets(), [refresh])

  function handleSave(e: FormEvent) {
    e.preventDefault()
    saveMilesConfig(config)
    setSaved(true)
    setRefresh((r) => r + 1)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="TUDU Miles"
        subtitle="Miles economy config — earn rates, redemption rules, and wallet overview."
      />

      <AdminPanel className="mb-4">
        <p className="text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <strong className="text-[var(--admin-text)]">Phase 1:</strong> Wallet ledger and economy
          settings in{' '}
          <code className="text-[var(--admin-text-dim)]">tudu-admin-miles</code>. Ties into user
          gamification on{' '}
          <Link to="/admin/tiers" className="text-[var(--admin-accent)] no-underline hover:underline">
            Tiers
          </Link>{' '}
          and{' '}
          <Link to="/my-tudu" className="text-[var(--admin-accent)] no-underline hover:underline">
            My TUDU
          </Link>{' '}
          (stub).{' '}
          <strong className="text-[var(--admin-text)]">Phase 2:</strong> Supabase ledger, earn/spend
          webhooks, and miles → rewards redemption pipeline.
        </p>
      </AdminPanel>

      <AdminKpiGrid>
        <AdminKpi label="Total miles issued" value={stats.totalIssued.toLocaleString()} accent="cyan" />
        <AdminKpi label="Active wallets (30d)" value={stats.activeWallets} accent="emerald" />
        <AdminKpi label="Outstanding balance" value={stats.totalBalance.toLocaleString()} accent="amber" />
      </AdminKpiGrid>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <AdminPanel>
          <h2 className="text-sm font-semibold">Wallet balances</h2>
          <div className="mt-3">
            <AdminTable columns={['User', 'Balance', 'Earned', 'Spent', 'Last activity']}>
              {wallets.map((w) => (
                <tr key={w.id}>
                  <td>{w.userEmail}</td>
                  <td className="admin-tabular font-medium text-[var(--admin-accent)]">
                    {w.balance.toLocaleString()}
                  </td>
                  <td className="admin-tabular text-[var(--admin-text-muted)]">
                    {w.earned.toLocaleString()}
                  </td>
                  <td className="admin-tabular text-[var(--admin-text-muted)]">
                    {w.spent.toLocaleString()}
                  </td>
                  <td className="admin-tabular text-[var(--admin-text-dim)]">
                    {new Date(w.lastActivity).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
        </AdminPanel>

        <form onSubmit={handleSave}>
          <AdminPanel>
            <h2 className="text-sm font-semibold">Economy settings</h2>
            <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
              Earn rates applied on RSVP, check-in, and kudos (stub).
            </p>
            <div className="mt-3 space-y-3">
              <ConfigField
                label="Miles per RSVP"
                value={config.milesPerRsvp}
                onChange={(v) => setConfig((p) => ({ ...p, milesPerRsvp: v }))}
              />
              <ConfigField
                label="Miles per check-in"
                value={config.milesPerCheckIn}
                onChange={(v) => setConfig((p) => ({ ...p, milesPerCheckIn: v }))}
              />
              <ConfigField
                label="Miles per kudos received"
                value={config.milesPerKudosReceived}
                onChange={(v) => setConfig((p) => ({ ...p, milesPerKudosReceived: v }))}
              />
              <ConfigField
                label="Miles per event hosted"
                value={config.milesPerEventHosted}
                onChange={(v) => setConfig((p) => ({ ...p, milesPerEventHosted: v }))}
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <AdminButton type="submit" variant="primary">
                Save economy config
              </AdminButton>
              {saved && (
                <span className="text-xs text-[var(--admin-success)]">Saved</span>
              )}
            </div>
          </AdminPanel>

          <AdminPanel className="mt-4">
            <p className="text-xs text-[var(--admin-text-muted)]">
              Cross-link:{' '}
              <Link to="/admin/rewards" className="text-[var(--admin-accent)]">
                TUDU Rewards →
              </Link>{' '}
              for kudos and boost redemptions.
            </p>
          </AdminPanel>
        </form>
      </div>
    </div>
  )
}

function ConfigField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      <AdminInput
        type="number"
        min={0}
        className="mt-1 admin-tabular"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
