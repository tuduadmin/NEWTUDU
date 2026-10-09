import { useEffect } from 'react'

/** Discourage indexing of unlisted staff / admin pages (not a substitute for real auth). */
export function useNoIndexPage(title?: string): void {
  useEffect(() => {
    const previousTitle = document.title
    if (title) document.title = title

    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    const previousRobots = robots.content
    robots.content = 'noindex, nofollow'

    return () => {
      document.title = previousTitle
      if (created && robots?.parentNode) {
        robots.parentNode.removeChild(robots)
      } else if (robots) {
        robots.content = previousRobots
      }
    }
  }, [title])
}
