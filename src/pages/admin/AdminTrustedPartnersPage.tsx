import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Download, GraduationCap, Plus, RefreshCw } from 'lucide-react'
import {
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from '../../components/admin/AdminUI'
import { buildAdminSeedEventCreatePath } from '../../lib/adminSeed'
import type { TicketingMode } from '../../lib/account'
import {
  createTrustedPartnerOrg,
  getActiveTrustedPartnerOrgs,
  getPartnerEventStats,
  getTrustedPartnerOrgs,
  graduateTrustedPartner,
  importSamplePartnerCalendar,
  listPartnerEvents,
  parsePartnerImportJson,
  importPartnerCalendarEvents,
  seedTrustedPartnerOrgs,
  updateTrustedPartnerOrg,
} from '../../lib/trustedPartners'
import { ORGANIZATIONS_CHANGED_EVENT } from '../../lib/account'

const TICKETING_OPTIONS: { value: TicketingMode; label: string }[] = [
  { value: 'external', label: 'External tickets' },
  { value: 'free_rsvp', label: 'Free RSVP' },
  { value: 'free_donation', label: 'Free + Zeffy donation' },
  { value: 'sell', label: 'Sell on Tudu (Stripe later)' },
]

export default function AdminTrustedPartnersPage() {
  const [tick, setTick] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [importJson, setImportJson] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newProvince, setNewProvince] = useState('SK')
  const [newFeedUrl, setNewFeedUrl] = useState('')

  useEffect(() => {
    seedTrustedPartnerOrgs()
  }, [])

  useEffect(() => {
    function refresh() {
      setTick((v) => v + 1)
    }
    window.addEventListener(ORGANIZATIONS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(ORGANIZATIONS_CHANGED_EVENT, refresh)
  }, [])

  void tick

  const partners = useMemo(() => getTrustedPartnerOrgs(), [tick])
  const selected = partners.find((p) => p.id === selectedId) ?? null

  function handleImportSample(orgId: string) {
    setError('')
    setMessage('')
    const result = importSamplePartnerCalendar(orgId)
    if (!result.ok) {
      setError(result.error ?? 'Import failed.')
      return
    }
    setMessage(`Imported ${result.imported} events (${result.skipped} skipped as duplicates).`)
    setTick((v) => v + 1)
  }

  function handleImportJson(orgId: string) {
    setError('')
    setMessage('')
    try {
      const events = parsePartnerImportJson(importJson)
      const result = importPartnerCalendarEvents(orgId, events)
      if (!result.ok) {
        setError(result.error ?? 'Import failed.')
        return
      }
      setMessage(`Imported ${result.imported} events (${result.skipped} skipped).`)
      setImportJson('')
      setTick((v) => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON.')
    }
  }

  function handleCreatePartner(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!newName.trim()) {
      setError('Partner name is required.')
      return
    }
    const org = createTrustedPartnerOrg({
      name: newName,
      city: newCity,
      province: newProvince,
      calendarFeedUrl: newFeedUrl,
    })
    setNewName('')
    setNewCity('')
    setNewFeedUrl('')
    setSelectedId(org.id)
    setMessage(`Created partner "${org.name}".`)
    setTick((v) => v + 1)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trusted Partners"
        subtitle="Platform-managed tourism & calendar partners — green Discover cards, affiliate outbound links, import to seed queue."
      />

      {message && (
        <p className="rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-[14px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel>
          <p className="admin-label mb-3 flex items-center gap-2">
            <Plus size={16} />
            Add partner org
          </p>
          <form onSubmit={handleCreatePartner} className="space-y-3">
            <AdminInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tourism Kindersley"
            />
            <div className="grid grid-cols-2 gap-2">
              <AdminInput
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="City"
              />
              <AdminInput
                value={newProvince}
                onChange={(e) => setNewProvince(e.target.value)}
                placeholder="SK"
              />
            </div>
            <AdminInput
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="Calendar feed URL (iCal / scrape source)"
            />
            <AdminButton type="submit" variant="primary">
              Create trusted partner
            </AdminButton>
          </form>
        </AdminPanel>

        <AdminPanel>
          <p className="admin-label mb-2">Active partners</p>
          <p className="mb-3 text-xs leading-relaxed text-[var(--admin-text-muted)]">
            {getActiveTrustedPartnerOrgs().length} active · {partners.filter((p) => p.partnerLifecycle === 'graduated').length}{' '}
            graduated to self-serve orgs
          </p>
          <ul className="space-y-2 text-sm">
            {partners.map((org) => {
              const stats = getPartnerEventStats(org.id)
              return (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(org.id)}
                    className={`flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-left transition ${
                      selectedId === org.id
                        ? 'border-[var(--admin-accent)] bg-[var(--admin-accent)]/10'
                        : 'border-[var(--admin-border)] hover:border-[var(--admin-accent)]/40'
                    }`}
                  >
                    <span className="font-medium text-[var(--admin-text)]">{org.name}</span>
                    <AdminBadge tone={org.partnerLifecycle === 'graduated' ? 'neutral' : 'success'}>
                      {org.partnerLifecycle ?? 'active'}
                    </AdminBadge>
                  </button>
                  <p className="mt-0.5 px-1 text-[11px] text-[var(--admin-text-dim)]">
                    {stats.live} live · {stats.pending} pending · {stats.total} total events
                  </p>
                </li>
              )
            })}
          </ul>
        </AdminPanel>
      </div>

      {selected && (
        <AdminPanel>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">{selected.name}</h2>
              <p className="text-xs text-[var(--admin-text-muted)]">
                {[selected.partnerCity, selected.partnerProvince].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => handleImportSample(selected.id)}
                disabled={selected.partnerLifecycle === 'graduated'}
              >
                <Download size={14} className="mr-1 inline" />
                Import sample SK calendar
              </AdminButton>
              <Link to={buildAdminSeedEventCreatePath({ orgId: selected.id })}>
                <AdminButton type="button" variant="ghost">
                  Seed event manually
                </AdminButton>
              </Link>
              {selected.partnerLifecycle !== 'graduated' && (
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (!window.confirm(`Graduate "${selected.name}" to a normal org?`)) return
                    graduateTrustedPartner(selected.id)
                    setMessage(`${selected.name} graduated — calendar import disabled.`)
                    setTick((v) => v + 1)
                  }}
                >
                  <GraduationCap size={14} className="mr-1 inline" />
                  Graduate to org
                </AdminButton>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="admin-label">Calendar feed URL</label>
              <AdminInput
                value={selected.calendarFeedUrl ?? ''}
                onChange={(e) =>
                  updateTrustedPartnerOrg(selected.id, { calendarFeedUrl: e.target.value })
                }
                placeholder="https://…/events.ics"
              />
              <label className="admin-label">Default ticketing</label>
              <AdminSelect
                value={selected.partnerDefaultTicketing ?? 'external'}
                onChange={(e) =>
                  updateTrustedPartnerOrg(selected.id, {
                    partnerDefaultTicketing: e.target.value as TicketingMode,
                  })
                }
              >
                {TICKETING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </AdminSelect>
              <label className="admin-label">Default Zeffy URL (donation events)</label>
              <AdminInput
                value={selected.partnerDefaultZeffyUrl ?? ''}
                onChange={(e) =>
                  updateTrustedPartnerOrg(selected.id, { partnerDefaultZeffyUrl: e.target.value })
                }
                placeholder="https://www.zeffy.com/…"
              />
              <label className="admin-label">Notes</label>
              <textarea
                className="admin-input min-h-[80px] w-full resize-y"
                value={selected.partnerNotes ?? ''}
                onChange={(e) =>
                  updateTrustedPartnerOrg(selected.id, { partnerNotes: e.target.value })
                }
              />
              {selected.lastPartnerImportAt && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--admin-text-dim)]">
                  <Calendar size={12} />
                  Last import: {new Date(selected.lastPartnerImportAt).toLocaleString()} (
                  {selected.lastPartnerImportCount ?? 0} events)
                </p>
              )}
            </div>

            <div>
              <p className="admin-label mb-2">Paste import JSON</p>
              <p className="mb-2 text-[11px] leading-relaxed text-[var(--admin-text-muted)]">
                Array of {'{ title, startDate, city, ticketingMode, externalTicketUrl, zeffyUrl }'}
              </p>
              <textarea
                className="admin-input min-h-[140px] w-full resize-y font-mono text-xs"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={'[\n  { "title": "Farmers Market", "startDate": "2026-08-15", "city": "Kindersley", "ticketingMode": "free_rsvp" }\n]'}
              />
              <AdminButton
                type="button"
                className="mt-2"
                onClick={() => handleImportJson(selected.id)}
                disabled={selected.partnerLifecycle === 'graduated'}
              >
                <RefreshCw size={14} className="mr-1 inline" />
                Import JSON to Discover queue
              </AdminButton>
            </div>
          </div>

          <div className="mt-6">
            <p className="admin-label mb-2">Partner events</p>
            <AdminTable columns={['Event', 'Status', 'Date', 'Mode', '']}>
              {listPartnerEvents(selected.id).slice(0, 12).map((ev) => (
                <tr key={ev.id} className="border-b border-[var(--admin-border)]/50">
                  <td className="py-2 pr-3 text-sm text-[var(--admin-text)]">{ev.title}</td>
                  <td className="py-2 pr-3 text-xs text-[var(--admin-text-muted)]">{ev.status}</td>
                  <td className="py-2 pr-3 text-xs text-[var(--admin-text-muted)]">{ev.eventDate || '—'}</td>
                  <td className="py-2 pr-3 text-xs text-[var(--admin-text-muted)]">
                    {ev.ticketingMode ?? '—'}
                  </td>
                  <td className="py-2 text-right">
                    <Link
                      to={`/admin/content?view=events`}
                      className="text-xs text-[var(--admin-accent)] no-underline hover:underline"
                    >
                      Registry
                    </Link>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
        </AdminPanel>
      )}
    </div>
  )
}
