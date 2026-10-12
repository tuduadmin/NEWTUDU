import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import ReportProblemSheet from './ReportProblemSheet'

type TuduBetaFeedbackBoxProps = {
  variant?: 'light' | 'dark'
  className?: string
}

export default function TuduBetaFeedbackBox({
  variant = 'light',
  className = '',
}: TuduBetaFeedbackBoxProps) {
  const [open, setOpen] = useState(false)
  const isDark = variant === 'dark'

  return (
    <>
      <section
        className={`rounded-[14px] border p-4 ${
          isDark
            ? 'border-white/10 bg-midnight-surface shadow-[0_0_20px_rgba(249,115,22,0.06)]'
            : 'app-surface-card border-app-subtle'
        } ${className}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
              isDark ? 'bg-magenta/15' : 'bg-purple/10'
            }`}
          >
            <Sparkles size={18} className={isDark ? 'text-sunset-pink' : 'text-purple'} aria-hidden />
          </div>
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${
                isDark ? 'text-white/50' : 'text-brown-muted'
              }`}
            >
              Beta feedback
            </p>
            <p
              className={`mt-1.5 text-xs leading-relaxed ${
                isDark ? 'text-white/65' : 'text-brown-muted'
              }`}
            >
              Tudu&apos;s still growing, and you&apos;re helping shape it. Tell us what&apos;s working,
              what&apos;s broken, and what you wish it did — we read every message.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`mt-4 flex w-full items-center justify-center rounded-[14px] border py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
            isDark
              ? 'border-sunset-orange/40 bg-midnight-elevated text-sunset-orange hover:border-sunset-orange/60 hover:bg-sunset-orange/10'
              : 'border-orange/35 bg-app-elevated text-orange hover:border-orange/50 hover:bg-orange/5'
          }`}
        >
          Send feedback
        </button>
      </section>

      <ReportProblemSheet
        open={open}
        onClose={() => setOpen(false)}
        kind="feedback"
        title="Send feedback"
        subtitle="You're helping shape TUDU — we read every message."
      />
    </>
  )
}
