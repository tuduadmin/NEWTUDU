import { useState } from 'react'
import { Copy, Mail, MessageSquare, Share2, X } from 'lucide-react'
import type { DiscoverEvent } from '../data/discoverEvents'
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildSmsShareUrl,
  buildTwitterShareUrl,
  buildWhatsAppShareUrl,
  canUseWebShare,
  copyDiscoverEventShareLink,
  getDiscoverEventShareText,
  getDiscoverEventShareUrl,
  isSecureShareContext,
  tryNativeDiscoverEventShare,
} from '../lib/eventDetailActions'
import { FacebookIcon, TwitterIcon } from './host/hostSocialIcons'

type ShareEventSheetProps = {
  event: DiscoverEvent
  onClose: () => void
}

type ShareTarget = {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  brandClass?: string
}

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function ShareEventSheet({ event, onClose }: ShareEventSheetProps) {
  const [copied, setCopied] = useState(false)

  const url = getDiscoverEventShareUrl(event)
  const text = getDiscoverEventShareText(event)

  const targets: ShareTarget[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      href: buildWhatsAppShareUrl(text, url),
      brandClass: 'bg-[#25D366]/10 text-[#128C7E] border-[#25D366]/25',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon size={22} />,
      href: buildFacebookShareUrl(url),
      brandClass: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/25',
    },
    {
      id: 'twitter',
      label: 'X',
      icon: <TwitterIcon size={22} />,
      href: buildTwitterShareUrl(text, url),
      brandClass: 'bg-brown/5 text-brown border-brown/15',
    },
    {
      id: 'sms',
      label: 'SMS',
      icon: <MessageSquare size={22} strokeWidth={2} />,
      href: buildSmsShareUrl(text, url),
      brandClass: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/25',
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail size={22} strokeWidth={2} />,
      href: buildEmailShareUrl(event.title, text, url),
      brandClass: 'bg-orange/10 text-orange border-orange/25',
    },
  ]

  async function handleCopyLink() {
    const ok = await copyDiscoverEventShareLink(event)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleNativeShare() {
    const result = await tryNativeDiscoverEventShare(event)
    if (result === 'shared') onClose()
  }

  return (
    <>
      <button
        type="button"
        className="app-column-fixed fixed top-[calc(var(--app-header-h)+env(safe-area-inset-top))] bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[var(--z-modal)] bg-black/60 backdrop-blur-sm"
        aria-label="Close share sheet"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-event-sheet-title"
        className="app-column-fixed animate-slide-up-panel fixed bottom-[calc(var(--app-bottom-nav-h)+env(safe-area-inset-bottom))] z-[calc(var(--z-modal)+1)] flex max-h-[85svh] flex-col overflow-hidden rounded-t-[var(--radius-2xl)] bg-cream shadow-float"
      >
        <div className="shrink-0 border-b border-brown/10 px-5 pb-3 pt-4">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-brown/15" aria-hidden />
          <div className="flex items-center justify-between gap-3">
            <h2
              id="share-event-sheet-title"
              className="font-display text-lg font-extrabold text-brown"
            >
              Share Event
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-dark text-brown-muted transition hover:text-brown"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="rounded-[14px] border border-brown/10 bg-white px-4 py-3 shadow-sm">
            <p className="font-display text-base font-bold leading-snug text-brown">{event.title}</p>
            <p className="mt-1 text-sm text-brown-muted">{text}</p>
          </div>

          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border-2 border-brown/10 bg-white px-4 py-3.5 text-sm font-bold text-brown transition hover:border-orange/30 active:scale-[0.99]"
          >
            <Copy size={18} className="text-orange" aria-hidden />
            {copied ? 'Link copied!' : 'Copy link'}
          </button>

          {!isSecureShareContext() && (
            <p className="mt-3 rounded-[14px] border border-orange/20 bg-orange/5 px-3 py-2.5 text-center text-xs leading-relaxed text-brown-muted">
              Native share (Quick Share, WhatsApp, contacts) requires HTTPS. On your dev machine run{' '}
              <code className="font-mono text-[11px] text-brown">npm run dev:https</code> and open the{' '}
              <code className="font-mono text-[11px] text-brown">https://</code> URL on your phone.
            </p>
          )}

          <p className="mt-5 text-center text-[11px] font-bold uppercase tracking-wide text-brown-muted">
            Share via
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {targets.map((target) => (
              <a
                key={target.id}
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1.5 rounded-[14px] border px-1 py-3 transition hover:scale-[1.02] active:scale-[0.98] ${target.brandClass ?? 'border-brown/10 bg-white text-brown'}`}
              >
                {target.icon}
                <span className="text-[10px] font-semibold leading-tight">{target.label}</span>
              </a>
            ))}
          </div>

          {canUseWebShare() && (
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-brown/10 bg-cream-dark/60 px-4 py-3 text-sm font-semibold text-brown-muted transition hover:text-brown"
            >
              <Share2 size={16} aria-hidden />
              {isSecureShareContext() ? 'System shareâ€¦' : 'Requires HTTPS â€” use dev:https'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
