import { Link, useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import TicketEntryCard from '../components/my-tudu/TicketEntryCard'
import GradientButton from '../components/GradientButton'
import { findUserByEmail } from '../lib/auth'
import {
  findUserTicketById,
  getEnrichedTicketById,
} from '../lib/userTickets'

export default function TicketPaperPage() {
  const { id } = useParams<{ id: string }>()
  const rawTicket = id ? findUserTicketById(id) : undefined
  const ticket = id ? getEnrichedTicketById(id) : null
  const hasAccount = rawTicket ? Boolean(findUserByEmail(rawTicket.userEmail)) : false

  function handlePrint() {
    window.print()
  }

  if (!id || !rawTicket || !ticket) {
    return (
      <div className="app-page-shell pb-12">
        <AppHeaderBar logoLinkTo="/discover" />
        <main className="px-6 py-12 text-center">
          <p className="font-display text-sm font-bold text-brown">Ticket not found</p>
          <p className="mt-1 text-sm text-brown-muted">
            This link may be invalid or the ticket may have been cancelled.
          </p>
          <GradientButton to="/discover" className="mt-4 py-3">
            Browse events
          </GradientButton>
        </main>
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-12">
      <AppHeaderBar logoLinkTo="/discover" />

      <main className="px-4 py-4">
        <div className="no-print mx-auto mb-4 max-w-sm text-center">
          <h1 className="font-display text-lg font-extrabold text-brown">Paper ticket</h1>
          <p className="mt-1 text-sm text-brown-muted">
            Print this page or save as PDF. Show the QR code at the door.
          </p>
          {!hasAccount && (
            <p className="mt-2 rounded-[12px] border border-orange/25 bg-orange/8 px-3 py-2 text-xs text-brown-muted">
              Want it in your wallet too?{' '}
              <Link to="/signup" className="font-bold text-orange no-underline">
                Sign up on TUDU
              </Link>{' '}
              with <span className="font-semibold text-brown">{rawTicket.userEmail}</span>.
            </p>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-[14px] bg-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-orange/90"
          >
            <Printer size={16} aria-hidden />
            Print / Save PDF
          </button>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <TicketEntryCard
            ticket={ticket}
            rawTicket={rawTicket}
            printRootId="ticket-paper-print"
            heading="Event Ticket"
          />
        </div>

        <p className="no-print mx-auto mt-4 max-w-sm text-center text-[10px] text-brown-muted">
          Ticket #{ticket.ticketNumber} · Valid for entry only · Not transferable without sender
          approval
        </p>
      </main>
    </div>
  )
}
