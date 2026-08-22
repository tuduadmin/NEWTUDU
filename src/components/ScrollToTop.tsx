import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset window scroll when navigating between routes (SPA scroll restoration). */
export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return null
}
