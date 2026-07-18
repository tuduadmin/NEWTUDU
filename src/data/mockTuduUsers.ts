export type TuduUser = {
  id: string
  name: string
  phone: string
  username: string
}

/** Mock TUDU users for contact matching demos — phones align with demoContacts.ts entries. */
export const MOCK_TUDU_USERS: TuduUser[] = [
  { id: 'u1', name: 'Sarah Chen', phone: '+1 (416) 555-1234', username: 'sarahc' },
  { id: 'u2', name: 'Marcus Webb', phone: '416-555-9876', username: 'marcusw' },
  { id: 'u3', name: 'Priya Patel', phone: '647-555-4422', username: 'priyap' },
  { id: 'u4', name: 'Jordan Lee', phone: '+1 905 555 3300', username: 'jordanl' },
  { id: 'u5', name: 'Emma Rodriguez', phone: '(613) 555-7788', username: 'emmar' },
]
