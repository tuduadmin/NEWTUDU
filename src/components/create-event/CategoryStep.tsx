import { Hash, X } from 'lucide-react'
import { useState } from 'react'
import type { HostEventFormData } from '../../lib/account'
import { EVENT_CATEGORIES, getCategoryById, type EventCategoryId } from '../../data/eventCategories'
import { FieldLabel, TextInput } from './CreateEventLayout'

type CategoryStepProps = {
  form: HostEventFormData
  updateForm: (partial: Partial<HostEventFormData>) => void
}

type SelectionMode = 'primary' | 'secondary' | 'done'

export default function CategoryStep({ form, updateForm }: CategoryStepProps) {
  const [tagInput, setTagInput] = useState('')
  const primary = getCategoryById(form.primaryCategory as EventCategoryId)
  const secondary = getCategoryById(form.secondaryCategory as EventCategoryId)

  const mode: SelectionMode = !form.primaryCategory
    ? 'primary'
    : !form.secondaryCategory
      ? 'secondary'
      : 'done'

  function selectCategory(id: EventCategoryId) {
    if (mode === 'primary') {
      updateForm({ primaryCategory: id, secondaryCategory: '', subCategories: [] })
    } else if (mode === 'secondary' && id !== form.primaryCategory) {
      updateForm({ secondaryCategory: id, subCategories: [] })
    }
  }

  function toggleSubCategory(tag: string) {
    const current = form.subCategories
    if (current.includes(tag)) {
      updateForm({ subCategories: current.filter((t) => t !== tag) })
    } else if (current.length < 3) {
      updateForm({ subCategories: [...current, tag] })
    }
  }

  function addCustomTag() {
    const trimmed = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!trimmed || form.customTags.includes(trimmed)) return
    updateForm({ customTags: [...form.customTags, trimmed] })
    setTagInput('')
  }

  function startOver() {
    updateForm({ primaryCategory: '', secondaryCategory: '', subCategories: [], customTags: [] })
  }

  const allSubcategories = [
    ...(primary?.subcategories ?? []),
    ...(secondary?.subcategories ?? []),
  ]

  return (
    <section>
      <h2 className="font-display text-xl font-extrabold text-brown">Categorization</h2>
      <p className="mt-1 text-sm text-brown-muted">Choose your primary and secondary categories.</p>

      {mode === 'done' ? (
        <>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-brown-muted">Tap a category to change it</p>
            <button type="button" onClick={startOver} className="text-xs font-bold text-purple">
              START OVER
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {primary && (
              <CategoryCard
                label="PRIMARY"
                category={primary}
                onClick={() => updateForm({ primaryCategory: '', secondaryCategory: '', subCategories: [] })}
              />
            )}
            {secondary && (
              <CategoryCard
                label="SECONDARY"
                category={secondary}
                onClick={() => updateForm({ secondaryCategory: '', subCategories: [] })}
              />
            )}
          </div>

          {allSubcategories.length > 0 && (
            <div className="mt-5">
              <FieldLabel>Sub-Categories (max 3)</FieldLabel>
              <p className="mb-2 text-[10px] text-brown-muted">
                Optional — helps match your event to the right audience
              </p>
              <div className="flex flex-wrap gap-2">
                {allSubcategories.map((sub) => {
                  const selected = form.subCategories.includes(sub)
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubCategory(sub)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? 'border-orange bg-orange/10 text-orange'
                          : 'border-brown/15 bg-white text-brown hover:border-orange/30'
                      }`}
                    >
                      {sub}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="flex items-center gap-1.5">
              <Hash size={14} className="text-orange" />
              <FieldLabel>Custom Tags</FieldLabel>
            </div>
            <p className="mb-2 text-[10px] text-brown-muted">
              Add custom hashtags so Tudu&apos;s algorithm can learn what makes your event unique. Press
              Enter to add.
            </p>
            <div className="flex gap-2">
              <TextInput
                value={tagInput}
                onChange={setTagInput}
                placeholder="e.g. live-music, family-friendly, out..."
                className="flex-1"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="shrink-0 rounded-[var(--radius-lg)] bg-peach/30 px-4 py-2.5 text-sm font-bold text-brown"
              >
                Add
              </button>
            </div>
            {form.customTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.customTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 text-xs font-medium text-orange"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => updateForm({ customTags: form.customTags.filter((t) => t !== tag) })}
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-brown-muted">
            Select your{' '}
            <span className="font-bold text-orange">{mode === 'primary' ? 'primary' : 'secondary'}</span>{' '}
            category first.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {EVENT_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const disabled = mode === 'secondary' && cat.id === form.primaryCategory
              const selected =
                form.primaryCategory === cat.id || form.secondaryCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectCategory(cat.id)}
                  className={`flex items-center gap-2 rounded-[var(--radius-lg)] border-2 px-3 py-3 text-left transition ${
                    selected
                      ? 'border-orange bg-orange/10'
                      : disabled
                        ? 'cursor-not-allowed border-brown/5 bg-cream-dark opacity-40'
                        : 'border-brown/10 bg-white hover:border-orange/30'
                  }`}
                >
                  <Icon size={18} className={selected ? 'text-orange' : 'text-brown'} />
                  <span className={`text-xs font-semibold leading-tight ${selected ? 'text-orange' : 'text-brown'}`}>
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

function CategoryCard({
  label,
  category,
  onClick,
}: {
  label: string
  category: { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
  onClick: () => void
}) {
  const Icon = category.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[var(--radius-lg)] border-2 border-orange bg-orange/5 p-4 text-left"
    >
      <span className="rounded bg-orange px-1.5 py-0.5 text-[9px] font-bold text-white">{label}</span>
      <div className="mt-3 flex items-center gap-2">
        <Icon size={22} className="text-brown" />
        <span className="font-display text-sm font-bold text-brown">{category.label}</span>
      </div>
    </button>
  )
}
