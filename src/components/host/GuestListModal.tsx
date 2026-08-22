import { useEffect, useMemo, useState } from 'react'
import { Download, Search, Users, X } from 'lucide-react'
import type { HostEvent } from '../../lib/account'
import {
  exportGuestsCsv,
  filterGuests,
  getEventGuests,
  type EventGuest,
} from '../../lib/hostGuests'
import GradientButton from '../GradientButton'

type GuestListModalProps = {
  open: boolean
  event: HostEvent | null
  onClose: () => void
}

export default function GuestListModal({ open, event, onClose }: GuestListModalProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) setQuery('')
  }, [open, event?.id])

  const guests = useMemo(() => {
    if (!event) return []
    return getEventGuests(event.id)
  }, [event?.id])

  const filtered = useMemo(() => filterGuests(guests, query), [guests, query])

  const checkedInCount = useMemo(
    () => guests.filter((guest) => guest.checkedIn).length,
    [guests],
  )

  if (!open || !event) return null

  function handleExport() {
    exportGuestsCsv(event!, filtered)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/40 backdrop-blur-sm"
        aria-label="Close guest list"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-list-title"
        className="fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] left-1/2 z-[calc(var(--z-modal)+1)] flex max-h-[min(85svh,640px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 flex-col overflow-hidden rounded-[14px] border border-app-subtle bg-app-elevated shadow-float"
      >
        <div className="bg-gradient-tudu px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 id="guest-list-title" className="font-display text-lg font-bold text-white">
              Guest List
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <p className="mt-0.5 truncate text-sm text-white/80">{event.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 pt-4">
          <StatCard label="Total guests" value={guests.length} tone="orange" />
          <StatCard label="Checked in" value={checkedInCount} tone="green" />
        </div>

        <div className="relative mx-4 mt-3">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or tier..."
            className="app-field w-full py-2.5 pl-9 pr-3 text-sm"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users size={32} className="text-brown-muted/50" aria-hidden />
              <p className="mt-3 font-display text-sm font-bold text-brown">No guests yet.</p>
              <p className="mt-1 text-xs text-brown-muted">
                Ticket purchases and RSVPs will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-brown/10">
              {filtered.map((guest) => (
                <GuestRow key={guest.id} guest={guest} />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-app-subtle p-4">
          <GradientButton
            type="button"
            fullWidth
            className="py-2.5 text-sm"
            onClick={handleExport}
          >
            <Download size={16} className="mr-1.5" aria-hidden />
            Export CSV ({filtered.length})
          </GradientButton>
        </div>
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'orange' | 'green'
}) {
  const valueClass = tone === 'green' ? 'text-success' : 'text-orange'
  return (
    <div className="rounded-[14px] border border-app-subtle bg-cream-dark/40 px-3 py-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">{label}</p>
      <p className={`mt-0.5 font-display text-2xl font-extrabold ${valueClass}`}>{value}</p>
    </div>
  )
}

function GuestRow({ guest }: { guest: EventGuest }) {
  return (
    <li className="flex items-center justify-between py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate font-semibold text-brown">{guest.name}</p>
        {guest.email && <p className="truncate text-xs text-brown-muted">{guest.email}</p>}
        <p className="mt-0.5 text-xs text-brown-muted">{guest.tier}</p>
      </div>
      <span
        className={`shrink-0 rounded-[14px] px-2 py-0.5 text-[10px] font-bold ${
          guest.checkedIn ? 'bg-success/15 text-success' : 'bg-cream-dark text-brown-muted'
        }`}
      >
        {guest.checkedIn ? 'Checked in' : 'Confirmed'}
      </span>
    </li>
  )
}
