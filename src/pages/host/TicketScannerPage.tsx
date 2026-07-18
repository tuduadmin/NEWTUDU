import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageSquare, Search, X } from 'lucide-react'

export default function TicketScannerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const manual = searchParams.get('manual') === '1'

  function openManual() {
    setSearchParams({ manual: '1' })
  }

  function closeManual() {
    setSearchParams({})
  }

  function handleClose() {
    navigate('/host')
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-black/40">
      <div className="mx-auto mt-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-cream shadow-float">
        {/* Handle bar */}
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-brown/20" aria-hidden />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <h1 className="font-display text-xl font-extrabold text-gradient">Ticket Scanner</h1>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close scanner"
            className="flex h-10 w-10 items-center justify-center rounded-full text-brown-muted transition hover:bg-brown/5"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scanner / Manual body */}
        <div className={`relative flex-1 ${manual ? 'bg-black' : 'bg-[#1a1a1a]'}`}>
          {!manual ? (
            <>
              {/* Camera viewfinder */}
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

              {/* Watermark */}
              <p className="absolute left-0 right-0 top-6 text-center text-xs font-medium text-white/60">
                TUDU Entertainment Inc
              </p>

              {/* Corner brackets */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative h-64 w-full max-w-xs">
                  <span className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-white" />
                  <span className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-white" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-white" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-white" />

                  {/* Scan line */}
                  <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-orange via-purple to-orange opacity-90 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                </div>
              </div>

              {/* Manual Entry button */}
              <div className="absolute bottom-6 left-4 right-4">
                <button
                  type="button"
                  onClick={openManual}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-white/20 bg-white/15 py-4 font-display text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/25"
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
                <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-[#2a2a2a] p-5">
                  <p className="text-center text-xs text-white/50">
                    Attendee has no QR code? Enter reference below:
                  </p>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. TDU-XXXX"
                      className="min-w-0 flex-1 rounded-[var(--radius-lg)] border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange/50"
                    />
                    <button
                      type="button"
                      className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-lg)] bg-gradient-tudu px-4 py-3 font-display text-sm font-bold text-white"
                    >
                      <Search size={16} />
                      Verify
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-4 right-4">
                <button
                  type="button"
                  onClick={closeManual}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-xl)] bg-white py-4 font-display text-sm font-bold text-brown transition hover:bg-cream"
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
