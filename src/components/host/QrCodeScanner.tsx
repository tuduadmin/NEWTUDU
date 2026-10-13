import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

type QrCodeScannerProps = {
  active: boolean
  paused?: boolean
  onDecode: (text: string) => void
  className?: string
}

type ScannerPhase = 'warmup' | 'scanning' | 'error'

export default function QrCodeScanner({
  active,
  paused = false,
  onDecode,
  className = '',
}: QrCodeScannerProps) {
  const regionId = useId().replace(/:/g, '')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(true)
  const onDecodeRef = useRef(onDecode)
  onDecodeRef.current = onDecode

  const [phase, setPhase] = useState<ScannerPhase>('warmup')
  const [errorMessage, setErrorMessage] = useState('')

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) return
    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
    } catch {
      // ignore stop errors during teardown
    }
    try {
      scanner.clear()
    } catch {
      // ignore
    }
  }, [])

  const startScanner = useCallback(async () => {
    await stopScanner()
    if (!mountedRef.current || !active || paused) return

    setPhase('scanning')
    setErrorMessage('')

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not available in this browser.')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      stream.getTracks().forEach((t) => t.stop())
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : ''
      if (!mountedRef.current) return
      setPhase('error')
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Allow camera in browser settings or use manual entry.')
      } else if (name === 'NotFoundError') {
        setErrorMessage('No camera found on this device. Use manual entry.')
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Could not access camera.')
      }
      return
    }

    const scanner = new Html5Qrcode(regionId)
    scannerRef.current = scanner

    const config = { fps: 10, qrbox: { width: 240, height: 240 } }

    const onSuccess = (decodedText: string) => {
      if (paused) return
      if ('vibrate' in navigator) navigator.vibrate(200)
      scanner.pause(true)
      onDecodeRef.current(decodedText)
    }

    try {
      await scanner.start({ facingMode: 'environment' }, config, onSuccess, undefined)
    } catch {
      try {
        const cameras = await Html5Qrcode.getCameras()
        if (cameras.length === 0) throw new Error('No cameras found.')
        await scanner.start(cameras[cameras.length - 1].id, config, onSuccess, undefined)
      } catch (fallbackErr: unknown) {
        if (!mountedRef.current) return
        setPhase('error')
        setErrorMessage(
          fallbackErr instanceof Error ? fallbackErr.message : 'Could not start camera.',
        )
        await stopScanner()
      }
    }
  }, [active, paused, regionId, stopScanner])

  useEffect(() => {
    mountedRef.current = true
    if (!active) {
      setPhase('warmup')
      void stopScanner()
      return () => {
        mountedRef.current = false
        void stopScanner()
      }
    }

    if (phase === 'scanning' && !paused) {
      // started via button
    }

    return () => {
      mountedRef.current = false
      void stopScanner()
    }
  }, [active, stopScanner])

  useEffect(() => {
    if (!active || phase !== 'scanning') return
    if (paused) {
      scannerRef.current?.pause(true)
    } else {
      scannerRef.current?.resume()
    }
  }, [active, paused, phase])

  const resumeAfterResult = useCallback(() => {
    setPhase('scanning')
    void startScanner()
  }, [startScanner])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as Window & { __tuduResumeQr?: () => void }
    win.__tuduResumeQr = resumeAfterResult
    return () => {
      delete win.__tuduResumeQr
    }
  }, [resumeAfterResult])

  if (!active) return null

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#0a0a0a] ${className}`}>
      {phase !== 'warmup' && (
        <div
          id={regionId}
          className="qr-scanner-region absolute inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:object-cover"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />

      {phase === 'warmup' && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="pointer-events-auto w-full max-w-sm rounded-[14px] bg-[#2a2a2a]/95 p-6 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange/15">
              <Camera className="text-orange" size={32} aria-hidden />
            </div>
            <h2 className="font-display text-lg font-extrabold text-white">Enable camera</h2>
            <p className="mt-2 text-sm text-white/65">
              Allow camera access when prompted so we can read ticket and pickup QR codes.
            </p>
            <button
              type="button"
              onClick={() => void startScanner()}
              className="mt-5 w-full rounded-[14px] bg-gradient-tudu py-3.5 font-display text-sm font-bold text-white"
            >
              Open camera
            </button>
          </div>
        </div>
      )}

      {phase === 'scanning' && !paused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-10">
          <div className="relative aspect-square w-full max-w-[260px]">
            <span className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-white" />
            <span className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-white" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-white" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-white" />
            <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-orange via-purple to-orange opacity-90 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="pointer-events-auto w-full max-w-sm rounded-[14px] bg-[#2a2a2a]/95 p-6 text-center">
            <p className="font-display text-sm font-bold text-amber-200">Camera unavailable</p>
            <p className="mt-2 text-sm text-white/70">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void startScanner()}
              className="mt-4 w-full rounded-[14px] border border-white/20 py-3 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function resumeQrScanner(): void {
  const win = window as Window & { __tuduResumeQr?: () => void }
  win.__tuduResumeQr?.()
}
