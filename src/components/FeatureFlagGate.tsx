import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useFeatureFlags } from '../hooks/useFeatureFlags'
import type { FeatureFlags } from '../lib/adminSettings'

type FeatureFlagGateProps = {
  flag: keyof FeatureFlags
  children: ReactNode
  fallbackTo?: string
}

export default function FeatureFlagGate({
  flag,
  children,
  fallbackTo = '/host',
}: FeatureFlagGateProps) {
  const flags = useFeatureFlags()

  if (!flags[flag]) {
    return <Navigate to={fallbackTo} replace />
  }

  return children
}
