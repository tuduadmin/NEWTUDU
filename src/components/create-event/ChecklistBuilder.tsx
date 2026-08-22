import { Plus, Trash2 } from 'lucide-react'
import type { ChecklistItem, ChecklistItemType, ChecklistTemplate, EventChecklist } from '../../lib/account'
import {
  defaultConferenceItems,
  defaultPotluckItems,
  generateChecklistItemId,
} from '../../lib/account'
import { FieldLabel, TextInput } from './CreateEventLayout'
import { appFieldClass } from '../../lib/formFieldClasses'

const CHECKLIST_PANEL = 'rounded-[14px] border border-app-subtle bg-cream-dark'

const CHECKLIST_TILE_IDLE = 'border-brown/15 bg-cream-dark hover:border-orange/30'

type ChecklistBuilderProps = {
  checklist: EventChecklist
  onChange: (checklist: EventChecklist) => void
}

const TEMPLATE_OPTIONS: { id: ChecklistTemplate; label: string; description: string }[] = [
  {
    id: 'potluck',
    label: 'Potluck / Item signup',
    description: 'Attendees pick one item to bring (or skip).',
  },
  {
    id: 'conference',
    label: 'Conference / Meal planning',
    description: 'Attendees check meals and optional note fields.',
  },
  {
    id: 'custom',
    label: 'Custom checklist',
    description: 'Build your own items and rules.',
  },
]

const ITEM_TYPE_OPTIONS: { id: ChecklistItemType; label: string }[] = [
  { id: 'single_pick', label: 'Pick one' },
  { id: 'multi_check', label: 'Check many' },
  { id: 'text_note', label: 'Text note' },
]

function defaultItemForTemplate(template: ChecklistTemplate): ChecklistItem {
  if (template === 'conference') {
    return { id: generateChecklistItemId(), label: '', type: 'multi_check', allowNote: false }
  }
  return {
    id: generateChecklistItemId(),
    label: '',
    type: 'single_pick',
    maxClaims: 1,
    allowNote: false,
  }
}

function isSignupItem(checklist: EventChecklist, item: ChecklistItem): boolean {
  if (item.type === 'text_note') return false
  if (checklist.template === 'potluck') return item.type === 'single_pick'
  if (checklist.template === 'conference') return item.type === 'multi_check'
  return checklist.template === 'custom' && item.type === 'single_pick'
}

function isTextNoteItem(item: ChecklistItem): boolean {
  return item.type === 'text_note'
}

export default function ChecklistBuilder({ checklist, onChange }: ChecklistBuilderProps) {
  function setTemplate(template: ChecklistTemplate) {
    if (template === 'potluck') {
      onChange({
        ...checklist,
        template,
        items: defaultPotluckItems(),
      })
      return
    }
    if (template === 'conference') {
      onChange({
        ...checklist,
        template,
        items: [
          ...defaultConferenceItems(),
          {
            id: generateChecklistItemId(),
            label: 'Dietary restrictions',
            type: 'text_note',
          },
        ],
      })
      return
    }
    onChange({
      ...checklist,
      template,
      items: checklist.items.length
        ? checklist.items
        : [defaultItemForTemplate('custom')],
    })
  }

  function updateItem(itemId: string, partial: Partial<ChecklistItem>) {
    onChange({
      ...checklist,
      items: checklist.items.map((item) => (item.id === itemId ? { ...item, ...partial } : item)),
    })
  }

  function addItem() {
    if (!checklist.template) return
    onChange({
      ...checklist,
      items: [...checklist.items, defaultItemForTemplate(checklist.template)],
    })
  }

  function addNoteField() {
    onChange({
      ...checklist,
      items: [
        ...checklist.items,
        { id: generateChecklistItemId(), label: 'Dietary restrictions', type: 'text_note' },
      ],
    })
  }

  function removeItem(itemId: string) {
    onChange({
      ...checklist,
      items: checklist.items.filter((item) => item.id !== itemId),
    })
  }

  function setMandatory(checked: boolean) {
    onChange({
      ...checklist,
      mandatory: checked,
      allowSkip: checked ? false : checklist.allowSkip,
    })
  }

  function setAllowSkip(checked: boolean) {
    onChange({
      ...checklist,
      allowSkip: checked,
      mandatory: checked ? false : checklist.mandatory,
    })
  }

  const canRemoveItem = checklist.items.length > 1
  const unselectedTileClass = CHECKLIST_TILE_IDLE
  const selectedTileClass = 'border-orange bg-orange/10'

  return (
    <div className="space-y-4">
      <label
        className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[14px] border-2 px-3 py-2.5 transition ${
          checklist.enabled ? selectedTileClass : unselectedTileClass
        }`}
      >
        <input
          type="checkbox"
          checked={checklist.enabled}
          onChange={(e) => onChange({ ...checklist, enabled: e.target.checked })}
          className="mt-1 accent-orange"
        />
        <span>
          <span className={`block text-sm font-bold ${checklist.enabled ? 'text-orange' : 'text-brown'}`}>
            Enable attendee checklist
          </span>
          <span className="block text-[10px] text-brown-muted">
            Collect potluck signups, meals, or custom prep from guests.
          </span>
        </span>
      </label>

      {checklist.enabled && (
        <>
          <div>
            <FieldLabel>Template</FieldLabel>
            <div className="mt-2 space-y-2">
              {TEMPLATE_OPTIONS.map((opt) => {
                const selected = checklist.template === opt.id
                return (
                  <label
                    key={opt.id}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[14px] border-2 px-3 py-2.5 transition ${
                      selected ? selectedTileClass : unselectedTileClass
                    }`}
                  >
                    <input
                      type="radio"
                      name="checklist-template"
                      checked={selected}
                      onChange={() => setTemplate(opt.id)}
                      className="mt-1 accent-orange"
                    />
                    <span>
                      <span className={`block text-sm font-bold ${selected ? 'text-orange' : 'text-brown'}`}>
                        {opt.label}
                      </span>
                      <span className="block text-[10px] text-brown-muted">{opt.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {checklist.template !== null && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel>Checklist items</FieldLabel>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1 text-xs font-bold text-orange"
                    >
                      <Plus size={14} />
                      {checklist.template === 'conference' ? 'Add meal' : 'Add item'}
                    </button>
                    {(checklist.template === 'conference' || checklist.template === 'custom') && (
                      <button
                        type="button"
                        onClick={addNoteField}
                        className="flex items-center gap-1 text-xs font-bold text-orange"
                      >
                        <Plus size={14} />
                        Add note field
                      </button>
                    )}
                  </div>
                </div>

                {checklist.items.map((item) => (
                  <div key={item.id} className={`${CHECKLIST_PANEL} p-3`}>
                    {isTextNoteItem(item) ? (
                      <TextNoteItemRow
                        item={item}
                        onUpdate={(partial) => updateItem(item.id, partial)}
                        onRemove={canRemoveItem ? () => removeItem(item.id) : undefined}
                      />
                    ) : isSignupItem(checklist, item) ? (
                      <SignupItemRow
                        item={item}
                        placeholder={checklist.template === 'conference' ? 'Meal slot' : 'Item name'}
                        onUpdate={(partial) => updateItem(item.id, partial)}
                        onRemove={canRemoveItem ? () => removeItem(item.id) : undefined}
                        showTypeSelect={checklist.template === 'custom'}
                        onTypeChange={(type) => updateItem(item.id, { type })}
                        showMaxClaims={checklist.template !== 'conference'}
                      />
                    ) : (
                      <div className="flex gap-2">
                        <TextInput
                          value={item.label}
                          onChange={(label) => updateItem(item.id, { label })}
                          placeholder={checklist.template === 'conference' ? 'Meal slot' : 'Item name'}
                        />
                        {checklist.template === 'custom' && (
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateItem(item.id, { type: e.target.value as ChecklistItemType })
                            }
                            className={`${appFieldClass} px-2 text-xs`}
                          >
                            {ITEM_TYPE_OPTIONS.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {canRemoveItem && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-brown-muted"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {checklist.template === 'conference' && (
                  <p className="text-[10px] text-brown-muted">
                    Use note fields for dietary restrictions, or enable &ldquo;Allow guest note&rdquo; on
                    individual meals.
                  </p>
                )}
              </div>

              <label
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[14px] border-2 px-3 py-2.5 transition ${
                  checklist.mandatory ? selectedTileClass : unselectedTileClass
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist.mandatory}
                  onChange={(e) => setMandatory(e.target.checked)}
                  className="mt-1 accent-orange"
                />
                <span>
                  <span className={`block text-sm font-bold ${checklist.mandatory ? 'text-orange' : 'text-brown'}`}>
                    Mandatory before RSVP/purchase
                  </span>
                  <span className="block text-[10px] text-brown-muted">
                    Guests must complete the checklist to continue.
                  </span>
                </span>
              </label>

              <label
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-[14px] border-2 px-3 py-2.5 transition ${
                  checklist.allowSkip ? selectedTileClass : unselectedTileClass
                }`}
              >
                <input
                  type="checkbox"
                  checked={checklist.allowSkip}
                  onChange={(e) => setAllowSkip(e.target.checked)}
                  className="mt-1 accent-orange"
                />
                <span>
                  <span className={`block text-sm font-bold ${checklist.allowSkip ? 'text-orange' : 'text-brown'}`}>
                    Allow skip
                  </span>
                  <span className="block text-[10px] text-brown-muted">
                    Guests may skip the checklist entirely.
                  </span>
                </span>
              </label>
            </>
          )}
        </>
      )}
    </div>
  )
}

function TextNoteItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: ChecklistItem
  onUpdate: (partial: Partial<ChecklistItem>) => void
  onRemove?: () => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <TextInput
          value={item.label}
          onChange={(label) => onUpdate({ label })}
          placeholder="Note field label (e.g. Dietary restrictions)"
        />
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-brown-muted">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p className="text-[10px] text-brown-muted">Guests see a text area for this field.</p>
    </div>
  )
}

function SignupItemRow({
  item,
  placeholder,
  onUpdate,
  onRemove,
  showTypeSelect,
  onTypeChange,
  showMaxClaims = true,
}: {
  item: ChecklistItem
  placeholder: string
  onUpdate: (partial: Partial<ChecklistItem>) => void
  onRemove?: () => void
  showTypeSelect?: boolean
  onTypeChange?: (type: ChecklistItemType) => void
  showMaxClaims?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <TextInput
          value={item.label}
          onChange={(label) => onUpdate({ label })}
          placeholder={placeholder}
        />
        {showTypeSelect && onTypeChange && (
          <select
            value={item.type}
            onChange={(e) => onTypeChange(e.target.value as ChecklistItemType)}
            className={`${appFieldClass} px-2 text-xs`}
          >
            {ITEM_TYPE_OPTIONS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-brown-muted">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {showMaxClaims && (
          <label className="flex items-center gap-2 text-xs text-brown">
            <span className="font-semibold text-brown-muted">Max</span>
            <input
              type="number"
              min={1}
              max={99}
              value={item.maxClaims ?? 1}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10)
                onUpdate({ maxClaims: Number.isFinite(parsed) && parsed >= 1 ? parsed : 1 })
              }}
              className={`${appFieldClass} w-14 px-2 py-1 text-sm`}
            />
          </label>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-xs text-brown">
          <input
            type="checkbox"
            checked={item.allowNote ?? false}
            onChange={(e) => onUpdate({ allowNote: e.target.checked })}
            className="accent-orange"
          />
          <span className="font-semibold">Allow guest note</span>
        </label>
      </div>
    </div>
  )
}
