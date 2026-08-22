type RadiusCandidate = {
  px: number
  label: string
  tailwind?: string
  note: string
}

const CANDIDATES: RadiusCandidate[] = [
  { px: 8, label: '8px', tailwind: 'rounded-lg', note: 'Legacy chrome (superseded)' },
  { px: 12, label: '12px', tailwind: 'rounded-xl', note: 'Legacy surface candidate' },
  { px: 14, label: '14px', tailwind: 'rounded-[14px] / rounded-surface', note: 'App standard (chosen)' },
  { px: 16, label: '16px', note: 'Surface candidate B' },
]

function Swatch({ candidate }: { candidate: RadiusCandidate }) {
  const r = `${candidate.px}px`

  return (
    <section
      className="rounded-[14px] border border-brown/10 bg-white/80 p-4 shadow-sm"
      aria-labelledby={`radius-${candidate.px}`}
    >
      <div className="mb-4 flex flex-wrap items-baseline gap-2">
        <h2 id={`radius-${candidate.px}`} className="font-display text-lg font-bold text-brown">
          {candidate.label}
        </h2>
        {candidate.tailwind ? (
          <span className="font-mono text-xs text-brown-muted">{candidate.tailwind}</span>
        ) : null}
      </div>
      <p className="mb-4 text-xs leading-relaxed text-brown-muted">{candidate.note}</p>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brown-muted">Button</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[14px] bg-gradient-tudu px-6 py-2.5 font-display text-sm font-bold text-white shadow-md"
          >
            Sample CTA
          </button>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brown-muted">Box / card</p>
          <div
            className="border border-brown/12 bg-cream px-4 py-3 text-sm text-brown"
            style={{ borderRadius: r }}
          >
            Event card or settings panel surface
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brown-muted">Input</p>
          <input
            type="text"
            readOnly
            value="Sample input field"
            className="w-full border border-brown/15 bg-white px-4 py-3 text-sm text-brown outline-none"
            style={{ borderRadius: r }}
            aria-label={`Sample input at ${candidate.label}`}
          />
        </div>
      </div>
    </section>
  )
}

export default function RadiusPickerPage() {
  return (
    <div className="mx-auto min-h-svh max-w-lg bg-cream px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="mb-6 space-y-3">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-brown-muted">Dev tool</p>
        <h1 className="font-display text-2xl font-bold text-brown">Corner radius picker</h1>
        <p className="text-sm leading-relaxed text-brown">
          Compare field and box corners side by side. Production uses <strong className="text-brown">14px</strong>{' '}
          on buttons, panels, inputs, header, and footer. Avatars and circle icon buttons stay pill (
          <code className="text-xs">rounded-full</code>).
        </p>
        <div className="rounded-[14px] border border-brown/10 bg-white/80 p-3 text-sm leading-relaxed text-brown">
          Standard chosen: <strong>14px</strong> (<code className="text-xs">rounded-[14px]</code>,{' '}
          <code className="text-xs">rounded-surface</code>, token <code className="text-xs">--radius-chrome</code>).
        </div>
      </header>

      <div className="space-y-6">
        {CANDIDATES.map((c) => (
          <Swatch key={c.px} candidate={c} />
        ))}
      </div>

      <section className="mt-8 rounded-[14px] border border-orange/25 bg-orange/5 p-4 text-sm text-brown">
        <p className="font-display font-bold text-brown">Current tokens</p>
        <ul className="mt-2 space-y-1 text-xs text-brown-muted">
          <li>
            <code className="text-brown">--radius-chrome</code> = 14px
          </li>
          <li>
            <code className="text-brown">--radius-surface</code> = 14px
          </li>
          <li>
            <code className="text-brown">--radius-button</code> = 14px
          </li>
          <li>
            <code className="text-brown">--radius-pill</code> = 9999px (avatars / circle icons)
          </li>
          <li>
            <code className="text-brown">--radius-tudu-xl</code> = 0.875rem (14px)
          </li>
        </ul>
      </section>
    </div>
  )
}
