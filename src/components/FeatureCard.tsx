import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type FeatureCardProps = {
  icon: ReactNode
  title: string
  description: string
  variant?: 'light' | 'dark'
  linkTo?: string
  linkLabel?: string
}

export default function FeatureCard({
  icon,
  title,
  description,
  variant = 'dark',
  linkTo,
  linkLabel,
}: FeatureCardProps) {
  const isDark = variant === 'dark'

  return (
    <article
      className={`flex gap-4 rounded-[14px] p-4 ${
        isDark
          ? 'glass-surface'
          : 'border border-brown/10 bg-white shadow-sm'
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]">{icon}</div>
      <div>
        <h3 className={`mb-1 font-display text-base font-bold ${isDark ? 'text-white' : 'text-brown'}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-brown-muted'}`}>
          {description}
        </p>
        {linkTo && linkLabel && (
          <Link
            to={linkTo}
            className="mt-2 inline-block text-sm font-semibold text-peach no-underline hover:underline"
          >
            {linkLabel} â†’
          </Link>
        )}
      </div>
    </article>
  )
}
