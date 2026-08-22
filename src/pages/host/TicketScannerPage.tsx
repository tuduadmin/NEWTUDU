import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MessageSquare, Package, Search, Ticket, X } from 'lucide-react'
import { getHostEventById } from '../../lib/account'
import {
  findMerchOrders,
  redeemMerchOrder,
  redeemMerchOrderById,
  type MerchOrder,
} from '../../lib/eventMerch'

type ScanMode = 'ticket' | 'merch'

type MerchScanResult =
  | { kind: 'success'; order: MerchOrder }
  | { kind: 'lookup'; orders: MerchOrder[] }
  | { kind: 'error'; message: string }

function isMerchPickupCode(code: string): boolean {
  return /^MP-/i.test(code) || /^MORD_/i.test(code)
}

function parseScanInput(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    const parsed = JSON.parse(trimmed) as { type?: string; pickupNumber?: string; orderId?: string }
    if (parsed.type === 'merch_pickup') {
      return parsed.pickupNumber ?? parsed.orderId ?? trimmed
    }
  } catch {
    // plain pickup number or ticket ref
  }
  return trimmed
}

export default function TicketScannerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const manual = searchParams.get('manual') === '1'
  const modeParam = searchParams.get('mode')
  const scanMode: ScanMode = modeParam === 'merch' ? 'merch' : 'ticket'

  const [manualCode, setManualCode] = useState('')
  const [merchResult, setMerchResult] = useState<MerchScanResult | null>(null)

  function openManual() {
    setSearchParams({ manual: '1', mode: scanMode })
  }

  function closeManual() {
    setSearchParams(scanMode === 'merch' ? { mode: 'merch' } : {})
    setManualCode('')
    setMerchResult(null)
  }

  function setScanMode(next: ScanMode) {
    setMerchResult(null)
    setManualCode('')
    if (manual) {
      setSearchParams({ manual: '1', mode: next })
    } else {
      setSearchParams(next === 'merch' ? { mode: 'merch' } : {})
    }
  }

  function handleClose() {
    navigate('/host')
  }

  function handleMerchVerify() {
    const code = parseScanInput(manualCode)
    if (!code) {
      setMerchResult({ kind: 'error', message: 'Enter pickup number, email, or name.' })
      return
    }

    const looksLikeLookup =
      code.includes('@') || (!isMerchPickupCode(code) && !code.trim().startsWith('{'))

    if (looksLikeLookup) {
      const matches = findMerchOrders(code)
      if (matches.length === 0) {
        setMerchResult({ kind: 'error', message: 'No merch orders found for that email or name.' })
        return
      }
      setMerchResult({ kind: 'lookup', orders: matches })
      return
    }

    const result = redeemMerchOrder(code)
    if (!result.ok) {
      const matches = findMerchOrders(code)
      if (matches.length > 0) {
        setMerchResult({ kind: 'lookup', orders: matches })
        return
      }
      setMerchResult({ kind: 'error', message: result.error })
      return
    }
    setMerchResult({ kind: 'success', order: result.order })
  }

  function handleMerchRedeem(orderId: string) {
    const result = redeemMerchOrderById(orderId)
    if (!result.ok) {
      setMerchResult({ kind: 'error', message: result.error })
      return
    }
    setMerchResult({ kind: 'success', order: result.order })
  }

  const successOrder = merchResult?.kind === 'success' ? merchResult.order : null
  const eventTitle = successOrder ? getHostEventById(successOrder.eventId)?.title : null

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-black/40">
      <div className="mx-auto mt-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-cream shadow-float">
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-brown/20" aria-hidden />
        </div>

        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <h1 className="font-display text-xl font-extrabold text-gradient">
            {scanMode === 'merch' ? 'Merch Pickup Scanner' : 'Ticket Scanner'}
          </h1>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close scanner"
            className="flex h-10 w-10 items-center justify-center rounded-full text-brown-muted transition hover:bg-brown/5"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mx-4 mb-3 flex rounded-[14px] border border-brown/10 bg-cream-dark/50 p-1">
          <button
            type="button"
            onClick={() => setScanMode('ticket')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2 text-xs font-bold transition ${
              scanMode === 'ticket' ? 'bg-white text-brown shadow-sm' : 'text-brown-muted'
            }`}
          >
            <Ticket size={14} aria-hidden />
            Tickets
          </button>
          <button
            type="button"
            onClick={() => setScanMode('merch')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2 text-xs font-bold transition ${
              scanMode === 'merch' ? 'bg-white text-brown shadow-sm' : 'text-brown-muted'
            }`}
          >
            <Package size={14} aria-hidden />
            Merch shelf
          </button>
        </div>

        <div className={`relative flex-1 ${manual ? 'bg-black' : 'bg-[#1a1a1a]'}`}>
          {!manual ? (
            <>
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop)',
                  }}
                />
                <div className="absolute inset-0 bg-black/30" />
              </div>

              <p className="absolute left-0 right-0 top-6 text-center text-xs font-medium text-white/60">
                TUDU Entertainment Inc
              </p>

              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative h-64 w-full max-w-xs">
                  <span className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-white" />
                  <span className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-white" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-white" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-white" />

                  <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-orange via-purple to-orange opacity-90 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                </div>
              </div>

              <p className="absolute left-4 right-4 top-16 text-center text-xs text-white/70">
                {scanMode === 'merch'
                  ? 'Scan attendee merch pickup QR — separate from entry tickets'
                  : 'Scan entry ticket QR at the door'}
              </p>

              <div className="absolute bottom-6 left-4 right-4">
                <button
                  type="button"
                  onClick={openManual}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/20 bg-white/15 py-4 font-display text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/25"
                >
                  <MessageSquare size={18} />
                  Manual Entry
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="absolute left-0 right-0 top-6 text-center text-xs font-medium text-white/50">
                TUDU Entertainment Inc
              </p>

              <div className="flex h-full flex-col items-center justify-center px-4 pb-24 pt-16">
                <div className="w-full max-w-sm rounded-[14px] bg-[#2a2a2a] p-5">
                  <p className="text-center text-xs text-white/50">
                    {scanMode === 'merch'
                      ? 'Enter pickup number (MP-…), email, name, or paste merch QR payload:'
                      : 'Attendee has no QR code? Enter reference below:'}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => {
                        setManualCode(e.target.value)
                        setMerchResult(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && scanMode === 'merch') handleMerchVerify()
                      }}
                      placeholder={scanMode === 'merch' ? 'e.g. MP-A1B2C3' : 'e.g. TDU-XXXX'}
                      className="min-w-0 flex-1 rounded-[14px] border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange/50"
                    />
                    <button
                      type="button"
                      onClick={scanMode === 'merch' ? handleMerchVerify : undefined}
                      disabled={scanMode === 'ticket'}
                      className="flex shrink-0 items-center gap-1.5 rounded-[14px] bg-gradient-tudu px-4 py-3 font-display text-sm font-bold text-white disabled:opacity-50"
                    >
                      <Search size={16} />
                      {scanMode === 'merch' ? 'Look up' : 'Verify'}
                    </button>
                  </div>

                  {scanMode === 'ticket' && (
                    <p className="mt-3 text-center text-[11px] text-white/40">
                      Ticket verify coming soon — use camera scan for entry tickets.
                    </p>
                  )}

                  {merchResult?.kind === 'error' && (
                    <p className="mt-3 rounded-[12px] bg-rose-500/15 px-3 py-2 text-center text-xs font-semibold text-rose-200">
                      {merchResult.message}
                    </p>
                  )}

                  {merchResult?.kind === 'lookup' && (
                    <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                      {merchResult.orders.map((order) => (
                        <MerchLookupCard
                          key={order.id}
                          order={order}
                          onRedeem={() => handleMerchRedeem(order.id)}
                        />
                      ))}
                    </div>
                  )}

                  {successOrder && (
                    <div className="mt-4 rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <div className="flex items-center justify-center gap-2 text-emerald-300">
                        <CheckCircle2 size={18} aria-hidden />
                        <p className="font-display text-sm font-bold">Ready for pickup</p>
                      </div>
                      <p className="mt-2 text-center font-mono text-lg font-bold tracking-widest text-white">
                        {successOrder.pickupNumber}
                      </p>
                      <p className="mt-1 text-center text-sm font-semibold text-white/90">
                        {successOrder.holderName}
                      </p>
                      {eventTitle && (
                        <p className="mt-1 text-center text-xs text-white/60">{eventTitle}</p>
                      )}
                      <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                        {successOrder.lines.map((line) => (
                          <li
                            key={`${line.productId}-${line.size}`}
                            className="flex justify-between gap-2 text-xs text-white/80"
                          >
                            <span>
                              {line.productName} · {line.size}
                            </span>
                            <span className="font-semibold tabular-nums">×{line.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-center text-[11px] text-emerald-200/80">
                        Hand items from the shelf and call out the pickup number.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-6 left-4 right-4">
                <button
                  type="button"
                  onClick={closeManual}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-white py-4 font-display text-sm font-bold text-brown transition hover:bg-cream"
                >
                  <MessageSquare size={18} />
                  Hide Manual Entry
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MerchLookupCard({
  order,
  onRedeem,
}: {
  order: MerchOrder
  onRedeem: () => void
}) {
  const eventTitle = getHostEventById(order.eventId)?.title
  const pending = order.status === 'pending_pickup'

  return (
    <div className="rounded-[12px] border border-white/10 bg-[#1a1a1a] p-3">
      <p className="font-mono text-sm font-bold tracking-widest text-white">{order.pickupNumber}</p>
      <p className="mt-1 text-sm font-semibold text-white/90">{order.holderName}</p>
      <p className="text-xs text-white/50">{order.userEmail}</p>
      {eventTitle && <p className="mt-0.5 text-[11px] text-white/40">{eventTitle}</p>}
      <ul className="mt-2 space-y-1 border-t border-white/10 pt-2">
        {order.lines.map((line) => (
          <li
            key={`${line.productId}-${line.size}`}
            className="flex justify-between gap-2 text-xs text-white/70"
          >
            <span>
              {line.productName} · {line.size}
            </span>
            <span className="font-semibold tabular-nums">×{line.quantity}</span>
          </li>
        ))}
      </ul>
      {pending ? (
        <button
          type="button"
          onClick={onRedeem}
          className="mt-3 w-full rounded-[10px] bg-gradient-tudu py-2 font-display text-xs font-bold text-white"
        >
          Mark picked up
        </button>
      ) : (
        <p className="mt-3 text-center text-[11px] font-semibold text-white/40">
          Already picked up
          {order.pickedUpAt ? ` · ${new Date(order.pickedUpAt).toLocaleString()}` : ''}
        </p>
      )}
    </div>
  )
}
