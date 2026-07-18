import type { ReactNode } from 'react'

type FeatureCardProps = {
  icon: ReactNode
  title: string
  description: string
  variant?: 'light' | 'dark'
}

export default function FeatureCard({ icon, title, description, variant = 'dark' }: FeatureCardProps) {
  const isDark = variant === 'dark'

  return (
    <article
      className={`flex gap-4 rounded-[var(--radius-xl)] p-4 transition duration-[var(--duration-fast)] hover:scale-[1.01] ${
        isDark
          ? 'glass-surface'
          : 'border border-brown/10 bg-white shadow-sm'
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">{icon}</div>
      <div>
        <h3 className={`mb-1 font-display text-base font-bold ${isDark ? 'text-white' : 'text-brown'}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-brown-muted'}`}>
          {description}
        </p>
      </div>
    </article>
  )
}
