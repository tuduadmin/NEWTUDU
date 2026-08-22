import { useMemo, useState } from 'react'
import type { EventChecklist, HostEvent } from '../lib/account'
import {
  claimChecklistItem,
  formatClaimantName,
  getAvailablePotluckItems,
  getItemClaimCount,
  getMaxClaimsForItem,
  getWhosBringingWhat,
  normalizeChecklist,
  validateChecklistResponse,
} from '../lib/checklist'
import GradientButton from './GradientButton'
import { BackButton, SkipButton } from './NavActionButtons'

type AttendeeChecklistFormProps = {
  event: HostEvent
  attendeeEmail: string
  attendeeName: string
  onComplete: (data: {
    selectedItemIds: string[]
    dietaryNote: string
    skipped: boolean
  }) => void
  onCancel?: () => void
}

export default function AttendeeChecklistForm({
  event,
  attendeeEmail,
  attendeeName,
  onComplete,
  onCancel,
}: AttendeeChecklistFormProps) {
  const checklistConfig = event.checklist
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [textNotes, setTextNotes] = useState<Record<string, string>>({})
  const [claimNotes, setClaimNotes] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const checklist: EventChecklist | null = useMemo(() => {
    if (!checklistConfig) return null
    return normalizeChecklist(checklistConfig)
  }, [checklistConfig])

  const availablePotluckItems = useMemo(() => {
    if (!checklist) return []
    return getAvailablePotluckItems(event.id, checklist.items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist, event.id, skipped, refreshKey])

  if (!checklist || !checklist.enabled) {
    return null
  }

  const activeChecklist = checklist

  const mealItems = activeChecklist.items.filter((i) => i.type === 'multi_check')
  const textNoteItems = activeChecklist.items.filter((i) => i.type === 'text_note')
  const isPotluck =
    activeChecklist.template === 'potluck' ||
    (activeChecklist.template === 'custom' && activeChecklist.items.some((i) => i.type === 'single_pick'))
  const isConference =
    activeChecklist.template === 'conference' ||
    (activeChecklist.template === 'custom' && mealItems.length > 0)

  const allSignupItems = activeChecklist.items.filter((i) => i.type === 'single_pick')
  const whosBringing = getWhosBringingWhat(event.id, activeChecklist.items)

  function toggleMeal(itemId: string) {
    setSkipped(false)
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    )
  }

  function selectPotluckItem(itemId: string) {
    setSkipped(false)
    setSelectedItemIds([itemId])
    setError('')
  }

  function handleSkip() {
    if (!activeChecklist.allowSkip) return
    setSkipped(true)
    setSelectedItemIds([])
    setError('')
  }

  function buildDietaryNote(): string {
    const parts: string[] = []

    if (textNoteItems.length === 1) {
      const value = (textNotes[textNoteItems[0].id] ?? '').trim()
      if (value) parts.push(value)
    } else if (textNoteItems.length > 1) {
      for (const item of textNoteItems) {
        const value = (textNotes[item.id] ?? '').trim()
        if (value) parts.push(`${item.label}: ${value}`)
      }
    }

    if (isConference) {
      for (const item of mealItems) {
        if (!selectedItemIds.includes(item.id) || !item.allowNote) continue
        const value = (claimNotes[item.id] ?? '').trim()
        if (value) parts.push(`${item.label} note: ${value}`)
      }
    }

    return parts.join('\n').trim()
  }

  function handleSubmit() {
    const dietaryNote = buildDietaryNote()
    const validation = validateChecklistResponse(activeChecklist, {
      selectedItemIds,
      dietaryNote,
      skipped,
    })
    if (!validation.ok) {
      setError(validation.error ?? 'Please complete the checklist.')
      return
    }

    if (isPotluck && !skipped && selectedItemIds.length === 1) {
      const itemId = selectedItemIds[0]
      const item = activeChecklist.items.find((i) => i.id === itemId)
      const claim = claimChecklistItem({
        eventId: event.id,
        itemId,
        attendeeEmail,
        attendeeName,
        note: item?.allowNote ? claimNotes[itemId] : undefined,
        maxClaims: item ? getMaxClaimsForItem(item) : 1,
      })
      if (!claim.ok) {
        setError(claim.error ?? 'Item no longer available.')
        setSelectedItemIds([])
        setRefreshKey((n) => n + 1)
        return
      }
    }

    onComplete({ selectedItemIds, dietaryNote, skipped })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-extrabold text-brown">Attendee Checklist</h2>
        <p className="mt-1 text-sm text-brown-muted">
          {activeChecklist.mandatory
            ? 'Complete this before confirming your spot.'
            : 'Optional — help the host plan ahead.'}
        </p>
      </div>

      {isPotluck && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-brown">What will you bring?</p>
          <p className="text-[10px] text-brown-muted">Pick one available item, or skip if allowed.</p>
          <div className="space-y-2">
            {allSignupItems.map((item) => {
              const maxClaims = getMaxClaimsForItem(item)
              const claimCount = getItemClaimCount(event.id, item.id)
              const isFull = claimCount >= maxClaims
              const isAvailable = availablePotluckItems.some((i) => i.id === item.id)
              const spotsLabel = `${claimCount} of ${maxClaims} spot${maxClaims === 1 ? '' : 's'}`

              return (
                <div key={item.id} className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 transition ${
                      !isAvailable
                        ? 'cursor-not-allowed border-brown/8 bg-cream-dark/50 opacity-60'
                        : selectedItemIds.includes(item.id)
                          ? 'border-orange bg-orange/10'
                          : 'border-brown/10 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="potluck-item"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => selectPotluckItem(item.id)}
                      disabled={!isAvailable}
                      className="accent-orange"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium text-brown">{item.label}</span>
                      <span className="text-[10px] text-brown-muted">
                        {isFull ? 'Full' : spotsLabel}
                      </span>
                    </span>
                  </label>
                  {selectedItemIds.includes(item.id) && item.allowNote && (
                    <input
                      type="text"
                      value={claimNotes[item.id] ?? ''}
                      onChange={(e) =>
                        setClaimNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder='Optional note (e.g. "vegan dressing")'
                      className="w-full rounded-[14px] border border-brown/15 bg-white px-3 py-2 text-sm text-brown outline-none focus:border-purple"
                    />
                  )}
                </div>
              )
            })}
            {availablePotluckItems.length === 0 && allSignupItems.length > 0 && (
              <p className="text-sm italic text-brown-muted">All items have been claimed.</p>
            )}
          </div>
          {activeChecklist.allowSkip && (
            <SkipButton
              variant="outlined"
              selected={skipped}
              onClick={handleSkip}
              className={skipped ? undefined : 'bg-cream-dark'}
            >
              Skip — I won&apos;t bring an item
            </SkipButton>
          )}
          {whosBringing.some((e) => e.claims.length > 0) && (
            <div className="rounded-[14px] border border-brown/10 bg-cream-dark/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brown-muted">Already claimed</p>
              <ul className="mt-1 space-y-1">
                {whosBringing
                  .filter((entry) => entry.claims.length > 0)
                  .map((entry) => (
                    <li key={entry.itemId} className="text-xs text-brown-muted">
                      <span className="font-semibold text-brown">{entry.label}</span>
                      {' '}
                      ({entry.claims.length}/{entry.maxClaims}):{' '}
                      {entry.claims.map(formatClaimantName).join(', ')}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isConference && (
        <div className="space-y-3">
          {mealItems.length > 0 && (
            <div>
              <p className="text-sm font-bold text-brown">Which meals will you attend?</p>
              <div className="mt-2 space-y-2">
                {mealItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 transition ${
                        selectedItemIds.includes(item.id)
                          ? 'border-orange bg-orange/10'
                          : 'border-brown/10 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleMeal(item.id)}
                        className="accent-orange"
                      />
                      <span className="text-sm font-medium text-brown">{item.label}</span>
                    </label>
                    {selectedItemIds.includes(item.id) && item.allowNote && (
                      <input
                        type="text"
                        value={claimNotes[item.id] ?? ''}
                        onChange={(e) =>
                          setClaimNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder='Optional note (e.g. "vegetarian option")'
                        className="w-full rounded-[14px] border border-brown/15 bg-white px-3 py-2 text-sm text-brown outline-none focus:border-purple"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {textNoteItems.map((item) => (
            <div key={item.id}>
              <label className="text-sm font-bold text-brown">
                {item.label || 'Notes'}
                {activeChecklist.mandatory ? ' *' : ''}
              </label>
              <textarea
                value={textNotes[item.id] ?? ''}
                onChange={(e) =>
                  setTextNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                placeholder='e.g. Vegetarian, nut allergy — or write "None"'
                rows={3}
                className="mt-2 w-full rounded-[14px] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none focus:border-purple"
              />
            </div>
          ))}
          {activeChecklist.allowSkip && (
            <SkipButton
              variant="outlined"
              selected={skipped}
              onClick={handleSkip}
              className={skipped ? undefined : 'bg-cream-dark'}
            >
              Skip checklist
            </SkipButton>
          )}
        </div>
      )}

      {activeChecklist.template === 'custom' && !isPotluck && !isConference && (
        <CustomChecklistFields
          checklist={activeChecklist}
          selectedItemIds={selectedItemIds}
          textNotes={textNotes}
          skipped={skipped}
          onSelectSingle={(id) => {
            setSkipped(false)
            setSelectedItemIds([id])
          }}
          onToggleMulti={toggleMeal}
          onTextNoteChange={(itemId, value) =>
            setTextNotes((prev) => ({ ...prev, [itemId]: value }))
          }
          onSkip={handleSkip}
        />
      )}

      {error && <p className="text-sm font-semibold text-maroon">{error}</p>}

      <div className="flex gap-3">
        {onCancel && (
          <BackButton variant="secondaryRounded" onClick={onCancel} showIcon={false} className="flex-1" />
        )}
        <GradientButton type="button" fullWidth className="rounded-[14px] py-3" onClick={handleSubmit}>
          Continue
        </GradientButton>
      </div>
    </div>
  )
}

function CustomChecklistFields({
  checklist,
  selectedItemIds,
  textNotes,
  skipped,
  onSelectSingle,
  onToggleMulti,
  onTextNoteChange,
  onSkip,
}: {
  checklist: EventChecklist
  selectedItemIds: string[]
  textNotes: Record<string, string>
  skipped: boolean
  onSelectSingle: (id: string) => void
  onToggleMulti: (id: string) => void
  onTextNoteChange: (itemId: string, value: string) => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-3">
      {checklist.items.map((item) => {
        if (item.type === 'text_note') {
          return (
            <div key={item.id}>
              <label className="text-sm font-bold text-brown">{item.label || 'Notes'}</label>
              <textarea
                value={textNotes[item.id] ?? ''}
                onChange={(e) => onTextNoteChange(item.id, e.target.value)}
                rows={2}
                className="mt-2 w-full rounded-[14px] border border-brown/15 bg-white px-3 py-2.5 text-sm text-brown outline-none focus:border-purple"
              />
            </div>
          )
        }
        if (item.type === 'single_pick') {
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 ${
                selectedItemIds.includes(item.id) ? 'border-orange bg-orange/10' : 'border-brown/10 bg-white'
              }`}
            >
              <input
                type="radio"
                name="custom-single"
                checked={selectedItemIds.includes(item.id)}
                onChange={() => onSelectSingle(item.id)}
                className="accent-orange"
              />
              <span className="text-sm text-brown">{item.label}</span>
            </label>
          )
        }
        return (
          <label
            key={item.id}
            className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 ${
              selectedItemIds.includes(item.id) ? 'border-orange bg-orange/10' : 'border-brown/10 bg-white'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedItemIds.includes(item.id)}
              onChange={() => onToggleMulti(item.id)}
              className="accent-orange"
            />
            <span className="text-sm text-brown">{item.label}</span>
          </label>
        )
      })}
      {checklist.allowSkip && (
        <SkipButton variant="outlined" selected={skipped} onClick={onSkip} />
      )}
    </div>
  )
}
