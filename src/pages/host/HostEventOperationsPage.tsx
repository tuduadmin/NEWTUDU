import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Download, Phone, Users } from 'lucide-react'
import AppHeaderBar from '../../components/locked/AppHeaderBar'
import BottomNav from '../../components/BottomNav'
import GradientButton from '../../components/GradientButton'
import { BackLink } from '../../components/NavActionButtons'
import { getHostEventById } from '../../lib/account'
import {
  getEventChecklistPickList,
  getEventContactList,
  getEventMerchPickList,
} from '../../lib/eventOperations'
import { exportMerchFulfillmentCsv, getMerchFulfillmentRows } from '../../lib/eventMerch'

type OpsTab = 'pick' | 'contacts'

export default function HostEventOperationsPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const event = eventId ? getHostEventById(eventId) : undefined
  const [tab, setTab] = useState<OpsTab>('pick')

  const merchPick = useMemo(
    () => (event ? getEventMerchPickList(event.id) : []),
    [event],
  )
  const checklistPick = useMemo(
    () => (event ? getEventChecklistPickList(event.id, event.checklist) : []),
    [event],
  )
  const contacts = useMemo(
    () => (event ? getEventContactList(event.id, event) : []),
    [event],
  )

  if (!event) {
    return (
      <div className="app-page-shell flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-28 text-center">
        <h1 className="font-display text-xl font-bold text-brown">Event not found</h1>
        <BackLink to="/host" className="mt-4 text-orange">
          Back to Event Manager
        </BackLink>
      </div>
    )
  }

  function exportContactsCsv() {
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Checklist / notes']
    const rows = contacts.map((c) => [
      c.name,
      c.email,
      c.phone ?? '',
      c.tier,
      c.checklistNote ?? '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event!.title.replace(/[^\w\s-]/g, '').trim() || 'event'}-contacts.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportMerchPickCsv() {
    exportMerchFulfillmentCsv(event.title, getMerchFulfillmentRows(event.id))
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar title="Event ops" />
      <main className="mx-auto max-w-lg px-4 pt-4">
        <BackLink to="/host" className="text-sm text-orange">
          Event Manager
        </BackLink>
        <h1 className="mt-2 font-display text-xl font-bold text-brown">{event.title}</h1>
        <p className="mt-1 text-xs text-brown-muted">
          Pick lists for merch & checklist · contact list for RSVPs and ticket holders
        </p>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/host/event/${event.id}/merch`}
            className="text-xs font-semibold text-orange no-underline hover:underline"
          >
            Marketplace & shipping →
          </Link>
        </div>

        <div className="mt-4 flex rounded-[14px] border border-app-subtle bg-app-elevated p-1">
          <TabButton active={tab === 'pick'} onClick={() => setTab('pick')}>
            <ClipboardList size={14} aria-hidden />
            Pick lists
          </TabButton>
          <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')}>
            <Users size={14} aria-hidden />
            Contacts ({contacts.length})
          </TabButton>
        </div>

        {tab === 'pick' && (
          <div className="mt-4 space-y-4">
            <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
              <h2 className="font-display text-sm font-bold text-brown">Merch shelf pick list</h2>
              <p className="mt-1 text-xs text-brown-muted">
                Totals to prep for event pickup (excludes shipped pre-orders).
              </p>
              {merchPick.length === 0 ? (
                <p className="mt-3 text-sm text-brown-muted">No open merch pre-orders.</p>
              ) : (
                <ul className="mt-3 divide-y divide-app-subtle">
                  {merchPick.map((line) => (
                    <li
                      key={`${line.productId}-${line.size}`}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="text-brown">
                        {line.productName}{' '}
                        <span className="text-brown-muted">({line.size})</span>
                      </span>
                      <span className="font-display font-bold tabular-nums text-orange">
                        ×{line.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <GradientButton
                type="button"
                fullWidth
                className="mt-3 py-2 text-sm"
                disabled={merchPick.length === 0}
                onClick={exportMerchPickCsv}
              >
                <Download size={14} className="mr-1" aria-hidden />
                Export merch detail CSV
              </GradientButton>
            </section>

            {event.checklist?.enabled && (
              <section className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
                <h2 className="font-display text-sm font-bold text-brown">Checklist pick list</h2>
                <p className="mt-1 text-xs text-brown-muted">Who is bringing what · open slots</p>
                {checklistPick.length === 0 ? (
                  <p className="mt-3 text-sm text-brown-muted">No checklist items on this event.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {checklistPick.map((row) => (
                      <li
                        key={row.itemId}
                        className="rounded-[12px] border border-brown/10 bg-cream-dark/30 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-brown">{row.label}</span>
                          <span className="text-xs font-bold text-brown-muted">
                            {row.claimed}/{row.needed}
                            {row.remaining > 0 && (
                              <span className="ml-1 text-orange">· {row.remaining} open</span>
                            )}
                          </span>
                        </div>
                        {row.bringers.length > 0 ? (
                          <ul className="mt-1.5 text-xs text-brown-muted">
                            {row.bringers.map((name) => (
                              <li key={name}>• {name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-xs italic text-brown-muted">Unclaimed</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}

        {tab === 'contacts' && (
          <section className="mt-4 rounded-[14px] border border-app-subtle bg-app-elevated p-4">
            <p className="text-xs text-brown-muted">
              Ticket holders and RSVPs — email and phone when on file.
            </p>
            {contacts.length === 0 ? (
              <p className="mt-4 text-center text-sm text-brown-muted">No guests yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-app-subtle">
                {contacts.map((guest) => (
                  <li key={guest.id} className="py-3">
                    <p className="font-semibold text-brown">{guest.name}</p>
                    <p className="text-xs text-brown-muted">{guest.email || 'No email'}</p>
                    {guest.phone && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-brown">
                        <Phone size={12} className="text-orange" aria-hidden />
                        <a href={`tel:${guest.phone}`} className="text-orange no-underline">
                          {guest.phone}
                        </a>
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-brown-muted">
                      {guest.tier}
                      {guest.checklistNote ? ` · ${guest.checklistNote}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <GradientButton
              type="button"
              fullWidth
              className="mt-4 py-2 text-sm"
              disabled={contacts.length === 0}
              onClick={exportContactsCsv}
            >
              <Download size={14} className="mr-1" aria-hidden />
              Export contacts CSV
            </GradientButton>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-xs font-bold transition ${
        active ? 'bg-orange text-white shadow-sm' : 'text-brown-muted hover:text-brown'
      }`}
    >
      {children}
    </button>
  )
}
