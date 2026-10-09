import { MERCH_FEE_MODE_OPTIONS, type MerchFeeMode } from '../../lib/merchFeeMode'

type MerchFeeModePickerProps = {
  value: MerchFeeMode
  onChange: (mode: MerchFeeMode) => void
  disabled?: boolean
}

export default function MerchFeeModePicker({ value, onChange, disabled = false }: MerchFeeModePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Buyer pricing</p>
      <div className="flex flex-col gap-2">
        {MERCH_FEE_MODE_OPTIONS.map((opt) => {
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`rounded-[12px] border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'border-success-deep bg-success/10 text-brown'
                  : 'border-app-subtle bg-cream-dark text-brown-muted hover:border-orange/30'
              }`}
            >
              <span className="block text-sm font-bold text-brown">{opt.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-brown-muted">{opt.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
