import { appFieldClass } from '../lib/formFieldClasses'
import { Plus, Trash2 } from 'lucide-react'
import PhoneInput from './PhoneInput'
import {
  generateHiddenGemContactId,
  HIDDEN_GEM_CONTACT_PRESETS,
  type HiddenGemContact,
} from '../lib/hiddenGems'

const MAX_CONTACTS = 4

type HiddenGemContactsEditorProps = {
  value: HiddenGemContact[]
  onChange: (contacts: HiddenGemContact[]) => void
  variant?: 'light' | 'dark'
}

function emptyContact(): HiddenGemContact {
  return { id: generateHiddenGemContactId(), label: 'General' }
}

export default function HiddenGemContactsEditor({
  value,
  onChange,
  variant = 'light',
}: HiddenGemContactsEditorProps) {
  const inputClass = variant === 'dark' ? 'admin-input' : appFieldClass

  const labelClass =
    variant === 'dark'
      ? 'admin-label mb-1 block'
      : 'mb-1 block text-sm font-medium text-brown'

  const rows = value.length > 0 ? value : [emptyContact()]

  function updateRow(index: number, patch: Partial<HiddenGemContact>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange(next)
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [emptyContact()])
  }

  function addRow() {
    if (rows.length >= MAX_CONTACTS) return
    onChange([...rows, emptyContact()])
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>Contact spots</p>
        <p
          className={
            variant === 'dark'
              ? 'text-xs text-[var(--admin-text-muted)]'
              : 'text-xs text-brown-muted'
          }
        >
          Label each line â€” front desk, ordering, take out, etc. At least one contact recommended.
        </p>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.id}
          className={
            variant === 'dark'
              ? 'space-y-3 rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-3'
              : 'space-y-3 rounded-[14px] border border-brown/10 bg-cream/30 p-3'
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={
                variant === 'dark'
                  ? 'text-xs font-semibold text-[var(--admin-text-muted)]'
                  : 'text-xs font-semibold text-brown-muted'
              }
            >
              Contact {index + 1}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className={
                  variant === 'dark'
                    ? 'inline-flex items-center gap-1 text-xs text-[var(--admin-danger)]'
                    : 'inline-flex items-center gap-1 text-xs text-error'
                }
                aria-label={`Remove contact ${index + 1}`}
              >
                <Trash2 size={14} />
                Remove
              </button>
            )}
          </div>

          <div>
            <label htmlFor={`hg-contact-label-${row.id}`} className={labelClass}>
              Label
            </label>
            <input
              id={`hg-contact-label-${row.id}`}
              list={`hg-contact-presets-${row.id}`}
              value={row.label}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              placeholder="Front desk"
              className={inputClass}
            />
            <datalist id={`hg-contact-presets-${row.id}`}>
              {HIDDEN_GEM_CONTACT_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor={`hg-contact-phone-${row.id}`} className={labelClass}>
              Phone
            </label>
            <PhoneInput
              id={`hg-contact-phone-${row.id}`}
              value={row.phone ?? ''}
              onChange={(phone) => updateRow(index, { phone: phone || undefined })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`hg-contact-note-${row.id}`} className={labelClass}>
              Note <span className="font-normal text-brown-muted">(optional)</span>
            </label>
            <input
              id={`hg-contact-note-${row.id}`}
              value={row.note ?? ''}
              onChange={(e) => updateRow(index, { note: e.target.value || undefined })}
              placeholder="Text for takeout orders"
              className={inputClass}
            />
          </div>
        </div>
      ))}

      {rows.length < MAX_CONTACTS && (
        <button
          type="button"
          onClick={addRow}
          className={
            variant === 'dark'
              ? 'inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--admin-accent)]'
              : 'inline-flex items-center gap-1.5 text-xs font-semibold text-purple'
          }
        >
          <Plus size={14} />
          Add contact
        </button>
      )}
    </div>
  )
}
