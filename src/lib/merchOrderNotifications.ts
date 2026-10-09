import { getHostEventById } from './account'
import { sendAdminMessage } from './adminMessages'
import { PLATFORM_ADMIN } from './demoAccounts'
import type { MerchOrder } from './eventMerch'

function formatMerchMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function orderSummaryLines(order: MerchOrder): string {
  return order.lines.map((l) => `• ${l.productName} (${l.size}) × ${l.quantity}`).join('\n')
}

function notifyBuyer(order: MerchOrder, subject: string, body: string): void {
  const fromEmail = PLATFORM_ADMIN.email
  sendAdminMessage({
    toEmail: order.userEmail,
    subject,
    body,
    fromEmail,
    deliveryChannels: ['email', 'in_app'],
    notificationMeta: { type: 'admin_message' },
  })
}

export function notifyMerchOrderReceived(order: MerchOrder): void {
  const event = getHostEventById(order.eventId)
  const eventTitle = event?.title ?? 'your event'
  const subject = `Order received — ${order.pickupNumber}`
  const shipNote = order.requiresShipping
    ? '\n\nThis is a pre-order that will ship before the event. We will email you a tracking number when it ships.'
    : `\n\nPickup at the event: show pickup # ${order.pickupNumber} at the merch table.`

  const body = [
    `Hi ${order.holderName},`,
    '',
    `We received your marketplace order for ${eventTitle}.`,
    '',
    orderSummaryLines(order),
    '',
    `Items: ${order.itemCount}`,
    `Total: ${formatMerchMoney(order.totalCents)}`,
    `Pickup / order #: ${order.pickupNumber}`,
    shipNote,
    '',
    '— TUDU Marketplace',
  ].join('\n')

  notifyBuyer(order, subject, body)
}

export function notifyMerchOrderShipped(order: MerchOrder, trackingNumber: string): void {
  const event = getHostEventById(order.eventId)
  const eventTitle = event?.title ?? 'your event'
  const subject = `Shipped — ${order.pickupNumber}`
  const body = [
    `Hi ${order.holderName},`,
    '',
    `Your pre-order for ${eventTitle} has shipped.`,
    '',
    `Confirmation / tracking: ${trackingNumber.trim()}`,
    '',
    orderSummaryLines(order),
    '',
    `Order #: ${order.pickupNumber}`,
    '',
    '— TUDU Marketplace',
  ].join('\n')

  notifyBuyer(order, subject, body)
}
