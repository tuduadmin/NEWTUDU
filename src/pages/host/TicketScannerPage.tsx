import { useCallback, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MessageSquare, Package, Search, Ticket, X } from 'lucide-react'
import QrCodeScanner, { resumeQrScanner } from '../../components/host/QrCodeScanner'
import { useHostContext } from '../../hooks/useHostContext'
import { getHostEventById } from '../../lib/account'
import {
  findMerchOrders,
  redeemMerchFromScan,
  redeemMerchOrderById,
  type MerchOrder,
} from '../../lib/eventMerch'
import { parseMerchScanInput } from '../../lib/qrParse'
import { verifyTicketScanForHost, type VerifyTicketScanResult } from '../../lib/ticketCheckIn'

type ScanMode = 'ticket' | 'merch'

type MerchScanResult =
  | { kind: 'success'; order: MerchOrder }
  | { kind: 'lookup'; orders: MerchOrder[] }
  | { kind: 'error'; message: string }

type TicketScanUi =
  | { kind: 'success'; holderName: string; tierName: string; eventTitle: string }
  | { kind: 'warning'; message: string; holderName?: string; tierName?: string }
  | { kind: 'error'; message: string }

function isMerchPickupCode(code: string): boolean {
  return /^MP-/i.test(code) || /^MORD_/i.test(code)
}

export default function TicketScannerPage() {
  const navigate = useNavigate()
  const { user, context } = useHostContext()
  const hostEmail = user?.email ?? ''

  const [searchParams, setSearchParams] = useSearchParams()
  const manual = searchParams.get('manual') === '1'
  const modeParam = searchParams.get('mode')
  const scanMode: ScanMode = modeParam === 'merch' ? 'merch' : 'ticket'

  const [manualCode, setManualCode] = useState('')
  const [merchResult, setMerchResult] = useState<MerchScanResult | null>(null)
  const [ticketResult, setTicketResult] = useState<TicketScanUi | null>(null)
  const [cameraPaused, setCameraPaused] = useState(false)
  const processingRef = useRef(false)

  function openManual() {
    setSearchParams({ manual: '1', mode: scanMode })
    setTicketResult(null)
    setMerchResult(null)
    setCameraPaused(false)
  }

  function closeManual() {
    setSearchParams(scanMode === 'merch' ? { mode: 'merch' } : {})
    setManualCode('')
    setMerchResult(null)
    setTicketResult(null)
    setCameraPaused(false)
    processingRef.current = false
    resumeQrScanner()
  }

  function setScanMode(next: ScanMode) {
    setMerchResult(null)
    setTicketResult(null)
    setManualCode('')
    setCameraPaused(false)
    processingRef.current = false
    if (manual) {
      setSearchParams({ manual: '1', mode: next })
    } else {
      setSearchParams(next === 'merch' ? { mode: 'merch' } : {})
    }
    resumeQrScanner()
  }

  function handleClose() {
    navigate('/host')
  }

  function applyTicketVerifyResult(result: VerifyTicketScanResult) {
    if (result.outcome === 'valid') {
      setTicketResult({
        kind: 'success',
        holderName: result.holderName,
        tierName: result.tierName,
        eventTitle: result.eventTitle,
      })
      return
    }
    if (result.outcome === 'already') {
      setTicketResult({
        kind: 'warning',
        message: `Already scanned · ${new Date(result.scannedAt).toLocaleString()}`,
        holderName: result.holderName,
        tierName: result.tierName,
      })
      return
    }
    if (result.outcome === 'event_link') {
      setTicketResult({ kind: 'error', message: result.message })
      return
    }
    setTicketResult({ kind: 'error', message: result.message })
  }

  function handleTicketVerify(code: string) {
    const result = verifyTicketScanForHost(hostEmail, code, context)
    applyTicketVerifyResult(result)
  }

  function handleMerchVerify() {
    const code = parseMerchScanInput(manualCode)
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

    const result = redeemMerchFromScan(code)
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

  const processScan = useCallback(
    (decodedText: string) => {
      if (processingRef.current) return
      processingRef.current = true
      setCameraPaused(true)

      if (scanMode === 'merch') {
        const code = parseMerchScanInput(decodedText)
        const result = redeemMerchFromScan(decodedText)
        if (result.ok) {
          setMerchResult({ kind: 'success', order: result.order })
        } else {
          const matches = findMerchOrders(code)
          if (matches.length === 1 && matches[0].status === 'pending_pickup') {
            const redeemed = redeemMerchOrderById(matches[0].id)
            if (redeemed.ok) {
              setMerchResult({ kind: 'success', order: redeemed.order })
            } else {
              setMerchResult({ kind: 'error', message: redeemed.error })
            }
          } else if (matches.length > 0) {
            setMerchResult({ kind: 'lookup', orders: matches })
          } else {
            setMerchResult({ kind: 'error', message: result.error })
          }
        }
        return
      }

      handleTicketVerify(decodedText)
    },
    [scanMode, hostEmail, context],
  )

  function scanNext() {
    setTicketResult(null)
    setMerchResult(null)
    setCameraPaused(false)
    processingRef.current = false
    resumeQrScanner()
  }

  const successOrder = merchResult?.kind === 'success' ? merchResult.order : null
  const eventTitle = successOrder ? getHostEventById(successOrder.eventId)?.title : null
  const showCameraOverlay =
    !manual && (ticketResult != null || merchResult?.kind === 'success' || merchResult?.kind === 'error')

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

        <div className={`relative min-h-[320px] flex-1 ${manual ? 'bg-black' : ''}`}>
          {!manual ? (
            <>
              <QrCodeScanner
                active
                paused={cameraPaused}
                onDecode={processScan}
                className="absolute inset-0"
              />

              <p className="pointer-events-none absolute left-4 right-4 top-4 z-10 text-center text-xs text-white/70">
                {scanMode === 'merch'
                  ? 'Scan attendee merch pickup QR — separate from entry tickets'
                  : 'Scan entry ticket QR at the door'}
              </p>

              {showCameraOverlay && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-6">
                  {scanMode === 'ticket' && ticketResult && (
                    <TicketResultCard result={ticketResult} onNext={scanNext} />
                  )}
                  {scanMode === 'merch' && merchResult?.kind === 'success' && successOrder && (
                    <MerchSuccessCard order={successOrder} eventTitle={eventTitle} onNext={scanNext} />
                  )}
                  {scanMode === 'merch' && merchResult?.kind === 'error' && (
                    <div className="w-full max-w-sm rounded-[14px] bg-[#2a2a2a] p-5 text-center">
                      <p className="text-sm font-semibold text-rose-200">{merchResult.message}</p>
                      <button
                        type="button"
                        onClick={scanNext}
                        className="mt-4 w-full rounded-[14px] bg-white py-3 text-sm font-bold text-brown"
                      >
                        Scan next
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="absolute bottom-6 left-4 right-4 z-10">
                <button
                  type="button"
                  onClick={openManual}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/20 bg-white/15 py-4 font-display text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/25"
                >
                  <MessageSquare size={18} />
                  Manual entry
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="absolute left-0 right-0 top-6 z-10 text-center text-xs font-medium text-white/50">
                TUDU Entertainment Inc
              </p>

              <div className="flex h-full flex-col items-center justify-center px-4 pb-24 pt-16">
                <div className="w-full max-w-sm rounded-[14px] bg-[#2a2a2a] p-5">
                  <p className="text-center text-xs text-white/50">
                    {scanMode === 'merch'
                      ? 'Enter pickup number (MP-…), email, name, or paste merch QR payload:'
                      : 'Paste ticket QR JSON, ticket id (tkt_…), or ticket number:'}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => {
                        setManualCode(e.target.value)
                        setMerchResult(null)
                        setTicketResult(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        if (scanMode === 'merch') handleMerchVerify()
                        else handleTicketVerify(manualCode)
                      }}
                      placeholder={scanMode === 'merch' ? 'e.g. MP-A1B2C3' : 'e.g. tkt_… or #A1B2C3D4'}
                      className="min-w-0 flex-1 rounded-[14px] border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange/50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        scanMode === 'merch' ? handleMerchVerify() : handleTicketVerify(manualCode)
                      }
                      className="flex shrink-0 items-center gap-1.5 rounded-[14px] bg-gradient-tudu px-4 py-3 font-display text-sm font-bold text-white"
                    >
                      <Search size={16} />
                      Verify
                    </button>
                  </div>

                  {scanMode === 'ticket' && ticketResult && (
                    <div className="mt-4">
                      <TicketResultCard result={ticketResult} onNext={() => setTicketResult(null)} compact />
                    </div>
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
                    <div className="mt-4">
                      <MerchSuccessCard order={successOrder} eventTitle={eventTitle} compact />
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-6 left-4 right-4 z-10">
                <button
                  type="button"
                  onClick={closeManual}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-white py-4 font-display text-sm font-bold text-brown transition hover:bg-cream"
                >
                  <MessageSquare size={18} />
                  Back to camera
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TicketResultCard({
  result,
  onNext,
  compact = false,
}: {
  result: TicketScanUi
  onNext: () => void
  compact?: boolean
}) {
  if (result.kind === 'success') {
    return (
      <div
        className={`w-full max-w-sm rounded-[14px] border border-emerald-500/35 bg-emerald-500/15 p-5 text-center ${compact ? 'p-4' : ''}`}
      >
        <div className="flex items-center justify-center gap-2 text-emerald-200">
          <CheckCircle2 size={20} aria-hidden />
          <p className="font-display text-sm font-bold">Admitted</p>
        </div>
        <p className="mt-3 text-lg font-bold text-white">{result.holderName}</p>
        <p className="text-sm text-white/80">{result.tierName}</p>
        <p className="mt-1 text-xs text-white/55">{result.eventTitle}</p>
        {!compact && (
          <button
            type="button"
            onClick={onNext}
            className="mt-5 w-full rounded-[14px] bg-white py-3 font-display text-sm font-bold text-emerald-800"
          >
            Scan next
          </button>
        )}
      </div>
    )
  }

  const tone =
    result.kind === 'warning'
      ? 'border-amber-500/35 bg-amber-500/15 text-amber-100'
      : 'border-rose-500/35 bg-rose-500/15 text-rose-100'

  return (
    <div className={`w-full max-w-sm rounded-[14px] border p-5 text-center ${tone} ${compact ? 'p-4' : ''}`}>
      <p className="font-display text-sm font-bold">
        {result.kind === 'warning' ? 'Already used' : 'Not valid'}
      </p>
      <p className="mt-2 text-sm">{result.message}</p>
      {result.kind === 'warning' && result.holderName && (
        <p className="mt-2 text-xs opacity-80">
          {result.holderName}
          {result.tierName ? ` · ${result.tierName}` : ''}
        </p>
      )}
      {!compact && (
        <button
          type="button"
          onClick={onNext}
          className="mt-5 w-full rounded-[14px] bg-white/95 py-3 font-display text-sm font-bold text-brown"
        >
          Scan next
        </button>
      )}
    </div>
  )
}

function MerchSuccessCard({
  order,
  eventTitle,
  onNext,
  compact = false,
}: {
  order: MerchOrder
  eventTitle: string | null | undefined
  onNext?: () => void
  compact?: boolean
}) {
  return (
    <div className="w-full max-w-sm rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="flex items-center justify-center gap-2 text-emerald-300">
        <CheckCircle2 size={18} aria-hidden />
        <p className="font-display text-sm font-bold">Ready for pickup</p>
      </div>
      <p className="mt-2 text-center font-mono text-lg font-bold tracking-widest text-white">
        {order.pickupNumber}
      </p>
      <p className="mt-1 text-center text-sm font-semibold text-white/90">{order.holderName}</p>
      {eventTitle && <p className="mt-1 text-center text-xs text-white/60">{eventTitle}</p>}
      <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
        {order.lines.map((line) => (
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
      {!compact && onNext && (
        <button
          type="button"
          onClick={onNext}
          className="mt-4 w-full rounded-[14px] bg-white py-3 text-sm font-bold text-brown"
        >
          Scan next
        </button>
      )}
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
