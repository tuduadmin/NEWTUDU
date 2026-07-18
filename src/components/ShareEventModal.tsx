import { useState } from 'react'
import { Copy, MessageCircle, Share2, X } from 'lucide-react'
import GradientButton from './GradientButton'
import { getPrivateShareUrl, type HostEvent } from '../lib/account'

type ShareEventModalProps = {
  open: boolean
  event: HostEvent | null
  onClose: () => void
}

export default function ShareEventModal({ open, event, onClose }: ShareEventModalProps) {
  const [copied, setCopied] = useState(false)

  if (!open || !event) return null

  const shareUrl = getPrivateShareUrl(event)
  const shareText = `You're invited to ${event.title}! Join on TUDU:`

  async function handleWebShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event!.title,
          text: shareText,
          url: shareUrl,
        })
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopyLink()
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-lg rounded-[var(--radius-xl)] bg-white p-5 shadow-xl"
        role="dialog"
        aria-labelledby="share-event-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="share-event-title" className="font-display text-lg font-bold text-brown">
              Share with friends
            </h2>
            <p className="mt-0.5 text-xs text-brown-muted">
              {event.title} · invite-only — won&apos;t appear in TUDU discover
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-brown/10 text-brown-muted"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ShareButton
            icon={<Share2 size={18} />}
            label="Share"
            onClick={handleWebShare}
            primary
          />
          <ShareButton
            icon={<Copy size={18} />}
            label={copied ? 'Copied!' : 'Copy Link'}
            onClick={handleCopyLink}
          />
          <ShareButton
            icon={<MessageCircle size={18} />}
            label="Message"
            onClick={handleWebShare}
          />
          <ShareButton
            icon={<SocialIcon />}
            label="Instagram"
            onClick={handleWebShare}
          />
        </div>

        <p className="mt-3 break-all rounded-[var(--radius-lg)] border border-brown/10 bg-cream/40 px-3 py-2 text-[11px] text-brown-muted">
          {shareUrl}
        </p>

        <GradientButton fullWidth className="mt-4" onClick={onClose}>
          Done
        </GradientButton>
      </div>
    </div>
  )
}

function ShareButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border-2 px-3 py-4 transition ${
        primary
          ? 'border-orange bg-orange/10 text-orange'
          : 'border-brown/10 bg-white text-brown hover:border-orange/30'
      }`}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}

function SocialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}
