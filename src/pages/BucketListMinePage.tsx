import { Navigate, useSearchParams } from 'react-router-dom'

/** Legacy route — redirects to the unified bucket list hub. */
export default function BucketListMinePage() {
  const [searchParams] = useSearchParams()
  const params = new URLSearchParams({ tab: 'mine' })
  if (searchParams.get('discover') === 'completed') {
    params.set('discover', 'completed')
  }
  return <Navigate to={`/bucket-list?${params.toString()}`} replace />
}
