import { useEffect, useState } from 'react'
import {
  AdminButton,
  AdminKpi,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPanel,
} from '../../components/admin/AdminUI'
import {
  AFFILIATE_CLICKS_CHANGED_EVENT,
  getAffiliateClickStats,
  getAffiliateConfig,
  saveAffiliateConfig,
  type AffiliateConfigStore,
  type AffiliatePartnerConfig,
} from '../../lib/affiliatePartners'

export default function AdminAffiliatePartnersPage() {
  const [config, setConfig] = useState<AffiliateConfigStore>(() => getAffiliateConfig())
  const [saved, setSaved] = useState(false)
  const [clickTick, setClickTick] = useState(0)

  useEffect(() => {
    function refresh() {
      setClickTick((v) => v + 1)
    }
    window.addEventListener(AFFILIATE_CLICKS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(AFFILIATE_CLICKS_CHANGED_EVENT, refresh)
  }, [])

  void clickTick
  const stats = getAffiliateClickStats(30)

  function updatePartner(index: number, partial: Partial<AffiliatePartnerConfig>) {
    setConfig((prev) => {
      const partners = [...prev.partners]
      partners[index] = { ...partners[index], ...partial }
      return { ...prev, partners }
    })
    setSaved(false)
  }

  function handleSave() {
    saveAffiliateConfig(config)
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Affiliate Partners"
        subtitle="Zeffy, Eventbrite, Expedia, and other outbound links — append your affiliate IDs and track clicks."
      />

      <AdminKpiGrid>
        <AdminKpi label="Outbound clicks (30d)" value={stats.totalClicks} accent="cyan" />
        <AdminKpi
          label="Top partner"
          value={stats.byPartner[0]?.label ?? '—'}
          accent="amber"
        />
        <AdminKpi
          label="Hotel clicks"
          value={stats.byKind.find((k) => k.kind === 'hotel')?.count ?? 0}
          accent="emerald"
        />
        <AdminKpi
          label="Ticket / Zeffy clicks"
          value={
            (stats.byKind.find((k) => k.kind === 'external_ticket')?.count ?? 0) +
            (stats.byKind.find((k) => k.kind === 'zeffy_donation')?.count ?? 0)
          }
          accent="neutral"
        />
      </AdminKpiGrid>

      <AdminPanel>
        <p className="admin-label mb-2">Disclosure text (consumer UI)</p>
        <input
          className="admin-input w-full"
          value={config.disclosureText}
          onChange={(e) => {
            setConfig((prev) => ({ ...prev, disclosureText: e.target.value }))
            setSaved(false)
          }}
        />
      </AdminPanel>

      <div className="space-y-4">
        {config.partners.map((partner, index) => (
          <AdminPanel key={partner.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--admin-text)]">{partner.label}</h2>
              <label className="flex items-center gap-2 text-xs text-[var(--admin-text-muted)]">
                <input
                  type="checkbox"
                  checked={partner.enabled}
                  onChange={(e) => updatePartner(index, { enabled: e.target.checked })}
                />
                Enabled
              </label>
            </div>
            {partner.notes && (
              <p className="mb-3 text-xs leading-relaxed text-[var(--admin-text-dim)]">{partner.notes}</p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="admin-label">Query param name</label>
                <input
                  className="admin-input w-full"
                  value={partner.paramName ?? ''}
                  onChange={(e) => updatePartner(index, { paramName: e.target.value })}
                  placeholder="camref, aff, ref…"
                />
              </div>
              <div>
                <label className="admin-label">Your affiliate / campaign ID</label>
                <input
                  className="admin-input w-full"
                  value={partner.paramValue ?? ''}
                  onChange={(e) => updatePartner(index, { paramValue: e.target.value })}
                  placeholder="Paste after program approval"
                />
              </div>
              <div className="md:col-span-2">
                <label className="admin-label">Partner signup URL (for hosts)</label>
                <input
                  className="admin-input w-full"
                  value={partner.signupUrl ?? ''}
                  onChange={(e) => updatePartner(index, { signupUrl: e.target.value })}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[var(--admin-text-dim)]">
              Clicks (30d): {stats.byPartner.find((p) => p.partnerId === partner.id)?.count ?? 0}
            </p>
          </AdminPanel>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <AdminButton type="button" variant="primary" onClick={handleSave}>
          Save affiliate config
        </AdminButton>
        {saved && <span className="text-sm text-emerald-400">Saved.</span>}
      </div>

      <AdminPanel>
        <p className="admin-label mb-2">Apply for programs</p>
        <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">
          <li>
            <strong className="text-[var(--admin-text)]">Zeffy</strong> — charity ticketing & donations (tip
            affiliate)
          </li>
          <li>
            <strong className="text-[var(--admin-text)]">Eventbrite</strong> — external ticket affiliate param
          </li>
          <li>
            <strong className="text-[var(--admin-text)]">Expedia Group Partner Solutions</strong> — hotel
            search on event pages
          </li>
          <li>
            <strong className="text-[var(--admin-text)]">Booking.com</strong> — optional second hotel partner
          </li>
        </ul>
      </AdminPanel>
    </div>
  )
}
