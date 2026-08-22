export type DoorPaymentMode = '' | 'cash' | 'card' | 'both'

export function doorPaymentAcceptsCash(mode: DoorPaymentMode): boolean {
  return mode === 'cash' || mode === 'both'
}

export function doorPaymentAcceptsCard(mode: DoorPaymentMode): boolean {
  return mode === 'card' || mode === 'both'
}

export function doorPaymentFromFlags(cash: boolean, card: boolean): DoorPaymentMode {
  if (cash && card) return 'both'
  if (cash) return 'cash'
  if (card) return 'card'
  return ''
}

export function formatDoorPayment(mode: DoorPaymentMode): string | null {
  switch (mode) {
    case 'cash':
      return 'Cash accepted'
    case 'card':
      return 'Card / tap accepted'
    case 'both':
      return 'Cash & card accepted'
    default:
      return null
  }
}
