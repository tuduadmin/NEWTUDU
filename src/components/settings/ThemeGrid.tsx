import { useState } from 'react'
import { Clock, Lock } from 'lucide-react'
import {
  APP_THEME_OPTIONS,
  APP_THEMES_LOCKED,
  getAppThemeId,
  saveAppThemeId,
  type AppThemeId,
} from '../../lib/appThemes'
import {
  prefChoiceClasses,
  PREF_CHOICE_ACTIVE_TEXT,
} from '../../lib/prefChoiceClasses'

type ThemeGridProps = {
  /** When true, all themes are shown but cannot be changed. Defaults to APP_THEMES_LOCKED. */
  locked?: boolean
}

export default function ThemeGrid({ locked = APP_THEMES_LOCKED }: ThemeGridProps) {
  const [selected, setSelected] = useState<AppThemeId>(() => getAppThemeId())

  function select(id: AppThemeId) {
    if (locked) return
    setSelected(id)
    saveAppThemeId(id)
  }

  const gridThemes = APP_THEME_OPTIONS

  return (
    <div>
      {locked && (
        <p className="mb-3 text-xs leading-relaxed text-brown-muted">
          More themes are on the way. SOL is active for everyone right now.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {gridThemes.map((theme) => {
          const active = selected === theme.id
          return (
            <button
              key={theme.id}
              type="button"
              disabled={locked}
              aria-disabled={locked}
              onClick={() => select(theme.id)}
              className={`relative flex flex-col items-center gap-1 px-3 py-3 ${prefChoiceClasses(active)} ${
                locked ? 'cursor-not-allowed opacity-90' : ''
              } ${locked && !active ? 'hover:border-brown/25' : ''}`}
            >
              <span
                className="mb-0.5 h-6 w-full rounded-md border border-brown/10"
                style={{
                  background: `linear-gradient(135deg, ${theme.preview.bg} 55%, ${theme.preview.accent} 100%)`,
                }}
                aria-hidden
              />
              <span className="text-xl" aria-hidden>
                {theme.icon}
              </span>
              <span
                className={`pref-choice-label text-sm font-bold ${active ? PREF_CHOICE_ACTIVE_TEXT : 'text-brown'}`}
              >
                {theme.characterName}
              </span>
              <span
                className={`pref-choice-label text-[10px] ${active ? 'opacity-75' : 'text-brown-muted'}`}
              >
                {theme.legacyName}
              </span>
              {active && (
                <span className="pref-choice-label mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  Active
                </span>
              )}
              {locked && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brown/10 text-brown-muted">
                  <Lock size={10} aria-hidden />
                  <span className="sr-only">Locked</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        disabled={locked}
        aria-disabled={locked}
        onClick={() => select('auto')}
        className={`relative mt-2 flex w-full items-center justify-center gap-2 px-3 py-3 ${prefChoiceClasses(selected === 'auto')} ${
          locked ? 'cursor-not-allowed opacity-90' : ''
        } ${locked ? 'hover:border-brown/25' : ''}`}
      >
        <Clock size={16} className={selected === 'auto' ? 'pref-choice-label opacity-90' : 'text-brown-muted'} />
        <span
          className={`pref-choice-label text-sm font-bold ${selected === 'auto' ? PREF_CHOICE_ACTIVE_TEXT : 'text-brown'}`}
        >
          Auto
        </span>
        {locked && (
          <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-brown/10 text-brown-muted">
            <Lock size={10} aria-hidden />
          </span>
        )}
      </button>
    </div>
  )
}
