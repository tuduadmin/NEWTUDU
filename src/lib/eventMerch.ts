/**
 * Event marketplace — pre-order merch tied to events.
 * Phase 1: localStorage. Platform fee: $0.49 per item (not per transaction).
 */

import { getHostEventById, getHostEvents, type HostEvent } from './account'
import { resolveTicketHolderName } from './ticketHolderName'

export const MERCH_PLATFORM_FEE_CENTS = 49

export const MERCH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] as const
export type MerchSize = (typeof MERCH_SIZES)[number]

const MERCH_SIZE_ORDER = new Map(MERCH_SIZES.map((size, index) => [size, index]))

/** Always XS → S → M → L → XL → XXL → One Size. */
export function sortMerchSizes(sizes: MerchSize[]): MerchSize[] {
  return [...sizes].sort(
    (a, b) => (MERCH_SIZE_ORDER.get(a) ?? 999) - (MERCH_SIZE_ORDER.get(b) ?? 999),
  )
}

export type EventMerchProduct = {
  id: string
  eventId: string
  hostAccountId?: string | null
  name: string
  description?: string
  imageUrl?: string
  priceCents: number
  sizes: MerchSize[]
  /** Total units available per size (pre-order cap). */
  sizeStock?: Partial<Record<MerchSize, number>>
  active: boolean
  createdAt: string
}

export type MerchOrderLine = {
  productId: string
  productName: string
  size: MerchSize
  quantity: number
  unitPriceCents: number
}

export type MerchOrder = {
  id: string
  userEmail: string
  eventId: string
  ticketId?: string
  lines: MerchOrderLine[]
  itemCount: number
  subtotalCents: number
  platformFeeCents: number
  totalCents: number
  pickupNumber: string
  holderName: string
  status: 'pending_pickup' | 'picked_up'
  purchasedAt: string
  pickedUpAt?: string
}

export type MerchStockLine = {
  productId: string
  productName: string
  size: MerchSize
  quantity: number
  imageUrl?: string
}

/** One row per ordered item — used for host fulfillment export and lookup. */
export type MerchFulfillmentRow = {
  orderId: string
  pickupNumber: string
  holderName: string
  userEmail: string
  productName: string
  size: MerchSize
  quantity: number
  status: MerchOrder['status']
  purchasedAt: string
  pickedUpAt?: string
}

export type MerchFulfillmentStatusFilter = 'all' | 'pending_pickup' | 'picked_up'

const PRODUCTS_KEY = 'tudu_event_merch_products'
const ORDERS_KEY = 'tudu_merch_orders'
const DEMO_MERCH_SEEDED_KEY = 'tudu_event_merch_demo_seeded'

function readProducts(): EventMerchProduct[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY)
    return raw ? (JSON.parse(raw) as EventMerchProduct[]) : []
  } catch {
    return []
  }
}

function writeProducts(
  products: EventMerchProduct[],
): { ok: true } | { ok: false; error: string } {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
    return { ok: true }
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22)
    return {
      ok: false,
      error: isQuota
        ? 'Storage full — remove a product or use a smaller image.'
        : 'Could not save product. Try again.',
    }
  }
}

function readOrders(): MerchOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    return raw ? (JSON.parse(raw) as MerchOrder[]) : []
  } catch {
    return []
  }
}

function writeOrders(orders: MerchOrder[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function formatPickupNumber(orderId: string): string {
  return `MP-${orderId.replace(/^mord_/, '').slice(-6).toUpperCase()}`
}

export function calcMerchPlatformFee(itemCount: number): number {
  return Math.max(0, itemCount) * MERCH_PLATFORM_FEE_CENTS
}

export function formatMerchMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

const DEFAULT_SIZE_STOCK = 25

export function normalizeMerchProduct(product: EventMerchProduct): EventMerchProduct {
  const sizeStock: Partial<Record<MerchSize, number>> = { ...(product.sizeStock ?? {}) }
  const sizes = sortMerchSizes(product.sizes)
  for (const size of sizes) {
    const raw = sizeStock[size]
    sizeStock[size] =
      raw == null || !Number.isFinite(raw) || raw < 0 ? DEFAULT_SIZE_STOCK : Math.floor(raw)
  }
  return { ...product, sizes, sizeStock }
}

export function buildSizeStockForSizes(
  sizes: MerchSize[],
  quantities: Partial<Record<MerchSize, number>>,
  fallback = DEFAULT_SIZE_STOCK,
): Partial<Record<MerchSize, number>> {
  const sizeStock: Partial<Record<MerchSize, number>> = {}
  for (const size of sizes) {
    const raw = quantities[size]
    sizeStock[size] =
      raw == null || !Number.isFinite(raw) || raw < 0 ? fallback : Math.floor(raw)
  }
  return sizeStock
}

export function getMerchSizeOrderedQty(productId: string, size: MerchSize): number {
  return readOrders()
    .flatMap((order) => order.lines)
    .filter((line) => line.productId === productId && line.size === size)
    .reduce((sum, line) => sum + line.quantity, 0)
}

export function getMerchSizeAvailable(product: EventMerchProduct, size: MerchSize): number {
  const normalized = normalizeMerchProduct(product)
  const stock = normalized.sizeStock?.[size] ?? 0
  const ordered = getMerchSizeOrderedQty(product.id, size)
  return Math.max(0, stock - ordered)
}

export function isMerchSizeSoldOut(product: EventMerchProduct, size: MerchSize): boolean {
  return getMerchSizeAvailable(product, size) <= 0
}

export function firstAvailableMerchSize(product: EventMerchProduct): MerchSize | undefined {
  const normalized = normalizeMerchProduct(product)
  return normalized.sizes.find((size) => getMerchSizeAvailable(normalized, size) > 0)
}

export function validateMerchOrderLines(
  lines: MerchOrderLine[],
): { ok: true } | { ok: false; error: string } {
  for (const line of lines) {
    const product = getMerchProduct(line.productId)
    if (!product) {
      return { ok: false, error: `${line.productName} is no longer available.` }
    }
    const available = getMerchSizeAvailable(product, line.size)
    if (line.quantity > available) {
      const label = available === 0 ? 'sold out' : `only ${available} left`
      return {
        ok: false,
        error: `${line.productName} (${line.size}) is ${label}.`,
      }
    }
  }
  return { ok: true }
}

export function getMerchProductsForEvent(eventId: string): EventMerchProduct[] {
  seedDemoMerchIfNeeded()
  return readProducts()
    .filter((p) => p.eventId === eventId && p.active)
    .map(normalizeMerchProduct)
}

export function getMerchProductsForHost(
  hostKind: 'personal' | 'org',
  hostId: string,
): EventMerchProduct[] {
  seedDemoMerchIfNeeded()
  const normalized = hostKind === 'personal' ? normalizeEmail(hostId) : hostId
  return readProducts().filter((p) => {
    if (!p.active) return false
    const event = getHostEventById(p.eventId)
    if (!event) return false
    if (hostKind === 'org') return event.hostAccountId === normalized
    const poster = event.postedAsUserId ?? event.createdBy
    return !event.hostAccountId && normalizeEmail(poster) === normalized
  })
}

export function getMerchProduct(productId: string): EventMerchProduct | undefined {
  const product = readProducts().find((p) => p.id === productId)
  return product ? normalizeMerchProduct(product) : undefined
}

export function saveMerchProduct(
  input: Omit<EventMerchProduct, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): { ok: true; product: EventMerchProduct } | { ok: false; error: string } {
  const products = readProducts()
  const product: EventMerchProduct = normalizeMerchProduct({
    id: input.id ?? generateId('mprod'),
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
    sizes: sortMerchSizes(input.sizes),
  })
  const idx = products.findIndex((p) => p.id === product.id)
  if (idx >= 0) products[idx] = product
  else products.push(product)
  const saved = writeProducts(products)
  if (!saved.ok) return saved
  return { ok: true, product }
}

export function deleteMerchProduct(productId: string): { ok: true } | { ok: false; error: string } {
  return writeProducts(readProducts().filter((p) => p.id !== productId))
}

export function getMerchOrdersForUser(userEmail: string): MerchOrder[] {
  const email = normalizeEmail(userEmail)
  return readOrders()
    .filter((o) => normalizeEmail(o.userEmail) === email)
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
}

export function getMerchOrdersForUserEvent(userEmail: string, eventId: string): MerchOrder[] {
  return getMerchOrdersForUser(userEmail).filter((o) => o.eventId === eventId)
}

export function getMerchOrderById(orderId: string): MerchOrder | undefined {
  return readOrders().find((o) => o.id === orderId)
}

export function getMerchOrdersForEvent(eventId: string): MerchOrder[] {
  return readOrders().filter((o) => o.eventId === eventId)
}

export function buildMerchPickupQrPayload(order: MerchOrder): string {
  return JSON.stringify({
    type: 'merch_pickup',
    orderId: order.id,
    eventId: order.eventId,
    pickupNumber: order.pickupNumber,
    attendee: order.userEmail,
    holderName: order.holderName,
    items: order.lines.map((l) => ({
      name: l.productName,
      size: l.size,
      qty: l.quantity,
    })),
  })
}

export type CreateMerchOrderInput = {
  userEmail: string
  eventId: string
  ticketId?: string
  lines: MerchOrderLine[]
  holderName?: string
}

export function createMerchOrder(input: CreateMerchOrderInput): MerchOrder | null {
  if (input.lines.length === 0) return null

  const validation = validateMerchOrderLines(input.lines)
  if (!validation.ok) return null

  const itemCount = input.lines.reduce((sum, l) => sum + l.quantity, 0)
  const subtotalCents = input.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
  const platformFeeCents = calcMerchPlatformFee(itemCount)
  const email = normalizeEmail(input.userEmail)
  const holderName = input.holderName?.trim() || resolveTicketHolderName(email)

  const order: MerchOrder = {
    id: generateId('mord'),
    userEmail: email,
    eventId: input.eventId,
    ticketId: input.ticketId,
    lines: input.lines,
    itemCount,
    subtotalCents,
    platformFeeCents,
    totalCents: subtotalCents + platformFeeCents,
    pickupNumber: '',
    holderName,
    status: 'pending_pickup',
    purchasedAt: new Date().toISOString(),
  }
  order.pickupNumber = formatPickupNumber(order.id)

  const orders = readOrders()
  orders.unshift(order)
  writeOrders(orders.slice(0, 2000))
  return order
}

export function createMerchOrderWithValidation(
  input: CreateMerchOrderInput,
): { ok: true; order: MerchOrder } | { ok: false; error: string } {
  if (input.lines.length === 0) {
    return { ok: false, error: 'Add at least one item.' }
  }

  const validation = validateMerchOrderLines(input.lines)
  if (!validation.ok) return validation

  const order = createMerchOrder(input)
  if (!order) {
    return { ok: false, error: 'Could not place order.' }
  }
  return { ok: true, order }
}

export function redeemMerchOrder(
  pickupNumberOrOrderId: string,
): { ok: true; order: MerchOrder } | { ok: false; error: string } {
  const query = pickupNumberOrOrderId.trim().toUpperCase()
  const orders = readOrders()
  const order = orders.find(
    (o) =>
      o.pickupNumber.toUpperCase() === query ||
      o.id.toUpperCase() === query ||
      o.id.replace(/^mord_/, '').slice(-6).toUpperCase() === query.replace(/^MP-/, ''),
  )

  if (!order) return { ok: false, error: 'Pickup order not found.' }
  if (order.status === 'picked_up') {
    return { ok: false, error: `Already picked up at ${new Date(order.pickedUpAt!).toLocaleString()}.` }
  }

  order.status = 'picked_up'
  order.pickedUpAt = new Date().toISOString()
  writeOrders(orders)
  return { ok: true, order }
}

export function redeemMerchOrderById(
  orderId: string,
): { ok: true; order: MerchOrder } | { ok: false; error: string } {
  const order = getMerchOrderById(orderId)
  if (!order) return { ok: false, error: 'Pickup order not found.' }
  return redeemMerchOrder(order.pickupNumber)
}

/** Find orders by pickup number, order id, email, or holder name (optional event scope). */
export function findMerchOrders(query: string, eventId?: string): MerchOrder[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const upper = trimmed.toUpperCase()
  const emailQuery = trimmed.includes('@') ? normalizeEmail(trimmed) : ''
  const nameQuery = trimmed.toLowerCase()

  const pool = (eventId ? getMerchOrdersForEvent(eventId) : readOrders()).slice()

  return pool
    .filter((order) => {
      if (order.pickupNumber.toUpperCase() === upper) return true
      if (order.id.toUpperCase() === upper) return true
      if (
        order.id.replace(/^mord_/, '').slice(-6).toUpperCase() === upper.replace(/^MP-/, '')
      ) {
        return true
      }
      if (emailQuery && normalizeEmail(order.userEmail) === emailQuery) return true
      if (order.holderName.toLowerCase().includes(nameQuery)) return true
      return false
    })
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
}

/** Flat fulfillment rows for an event (one row per product line). */
export function getMerchFulfillmentRows(eventId: string): MerchFulfillmentRow[] {
  const rows: MerchFulfillmentRow[] = []
  for (const order of getMerchOrdersForEvent(eventId)) {
    for (const line of order.lines) {
      rows.push({
        orderId: order.id,
        pickupNumber: order.pickupNumber,
        holderName: order.holderName,
        userEmail: order.userEmail,
        productName: line.productName,
        size: line.size,
        quantity: line.quantity,
        status: order.status,
        purchasedAt: order.purchasedAt,
        pickedUpAt: order.pickedUpAt,
      })
    }
  }
  return rows.sort(
    (a, b) =>
      a.status.localeCompare(b.status) ||
      a.pickupNumber.localeCompare(b.pickupNumber) ||
      a.productName.localeCompare(b.productName) ||
      a.size.localeCompare(b.size),
  )
}

export function filterMerchFulfillmentRows(
  rows: MerchFulfillmentRow[],
  query: string,
  status: MerchFulfillmentStatusFilter = 'all',
): MerchFulfillmentRow[] {
  const q = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (status !== 'all' && row.status !== status) return false
    if (!q) return true
    return (
      row.pickupNumber.toLowerCase().includes(q) ||
      row.holderName.toLowerCase().includes(q) ||
      row.userEmail.toLowerCase().includes(q) ||
      row.productName.toLowerCase().includes(q) ||
      row.size.toLowerCase().includes(q)
    )
  })
}

export function exportMerchFulfillmentCsv(eventTitle: string, rows: MerchFulfillmentRow[]): void {
  const headers = [
    'Pickup Number',
    'Holder Name',
    'Email',
    'Product',
    'Size',
    'Quantity',
    'Status',
    'Purchased At',
    'Picked Up At',
    'Order ID',
  ]
  const csvRows = rows.map((row) => [
    row.pickupNumber,
    row.holderName,
    row.userEmail,
    row.productName,
    row.size,
    String(row.quantity),
    row.status === 'picked_up' ? 'Picked up' : 'Waiting',
    row.purchasedAt,
    row.pickedUpAt ?? '',
    row.orderId,
  ])
  const csv = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const slug = eventTitle.replace(/[^\w\s-]/g, '').trim() || 'event'
  link.download = `${slug}-merch-fulfillment.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/** What merchants should stock on the shelf — aggregated pre-orders by product + size. */
export function getMerchStockReport(eventId: string): MerchStockLine[] {
  const products = getMerchProductsForEvent(eventId)
  const byKey = new Map<string, MerchStockLine>()

  for (const order of getMerchOrdersForEvent(eventId)) {
    if (order.status === 'picked_up') continue
    for (const line of order.lines) {
      const key = `${line.productId}:${line.size}`
      const existing = byKey.get(key)
      const product = products.find((p) => p.id === line.productId)
      if (existing) {
        existing.quantity += line.quantity
      } else {
        byKey.set(key, {
          productId: line.productId,
          productName: line.productName,
          size: line.size,
          quantity: line.quantity,
          imageUrl: product?.imageUrl,
        })
      }
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.productName.localeCompare(b.productName) || a.size.localeCompare(b.size),
  )
}

function seedDemoMerchIfNeeded(): void {
  const events = findDemoSeedEvents()
  const demoEventIds = new Set(events.map((e) => e.id))
  const hasDemoProducts = readProducts().some(
    (p) => p.active && demoEventIds.has(p.eventId),
  )

  if (localStorage.getItem(DEMO_MERCH_SEEDED_KEY) && hasDemoProducts) return

  if (events.length === 0) {
    if (!localStorage.getItem(DEMO_MERCH_SEEDED_KEY)) {
      localStorage.setItem(DEMO_MERCH_SEEDED_KEY, '1')
    }
    return
  }

  const event = events[0]
  const samples: Omit<EventMerchProduct, 'id' | 'createdAt'>[] = [
    {
      eventId: event.id,
      hostAccountId: event.hostAccountId,
      name: 'Event Tee',
      description: 'Soft cotton tee with event artwork.',
      imageUrl:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80&auto=format&fit=crop',
      priceCents: 2500,
      sizes: ['S', 'M', 'L', 'XL'],
      sizeStock: { S: 30, M: 40, L: 35, XL: 20 },
      active: true,
    },
    {
      eventId: event.id,
      hostAccountId: event.hostAccountId,
      name: 'Commemorative Hoodie',
      description: 'Pre-order only — pick up at the merch shelf.',
      imageUrl:
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80&auto=format&fit=crop',
      priceCents: 4500,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      sizeStock: { S: 15, M: 20, L: 20, XL: 15, XXL: 10 },
      active: true,
    },
    {
      eventId: event.id,
      hostAccountId: event.hostAccountId,
      name: 'Sticker Pack',
      description: 'Three vinyl stickers.',
      imageUrl:
        'https://images.unsplash.com/photo-1611532736597-de2d9425d786?w=400&q=80&auto=format&fit=crop',
      priceCents: 800,
      sizes: ['One Size'],
      sizeStock: { 'One Size': 100 },
      active: true,
    },
  ]

  for (const sample of samples) {
    saveMerchProduct(sample)
  }
  localStorage.setItem(DEMO_MERCH_SEEDED_KEY, '1')
}

function findDemoSeedEvents(): HostEvent[] {
  const events = getHostEvents()
  const orgEvent = events.find(
    (e) =>
      e.hostAccountId === 'org_demo_kindersley' &&
      (e.status === 'live' || e.status === 'upcoming'),
  )
  if (orgEvent) return [orgEvent]
  return events.filter((e) => e.status === 'live' || e.status === 'upcoming').slice(0, 1)
}

export function hostHasMerchProducts(hostKind: 'personal' | 'org', hostId: string): boolean {
  return getMerchProductsForHost(hostKind, hostId).length > 0
}

export function getPrimaryMarketplaceEventId(
  hostKind: 'personal' | 'org',
  hostId: string,
): string | null {
  const products = getMerchProductsForHost(hostKind, hostId)
  return products[0]?.eventId ?? null
}

function getEventsForHostProfile(hostKind: 'personal' | 'org', hostId: string): HostEvent[] {
  const events = getHostEvents()
  if (hostKind === 'org') {
    return events.filter((e) => e.hostAccountId === hostId)
  }
  const normalized = normalizeEmail(hostId)
  return events.filter((e) => {
    if (e.hostAccountId) return false
    const poster = e.postedAsUserId ?? e.createdBy
    return normalizeEmail(poster) === normalized
  })
}

function pickMarketplaceEventId(hostKind: 'personal' | 'org', hostId: string): string | null {
  const fromProducts = getPrimaryMarketplaceEventId(hostKind, hostId)
  if (fromProducts) return fromProducts

  const events = getEventsForHostProfile(hostKind, hostId)
  const preferred = events.find((e) => e.status === 'live' || e.status === 'upcoming')
  return preferred?.id ?? events[0]?.id ?? null
}

export type MarketplaceNavTarget =
  | { kind: 'in-app'; eventId: string }
  | { kind: 'external'; url: string }

export function resolveMarketplaceNavTarget(
  hostKind: 'personal' | 'org',
  hostId: string,
  merchShopUrl?: string,
): MarketplaceNavTarget | null {
  const eventId = pickMarketplaceEventId(hostKind, hostId)
  if (eventId) return { kind: 'in-app', eventId }

  const url = merchShopUrl?.trim()
  if (url) return { kind: 'external', url }
  return null
}

export function canOpenHostMarketplace(
  hostKind: 'personal' | 'org',
  hostId: string,
  showMerchShop: boolean,
  merchShopUrl?: string,
): boolean {
  if (!showMerchShop) return false
  return resolveMarketplaceNavTarget(hostKind, hostId, merchShopUrl) !== null
}

export function openHostMarketplace(
  navigate: (path: string) => void,
  hostKind: 'personal' | 'org',
  hostId: string,
  merchShopUrl?: string,
): boolean {
  const target = resolveMarketplaceNavTarget(hostKind, hostId, merchShopUrl)
  if (!target) return false
  if (target.kind === 'in-app') {
    navigate(`/event/${target.eventId}/marketplace`)
    return true
  }
  window.open(target.url, '_blank', 'noopener,noreferrer')
  return true
}
