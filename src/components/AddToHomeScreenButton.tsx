import { Smartphone } from 'lucide-react'

type AddToHomeScreenButtonProps = {
  onClick: () => void
  className?: string
  busy?: boolean
}

export default function AddToHomeScreenButton({
  onClick,
  className = '',
  busy = false,
}: AddToHomeScreenButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`auth-oauth-button flex w-full items-center justify-center gap-2 rounded-[14px] border border-brown/15 bg-white py-3.5 text-sm font-bold text-brown shadow-sm transition hover:border-orange/30 hover:bg-cream active:scale-[0.98] disabled:opacity-70 ${className}`}
    >
      <Smartphone size={18} className="text-orange" aria-hidden />
      {busy ? 'One moment…' : 'Add to Homescreen'}
    </button>
  )
}
