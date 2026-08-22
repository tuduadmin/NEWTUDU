import { Plus, Trash2 } from 'lucide-react'
import { appFieldClass } from '../lib/formFieldClasses'
import {
  generateHiddenGemReviewLinkId,
  HIDDEN_GEM_REVIEW_LINK_PRESETS,
  MAX_HIDDEN_GEM_REVIEW_LINKS,
  type HiddenGemReviewLink,
  type HiddenGemReviewLinkPreset,
} from '../lib/hiddenGems'

type HiddenGemReviewLinksEditorProps = {
  value: HiddenGemReviewLink[]
  onChange: (links: HiddenGemReviewLink[]) => void
  variant?: 'light' | 'dark'
}

function emptyReviewLink(preset: HiddenGemReviewLinkPreset = 'google'): HiddenGemReviewLink {
  return { id: generateHiddenGemReviewLinkId(), preset, url: '' }
}

export default function HiddenGemReviewLinksEditor({
  value,
  onChange,
  variant = 'light',
}: HiddenGemReviewLinksEditorProps) {
  const inputClass = variant === 'dark' ? 'admin-input' : appFieldClass
  const labelClass =
    variant === 'dark'
      ? 'admin-label mb-1 block'
      : 'mb-1 block text-sm font-medium text-brown'
  const helperClass =
    variant === 'dark' ? 'text-xs text-[var(--admin-text-muted)]' : 'text-xs text-brown-muted'
  const rowClass =
    variant === 'dark'
      ? 'space-y-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-3'
      : 'space-y-3 rounded-[14px] border border-brown/10 bg-cream/30 p-3'

  function updateRow(index: number, patch: Partial<HiddenGemReviewLink>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addRow() {
    if (value.length >= MAX_HIDDEN_GEM_REVIEW_LINKS) return
    onChange([...value, emptyReviewLink()])
  }

  return (
    <div className="space-y-3">
      <div>
        <p className={labelClass}>Review links</p>
        <p className={helperClass}>
          Optional — link to Google, Restaurant Guru, or other review pages (up to {MAX_HIDDEN_GEM_REVIEW_LINKS}).
        </p>
      </div>

      {value.map((row, index) => (
        <div key={row.id} className={rowClass}>
          <div className="flex items-center justify-between gap-2">
            <span className={helperClass}>Link {index + 1}</span>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brown-muted transition hover:text-error"
            >
              <Trash2 size={14} aria-hidden />
              Remove
            </button>
          </div>

          <label className={`${helperClass} mb-1 block`}>Site</label>
          <select
            value={row.preset}
            onChange={(e) =>
              updateRow(index, { preset: e.target.value as HiddenGemReviewLinkPreset })
            }
            className={inputClass}
          >
            {HIDDEN_GEM_REVIEW_LINK_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>

          {row.preset === 'other' && (
            <>
              <label className={`${helperClass} mb-1 mt-3 block`}>Label</label>
              <input
                type="text"
                value={row.label ?? ''}
                onChange={(e) => updateRow(index, { label: e.target.value })}
                placeholder="e.g. OpenTable reviews"
                className={inputClass}
              />
            </>
          )}

          <label className={`${helperClass} mb-1 mt-3 block`}>URL</label>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            value={row.url}
            onChange={(e) => updateRow(index, { url: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      ))}

      {value.length < MAX_HIDDEN_GEM_REVIEW_LINKS && (
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-[14px] border border-brown/15 bg-white px-3 py-2 text-xs font-semibold text-brown-muted transition hover:border-purple/25 hover:text-brown"
        >
          <Plus size={14} aria-hidden />
          Add review link
        </button>
      )}
    </div>
  )
}
