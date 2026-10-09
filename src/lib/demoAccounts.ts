/** Demo / admin identities — no imports so seed & reset modules can load without auth init cycles. */
export const ORG_ADMIN_USER = {
  email: 'orgadmin@tudu.ca',
  password: 'password123',
  firstName: 'Org',
  lastName: 'Admin',
  username: 'orgadmin',
} as const

export const DEMO_USER = {
  email: 'demo@tudu.ca',
  password: 'password123',
  firstName: 'Demo',
  lastName: 'User',
  username: 'demo',
} as const

export const PLATFORM_ADMIN = {
  email: 'admin@tudu.ca',
  password: 'admin123',
  firstName: 'Platform',
  lastName: 'Admin',
  username: 'platformadmin',
} as const
