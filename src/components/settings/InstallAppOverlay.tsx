import { Share2 } from 'lucide-react'
import { X } from 'lucide-react'
import TuduLogo from '../TuduLogo'
import { isIosSafari } from '../../lib/pwaInstall'

type InstallAppOverlayProps = {
  open: boolean
  onClose: () => void
}

/** iOS Safari only — Chrome/Android use native `beforeinstallprompt` from the hook. */
export default function InstallAppOverlay({ open, onClose }: InstallAppOverlayProps) {
  const ios = isIosSafari()

  if (!open || !ios) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brown/30 backdrop-blur-sm">
      <div
        className="install-app-sheet app-column-fixed w-full max-w-lg rounded-t-[2rem] bg-white px-6 pb-8 pt-5 shadow-2xl"
        role="dialog"
        aria-labelledby="install-title"
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-brown-muted transition hover:bg-cream"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <TuduLogo size="lg" />
          <h2 id="install-title" className="mt-4 font-display text-xl font-extrabold text-maroon">
            Add TUDU to your home screen
          </h2>
          <p className="mt-2 text-sm text-brown-muted">
            Install works like an app — quick access from your phone.
          </p>

          <ol className="mt-6 w-full space-y-3 text-left">
            <li className="install-step-row flex items-center gap-3 rounded-[14px] border border-brown/10 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-xs font-bold text-white">
                1
              </span>
              <span className="flex items-center gap-2 text-sm text-brown">
                Tap <Share2 size={16} className="text-electric-blue" aria-hidden />{' '}
                <strong className="font-bold">Share</strong> in Safari&apos;s toolbar
              </span>
            </li>
            <li className="install-step-row flex items-center gap-3 rounded-[14px] border border-brown/10 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">
                2
              </span>
              <span className="text-sm text-brown">
                Scroll and tap <strong className="font-bold">Add to Home Screen</strong>
              </span>
            </li>
            <li className="install-step-row flex items-center gap-3 rounded-[14px] border border-brown/10 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple text-xs font-bold text-white">
                3
              </span>
              <span className="text-sm text-brown">
                Tap <strong className="font-bold">Add</strong> — the TUDU icon appears on your home screen
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
