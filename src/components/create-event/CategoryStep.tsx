import { X } from 'lucide-react'
import { useState } from 'react'
import type { HostEventFormData } from '../../lib/account'
import {
  EVENT_CATEGORIES,
  MAX_EVENT_CATEGORIES,
  MIN_EVENT_CATEGORIES,
  countSelectedCategories,
  type EventCategoryId,
} from '../../data/eventCategories'
import {
  MAX_EVENT_KEYWORDS,
  MIN_EVENT_KEYWORDS,
  parseSearchWordInput,
  SEARCH_WORD_EXAMPLES,
} from '../../lib/eventKeywords'
import EventDoorPaymentPicker from './EventDoorPaymentPicker'
import EventAmenitiesPicker from './EventAmenitiesPicker'
import { FieldHelper, FieldLabel, TextInput } from './CreateEventLayout'
import { prefChoiceClasses, PREF_CHOICE_ACTIVE_TEXT } from '../../lib/prefChoiceClasses'

type CategoryStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
}

function categoryTileIconClass(selected = false) {
  return `pref-choice-icon h-5 w-5 shrink-0 ${selected ? '' : 'text-brown-muted'}`
}

export default function CategoryStep({ form, updateForm }: CategoryStepProps) {
  const [wordInput, setWordInput] = useState('')
  const searchWords = form.customTags
  const categoriesSelected = countSelectedCategories(form)
  const categoriesAtMax = categoriesSelected >= MAX_EVENT_CATEGORIES
  const categoriesNeeded = Math.max(0, MIN_EVENT_CATEGORIES - categoriesSelected)

  function toggleCategory(id: EventCategoryId) {
    if (form.primaryCategory === id) {
      updateForm({
        primaryCategory: form.secondaryCategory,
        secondaryCategory: '',
      })
      return
    }

    if (form.secondaryCategory === id) {
      updateForm({ secondaryCategory: '' })
      return
    }

    if (!form.primaryCategory) {
      updateForm({ primaryCategory: id })
      return
    }

    if (!form.secondaryCategory) {
      updateForm({ secondaryCategory: id })
    }
  }

  function removeSearchWord(word: string) {
    updateForm({ customTags: searchWords.filter((w) => w !== word) })
  }

  function addSearchWords() {
    const incoming = parseSearchWordInput(wordInput)
    if (incoming.length === 0) {
      setWordInput('')
      return
    }

    const merged = [...searchWords]
    for (const word of incoming) {
      if (merged.includes(word)) continue
      if (merged.length >= MAX_EVENT_KEYWORDS) break
      merged.push(word)
    }

    updateForm({ customTags: merged })
    setWordInput('')
  }

  function clearCategories() {
    updateForm({
      primaryCategory: '',
      secondaryCategory: '',
      subCategories: [],
      customTags: [],
    })
  }

  const wordsNeeded = Math.max(0, MIN_EVENT_KEYWORDS - searchWords.length)
  const wordsAtMax = searchWords.length >= MAX_EVENT_KEYWORDS
  const canAddWords = parseSearchWordInput(wordInput).length > 0

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Categorization</h2>
      <p className="mt-1 text-sm text-brown-muted">
        Pick {MIN_EVENT_CATEGORIES} categories, then add search words so guests can find your event.
      </p>

      <div className="mt-4 flex items-center justify-between">
        <FieldLabel>Categories</FieldLabel>
        {categoriesSelected > 0 && (
          <button type="button" onClick={clearCategories} className="text-xs font-bold text-purple">
            CLEAR
          </button>
        )}
      </div>

      {categoriesNeeded > 0 && (
        <p className="mt-1 text-xs font-semibold text-maroon">
          {categoriesSelected}/{MIN_EVENT_CATEGORIES} selected — pick {categoriesNeeded} more
        </p>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2">
        {EVENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const selected =
            form.primaryCategory === cat.id || form.secondaryCategory === cat.id
          const disabled = !selected && categoriesAtMax
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              aria-label={cat.label}
              title={cat.label}
              onClick={() => toggleCategory(cat.id)}
              className={
                disabled
                  ? 'flex h-[4.25rem] w-full cursor-not-allowed flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-brown/5 bg-cream-dark px-2 py-2 text-center opacity-40'
                  : prefChoiceClasses(
                      selected,
                      'flex h-[4.25rem] w-full flex-col items-center justify-center gap-1 px-2 py-2 text-center',
                    )
              }
            >
              <Icon className={categoryTileIconClass(selected)} aria-hidden />
              <span
                className={`pref-choice-label line-clamp-2 text-[11px] leading-tight ${
                  selected ? PREF_CHOICE_ACTIVE_TEXT : 'font-semibold text-brown'
                }`}
              >
                {cat.shortLabel}
              </span>
            </button>
          )
        })}
      </div>

      {categoriesSelected > 0 && (
        <div className="mt-5">
          <FieldLabel>Search words</FieldLabel>
          <FieldHelper className="mb-2">
            Short words guests might search — not categories. Add at least {MIN_EVENT_KEYWORDS}, up to{' '}
            {MAX_EVENT_KEYWORDS}. Try: {SEARCH_WORD_EXAMPLES.join(', ')}.
          </FieldHelper>

          {wordsNeeded > 0 && (
            <p className="mb-2 text-xs font-semibold text-maroon">
              {searchWords.length}/{MIN_EVENT_KEYWORDS} added — add {wordsNeeded} more
            </p>
          )}

          {searchWords.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {searchWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 rounded-[14px] bg-orange/10 px-2.5 py-1 text-xs font-medium text-orange"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => removeSearchWord(word)}
                    aria-label={`Remove ${word}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <TextInput
              value={wordInput}
              onChange={setWordInput}
              placeholder="wings, cheap, beer, patio"
              className="flex-1"
              disabled={wordsAtMax}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addSearchWords()
                }
              }}
            />
            <button
              type="button"
              onClick={addSearchWords}
              disabled={wordsAtMax || !canAddWords}
              className="shrink-0 rounded-[14px] bg-peach/30 px-4 py-2.5 text-sm font-bold text-brown disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-display text-xl font-extrabold text-brown">Amenities</h2>
        <p className="mt-1 text-sm text-brown-muted">
          Pick all amenities that apply to your event — on-site payment, access, food, and anything else
          guests should know.
        </p>
        <div className="mt-4">
        <EventDoorPaymentPicker
          embedded
          doorPayment={form.doorPayment}
          atmOnSite={form.atmOnSite}
          onChange={(partial) => updateForm(partial)}
        />
        <EventAmenitiesPicker
          embedded
          amenities={form.amenities}
          onChange={(amenities) => updateForm({ amenities })}
        />
        </div>
      </div>
    </section>
  )
}
