import {
  getOrganization,
  getOrganizations,
  updateOrganizationApproval,
  type OrgApprovalStatus,
} from './account'

export type OrgVerificationRequestStatus = 'pending' | 'approved' | 'rejected'

export type OrgVerificationRequest = {
  id: string
  orgId: string
  orgName: string
  /** Per-organization attempt number (1–3). */
  requestNumber: number
  submittedAt: string
  status: OrgVerificationRequestStatus
  submittedBy: string
}

export type SubmitOrgVerificationResult =
  | { ok: true; request: OrgVerificationRequest }
  | { ok: false; error: string; maxAttemptsReached?: boolean }

const REQUESTS_KEY = 'tudu-org-verification-requests'
const COUNTER_KEY = 'tudu-org-verification-counter'
const MIGRATION_KEY = 'tudu-org-verification-per-org-v1'
export const ORG_VERIFICATION_CHANGED_EVENT = 'tudu-org-verification-changed'
export const MAX_ORG_VERIFICATION_ATTEMPTS = 3

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event(ORG_VERIFICATION_CHANGED_EVENT))
  } catch (err) {
    console.warn(`[TUDU] Failed to write localStorage key "${key}":`, err)
  }
}

function generateId(): string {
  return `orgreq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function saveRequests(requests: OrgVerificationRequest[]): void {
  writeJson(REQUESTS_KEY, requests)
}

export function formatVerificationAttemptLabel(attempt: number): string {
  return `Verification request #${attempt} (of ${MAX_ORG_VERIFICATION_ATTEMPTS})`
}

export function formatVerificationAttemptShort(attempt: number): string {
  return `#${attempt} of ${MAX_ORG_VERIFICATION_ATTEMPTS}`
}

function sortRequestsChronologically(requests: OrgVerificationRequest[]): OrgVerificationRequest[] {
  return [...requests].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  )
}

function getRequestsForOrg(requests: OrgVerificationRequest[], orgId: string): OrgVerificationRequest[] {
  return sortRequestsChronologically(requests.filter((r) => r.orgId === orgId))
}

function renumberOrgAttempts(requests: OrgVerificationRequest[]): {
  requests: OrgVerificationRequest[]
  changed: boolean
} {
  const byOrg = new Map<string, OrgVerificationRequest[]>()
  for (const request of requests) {
    const list = byOrg.get(request.orgId) ?? []
    list.push(request)
    byOrg.set(request.orgId, list)
  }

  let changed = false
  const next = requests.map((request) => ({ ...request }))

  for (const [orgId, orgRequests] of byOrg) {
    const ordered = sortRequestsChronologically(orgRequests)
    ordered.forEach((request, index) => {
      const attempt = Math.min(index + 1, MAX_ORG_VERIFICATION_ATTEMPTS)
      const idx = next.findIndex((r) => r.id === request.id)
      if (idx < 0) return
      if (next[idx].requestNumber !== attempt) {
        next[idx] = { ...next[idx], requestNumber: attempt }
        changed = true
      }
      syncOrgVerificationFields(orgId, attempt, next[idx].submittedAt)
    })
  }

  return { requests: next, changed }
}

function migrateGlobalCounterToPerOrgAttempts(requests: OrgVerificationRequest[]): OrgVerificationRequest[] {
  if (readJson<boolean>(MIGRATION_KEY, false)) {
    return requests
  }

  const { requests: renumbered, changed } = renumberOrgAttempts(requests)
  try {
    localStorage.removeItem(COUNTER_KEY)
    localStorage.setItem(MIGRATION_KEY, JSON.stringify(true))
  } catch {
    /* ignore */
  }

  if (changed) {
    saveRequests(renumbered)
    return renumbered
  }

  return requests
}

function countAttemptsForOrg(requests: OrgVerificationRequest[], orgId: string): number {
  return requests.filter((r) => r.orgId === orgId).length
}

function nextAttemptNumberFrom(requests: OrgVerificationRequest[], orgId: string): number {
  return Math.min(countAttemptsForOrg(requests, orgId) + 1, MAX_ORG_VERIFICATION_ATTEMPTS)
}

export function getOrgVerificationAttemptCount(orgId: string): number {
  const raw = readJson<OrgVerificationRequest[]>(REQUESTS_KEY, [])
  const migrated = migrateGlobalCounterToPerOrgAttempts(raw)
  return countAttemptsForOrg(migrated, orgId)
}

export function canSubmitOrgVerification(orgId: string): boolean {
  return getOrgVerificationAttemptCount(orgId) < MAX_ORG_VERIFICATION_ATTEMPTS
}

function hasPendingRequest(requests: OrgVerificationRequest[], orgId: string): boolean {
  return requests.some((r) => r.orgId === orgId && r.status === 'pending')
}

function backfillMissingRequests(requests: OrgVerificationRequest[]): OrgVerificationRequest[] {
  let next = [...requests]
  let changed = false

  for (const org of getOrganizations()) {
    const status = org.approvalStatus ?? 'pending'
    if (status !== 'pending') continue
    if (hasPendingRequest(next, org.id)) continue

    const attemptNumber =
      org.verificationAttemptNumber ??
      org.verificationRequestNumber ??
      nextAttemptNumberFrom(next, org.id)
    if (attemptNumber > MAX_ORG_VERIFICATION_ATTEMPTS) continue

    const submittedAt = org.verificationSubmittedAt ?? org.createdAt
    const entry: OrgVerificationRequest = {
      id: generateId(),
      orgId: org.id,
      orgName: org.name,
      requestNumber: attemptNumber,
      submittedAt,
      status: 'pending',
      submittedBy: org.createdBy,
    }
    next.push(entry)
    changed = true
    syncOrgVerificationFields(org.id, attemptNumber, submittedAt)
  }

  if (changed) {
    saveRequests(sortRequestsChronologically(next))
    return getOrgVerificationRequests()
  }

  return next
}

export function getOrgVerificationRequests(): OrgVerificationRequest[] {
  const raw = readJson<OrgVerificationRequest[]>(REQUESTS_KEY, [])
  const migrated = migrateGlobalCounterToPerOrgAttempts(raw)
  return backfillMissingRequests(migrated)
}

function syncOrgVerificationFields(
  orgId: string,
  attemptNumber: number,
  submittedAt: string,
): void {
  const orgs = getOrganizations()
  const idx = orgs.findIndex((o) => o.id === orgId)
  if (idx < 0) return
  orgs[idx] = {
    ...orgs[idx],
    verificationAttemptNumber: attemptNumber,
    verificationSubmittedAt: submittedAt,
  }
  try {
    localStorage.setItem('tudu_organizations', JSON.stringify(orgs))
  } catch {
    /* ignore */
  }
}

export function submitOrgVerificationRequest(input: {
  orgId: string
  orgName: string
  submittedBy: string
}): SubmitOrgVerificationResult {
  const requests = getOrgVerificationRequests()
  const existingPending = requests.find((r) => r.orgId === input.orgId && r.status === 'pending')
  if (existingPending) {
    return { ok: true, request: existingPending }
  }

  if (!canSubmitOrgVerification(input.orgId)) {
    return {
      ok: false,
      error: `Maximum verification attempts (${MAX_ORG_VERIFICATION_ATTEMPTS}) reached. Contact TUDU platform support for help.`,
      maxAttemptsReached: true,
    }
  }

  const submittedAt = new Date().toISOString()
  const attemptNumber = nextAttemptNumberFrom(requests, input.orgId)
  const entry: OrgVerificationRequest = {
    id: generateId(),
    orgId: input.orgId,
    orgName: input.orgName.trim(),
    requestNumber: attemptNumber,
    submittedAt,
    status: 'pending',
    submittedBy: input.submittedBy.trim().toLowerCase(),
  }

  requests.push(entry)
  saveRequests(sortRequestsChronologically(requests))
  syncOrgVerificationFields(input.orgId, attemptNumber, submittedAt)

  return { ok: true, request: entry }
}

export function getPendingOrgVerificationCount(): number {
  return getOrgVerificationRequests().filter((r) => r.status === 'pending').length
}

export function getOrgVerificationRequestForOrg(orgId: string): OrgVerificationRequest | undefined {
  const requests = getRequestsForOrg(getOrgVerificationRequests(), orgId)
  if (requests.length === 0) return undefined
  const pending = requests.filter((r) => r.status === 'pending')
  if (pending.length > 0) return pending[pending.length - 1]
  return requests[requests.length - 1]
}

export function getPendingOrgVerificationRequests(): OrgVerificationRequest[] {
  return getOrgVerificationRequests()
    .filter((r) => r.status === 'pending')
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
}

function setRequestStatus(orgId: string, status: OrgVerificationRequestStatus): void {
  const requests = getOrgVerificationRequests()
  const idx = requests.findIndex((r) => r.orgId === orgId && r.status === 'pending')
  if (idx < 0) return
  requests[idx] = { ...requests[idx], status }
  saveRequests(requests)
}

export function approveOrgVerification(orgId: string): void {
  updateOrganizationApproval(orgId, 'approved')
  setRequestStatus(orgId, 'approved')
}

export function rejectOrgVerification(orgId: string): void {
  setRequestStatus(orgId, 'rejected')
}

export function syncRequestStatusFromOrg(orgId: string, approvalStatus: OrgApprovalStatus): void {
  const requests = getOrgVerificationRequests()
  const idx = requests.findIndex(
    (r) => r.orgId === orgId && (r.status === 'pending' || r.status === approvalStatus),
  )
  if (idx < 0) return

  const org = getOrganization(orgId)
  const mapped: OrgVerificationRequestStatus =
    approvalStatus === 'approved'
      ? 'approved'
      : approvalStatus === 'rejected'
        ? 'rejected'
        : 'pending'

  if (requests[idx].status === mapped) return

  requests[idx] = {
    ...requests[idx],
    status: mapped,
    orgName: org?.name ?? requests[idx].orgName,
  }
  saveRequests(requests)
}
