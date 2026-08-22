import { findUserByEmail } from './auth'
import { getHostEventById } from './account'
import { sendAdminMessage } from './adminMessages'
import { buildEmailShareUrl } from './eventDetailActions'
import {
  getEnrichedTicketById,
  getTicketHolderName,
  transferUserTicket,
  type UserTicket,
} from './userTickets'

export type SendTicketShareResult =
  | { ok: true; recipientEmail: string; hasTuduAccount: boolean; paperUrl: string }
  | { ok: false; error: string }

export function getTicketPaperUrl(ticketId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tudu.ca'
  return `${origin}/ticket/paper/${ticketId}`
}

export function getTicketWalletUrl(ticketId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tudu.ca'
  return `${origin}/my-tudu/tickets/${ticketId}`
}

function resolveSenderName(fromEmail: string): string {
  const user = findUserByEmail(fromEmail)
  if (user?.firstName) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  }
  return fromEmail.split('@')[0] ?? fromEmail
}

export function buildTicketShareEmailUrl(input: {
  ticket: UserTicket
  fromEmail: string
  toEmail: string
  message?: string
}): string {
  const enriched = getEnrichedTicketById(input.ticket.id)
  const eventTitle = enriched?.eventTitle ?? 'an event on TUDU'
  const senderName = resolveSenderName(input.fromEmail)
  const paperUrl = getTicketPaperUrl(input.ticket.id)
  const walletUrl = getTicketWalletUrl(input.ticket.id)
  const hasAccount = Boolean(findUserByEmail(input.toEmail))

  const lines = [
    input.message?.trim(),
    `${senderName} sent you a ticket to ${eventTitle}.`,
    enriched?.tierName ? `Tier: ${enriched.tierName}` : null,
    enriched?.eventDateTime ? `When: ${enriched.eventDateTime}` : null,
    enriched?.venueName || enriched?.city
      ? `Where: ${[enriched?.venueName, enriched?.city].filter(Boolean).join(' · ')}`
      : null,
    '',
    `Paper ticket (print or save): ${paperUrl}`,
    hasAccount
      ? `View in My TUDU: ${walletUrl}`
      : `Create a TUDU account with ${input.toEmail} to save this ticket in your wallet: ${walletUrl}`,
  ].filter(Boolean)

  return buildEmailShareUrl(`Your ticket: ${eventTitle}`, lines.join('\n'), paperUrl)
}

export function sendTicketToRecipient(input: {
  ticketId: string
  fromEmail: string
  toEmail: string
  holderName?: string
  message?: string
}): SendTicketShareResult {
  const recipientEmail = input.toEmail.trim().toLowerCase()
  const transfer = transferUserTicket(input.fromEmail, input.ticketId, recipientEmail, {
    holderName: input.holderName,
  })
  if (!transfer.ok) {
    return { ok: false, error: transfer.error }
  }

  const ticket = transfer.ticket
  const enriched = getEnrichedTicketById(ticket.id)
  const event = getHostEventById(ticket.eventId)
  const eventTitle = enriched?.eventTitle ?? event?.title ?? 'Event'
  const senderName = resolveSenderName(input.fromEmail)
  const paperUrl = getTicketPaperUrl(ticket.id)
  const walletUrl = getTicketWalletUrl(ticket.id)
  const hasTuduAccount = Boolean(findUserByEmail(recipientEmail))
  const holderName = getTicketHolderName(ticket)

  const bodyLines = [
    input.message?.trim(),
    `${senderName} sent you a ticket to ${eventTitle}.`,
    `Ticket holder: ${holderName}`,
    enriched?.tierName ? `Tier: ${enriched.tierName}` : null,
    enriched?.eventDateTime ? `When: ${enriched.eventDateTime}` : null,
    enriched?.venueName || enriched?.city
      ? `Where: ${[enriched?.venueName, enriched?.city].filter(Boolean).join(' · ')}`
      : null,
    '',
    `Paper ticket (print or save PDF): ${paperUrl}`,
    hasTuduAccount
      ? `Open in My TUDU: ${walletUrl}`
      : `Sign up on TUDU with ${recipientEmail} to save this ticket in your wallet.`,
  ].filter(Boolean)

  sendAdminMessage({
    toEmail: recipientEmail,
    fromEmail: input.fromEmail,
    subject: `${senderName} sent you a ticket · ${eventTitle}`,
    body: bodyLines.join('\n'),
    deliveryChannels: ['in_app', 'email'],
  })

  return {
    ok: true,
    recipientEmail,
    hasTuduAccount,
    paperUrl,
  }
}
