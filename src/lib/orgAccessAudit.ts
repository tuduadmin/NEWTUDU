export type OrgAccessAction =
  | 'role_change'
  | 'member_removed'
  | 'member_invited'
  | 'ownership_transfer'

export interface OrgAccessAuditEntry {
  id: string
  orgId: string
  action: OrgAccessAction
  actorEmail: string
  targetEmail?: string
  details: string
  timestamp: string
}

const AUDIT_KEY = 'tudu_org_access_audit'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function generateId(): string {
  return `oaa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function logOrgAccessAudit(
  entry: Omit<OrgAccessAuditEntry, 'id' | 'timestamp'>,
): OrgAccessAuditEntry {
  const log = getOrgAccessAuditLog()
  const full: OrgAccessAuditEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  }
  log.unshift(full)
  writeJson(AUDIT_KEY, log.slice(0, 500))
  return full
}

export function getOrgAccessAuditLog(orgId?: string): OrgAccessAuditEntry[] {
  const log = readJson<OrgAccessAuditEntry[]>(AUDIT_KEY, [])
  return orgId ? log.filter((e) => e.orgId === orgId) : log
}
