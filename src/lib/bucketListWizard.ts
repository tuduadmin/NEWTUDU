import type { BucketList } from '../types/bucketList'

export type BucketListWizardStep = 1 | 2 | 3

export const BUCKET_LIST_WIZARD_STEPS: {
  id: 'details' | 'items' | 'review'
  label: string
  number: BucketListWizardStep
}[] = [
  { id: 'details', label: 'DETAILS', number: 1 },
  { id: 'items', label: 'ITEMS', number: 2 },
  { id: 'review', label: 'REVIEW', number: 3 },
]

export function bucketListStepIdFromNumber(step: BucketListWizardStep): string {
  return BUCKET_LIST_WIZARD_STEPS.find((s) => s.number === step)?.id ?? 'details'
}

export function bucketListStepNumberFromId(stepId: string | undefined): BucketListWizardStep {
  const match = BUCKET_LIST_WIZARD_STEPS.find((s) => s.id === stepId)
  return match?.number ?? 1
}

export function isBucketListBasicsComplete(name: string): boolean {
  return name.trim().length > 0
}

export function getBucketListItemCount(list: BucketList): number {
  const customCount = (list.customItems ?? []).filter(
    (item) => item.title.trim() || item.image.trim() || item.videoUrl?.trim(),
  ).length
  return list.eventIds.length + customCount
}
