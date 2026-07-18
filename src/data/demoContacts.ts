import type { DeviceContact } from '../utils/contacts'

/** Fallback contacts when the Contacts API is unavailable (e.g. desktop browsers). */
export const DEMO_CONTACTS: DeviceContact[] = [
  { id: 'c1', name: 'Sarah Chen', phones: ['+1 (416) 555-1234'] },
  { id: 'c2', name: 'Marcus Webb', phones: ['416-555-9876'] },
  { id: 'c3', name: 'Priya Patel', phones: ['647-555-4422'] },
  { id: 'c4', name: 'Jordan Lee', phones: ['+1 905 555 3300'] },
  { id: 'c5', name: 'Emma Rodriguez', phones: ['(613) 555-7788'] },
  { id: 'c6', name: 'Alex Kim', phones: ['5195556611'] },
  { id: 'c7', name: 'Taylor Brooks', phones: ['416-555-2200'] },
  { id: 'c8', name: 'Chris Nguyen', phones: ['647-555-8899'] },
  { id: 'c9', name: 'Morgan Davis', phones: ['905-555-1144'] },
  { id: 'c10', name: 'Jamie Wilson', phones: ['613-555-0033'] },
]
