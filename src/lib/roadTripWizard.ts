export type RoadTripWizardStep = 1 | 2 | 3

export const ROAD_TRIP_WIZARD_STEPS: {
  id: 'basics' | 'stops' | 'review'
  label: string
  number: RoadTripWizardStep
}[] = [
  { id: 'basics', label: 'BASICS', number: 1 },
  { id: 'stops', label: 'STOPS', number: 2 },
  { id: 'review', label: 'REVIEW', number: 3 },
]

export function roadTripStepIdFromNumber(step: RoadTripWizardStep): string {
  return ROAD_TRIP_WIZARD_STEPS.find((s) => s.number === step)?.id ?? 'basics'
}

export function roadTripStepNumberFromId(stepId: string | undefined): RoadTripWizardStep {
  const match = ROAD_TRIP_WIZARD_STEPS.find((s) => s.id === stepId)
  return match?.number ?? 1
}

export function isRoadTripBasicsComplete(name: string): boolean {
  return name.trim().length > 0
}
