import { type ReactNode } from 'react'
import type { LegalContentFormat } from '../lib/legalDocs'

export function LegalContentRenderer({
  content,
  format,
}: {
  content: string
  format: LegalContentFormat
}) {
  if (format === 'html') {
    return (
      <div
        className="legal-published-html space-y-4 text-sm leading-relaxed text-brown-muted [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brown [&_h3]:font-semibold [&_h3]:text-brown [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  if (format === 'markdown') {
    return (
      <div className="space-y-4 whitespace-pre-wrap text-sm leading-relaxed text-brown-muted">
        {content.split('\n\n').map((block, i) => {
          if (block.startsWith('## ')) {
            return (
              <h2 key={i} className="text-xl font-bold text-brown">
                {block.slice(3)}
              </h2>
            )
          }
          if (block.startsWith('# ')) {
            return (
              <h2 key={i} className="text-xl font-bold text-brown">
                {block.slice(2)}
              </h2>
            )
          }
          return <p key={i}>{block}</p>
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4 whitespace-pre-wrap text-sm leading-relaxed text-brown-muted">
      {content}
    </div>
  )
}

export function LegalPublishedBody({
  fallback,
  published,
}: {
  fallback: ReactNode
  published: { content: string; format: LegalContentFormat } | null
}) {
  if (published?.content.trim()) {
    return <LegalContentRenderer content={published.content} format={published.format} />
  }
  return <>{fallback}</>
}
