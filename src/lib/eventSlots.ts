export const HOST_EVENT_SLOTS_HREF = '/host/subscription#event-slots'

export function isPublicEventLimitTight(remaining: number): boolean {
  return remaining <= 1
}

/** e.g. "1/2" or "3/2 (+4 purchased)" */
export function formatPublicEventSlotUsage(
  used: number,
  baseLimit: number,
  extraSlots: number,
): string {
  if (extraSlots <= 0) {
    return `${used}/${baseLimit}`
  }
  return `${used}/${baseLimit} (+${extraSlots} purchased)`
}

/** Full label for host UI, e.g. "Public events 1/2" or "Public events 3/2 (+4 purchased)" */
export function formatPublicEventSlotLabel(
  used: number,
  baseLimit: number,
  extraSlots: number,
): string {
  return `Public events ${formatPublicEventSlotUsage(used, baseLimit, extraSlots)}`
}

/** Unverified personal hosts — private event cap before phone verify. */
export function formatPrivateEventSlotLabel(used: number, limit: number): string {
  return `Private events ${used}/${limit}`
}

export function formatPrivateEventSlotCapacity(used: number, limit: number): string {
  return `Using ${used} of ${limit} private event slots`
}

/** Usage line for subscription slot packs section. */
export function formatPublicEventSlotCapacity(
  used: number,
  baseLimit: number,
  extraSlots: number,
): string {
  const usage = formatPublicEventSlotUsage(used, baseLimit, extraSlots)
  if (extraSlots <= 0) {
    return `Using ${used} of ${baseLimit} public event slots`
  }
  return `Using ${usage} public event slots (${baseLimit + extraSlots} total capacity)`
}
