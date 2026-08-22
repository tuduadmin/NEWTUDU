const LEGAL_DOCS_KEY = 'tudu-legal-docs'

export type LegalDocType = 'privacy' | 'cookie' | 'terms'

export type LegalContentFormat = 'text' | 'html' | 'markdown'

export interface LegalDocVersion {
  version: number
  content: string
  format: LegalContentFormat
  updatedAt: string
  updatedBy: string
  changeNotes?: string
  published: boolean
  publishedAt?: string
}

export interface LegalDocState {
  docType: LegalDocType
  publishedVersion: number | null
  versions: LegalDocVersion[]
  draftContent: string
  draftFormat: LegalContentFormat
}

export interface LegalChangelogEntry {
  id: string
  docType: LegalDocType
  docLabel: string
  version: number
  updatedAt: string
  updatedBy: string
  changeNotes?: string
  action: 'published' | 'draft_saved'
}

export interface LegalDocsStore {
  docs: Record<LegalDocType, LegalDocState>
  changelog: LegalChangelogEntry[]
}

export const LEGAL_DOC_META: Record<
  LegalDocType,
  { label: string; consumerRoute: string; description: string }
> = {
  privacy: {
    label: 'Privacy Policy',
    consumerRoute: '/privacy',
    description: 'How TUDU collects, uses, and protects personal data.',
  },
  cookie: {
    label: 'Cookie Policy',
    consumerRoute: '/cookie-policy',
    description: 'Cookies and similar technologies on tudu.ca.',
  },
  terms: {
    label: 'Terms of Service',
    consumerRoute: '/terms',
    description: 'Binding agreement for using the TUDU platform.',
  },
}

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
  return `legal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyDocState(docType: LegalDocType): LegalDocState {
  return {
    docType,
    publishedVersion: null,
    versions: [],
    draftContent: '',
    draftFormat: 'text',
  }
}

function defaultStore(): LegalDocsStore {
  return {
    docs: {
      privacy: emptyDocState('privacy'),
      cookie: emptyDocState('cookie'),
      terms: emptyDocState('terms'),
    },
    changelog: [],
  }
}

export function getLegalDocsStore(): LegalDocsStore {
  const store = readJson<LegalDocsStore>(LEGAL_DOCS_KEY, defaultStore())
  for (const type of Object.keys(LEGAL_DOC_META) as LegalDocType[]) {
    if (!store.docs[type]) store.docs[type] = emptyDocState(type)
  }
  return store
}

function persistStore(store: LegalDocsStore): void {
  writeJson(LEGAL_DOCS_KEY, store)
}

export function getLegalDocState(docType: LegalDocType): LegalDocState {
  return getLegalDocsStore().docs[docType]
}

export function getPublishedLegalDoc(
  docType: LegalDocType,
): { content: string; format: LegalContentFormat; version: number; updatedAt: string } | null {
  const state = getLegalDocState(docType)
  if (state.publishedVersion == null) return null
  const version = state.versions.find((v) => v.version === state.publishedVersion && v.published)
  if (!version) return null
  return {
    content: version.content,
    format: version.format,
    version: version.version,
    updatedAt: version.publishedAt ?? version.updatedAt,
  }
}

export function getLegalVersionHistory(docType: LegalDocType): LegalDocVersion[] {
  return [...getLegalDocState(docType).versions].sort((a, b) => b.version - a.version)
}

export function getLegalChangelog(limit = 50): LegalChangelogEntry[] {
  return getLegalDocsStore()
    .changelog.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
}

export function detectFormatFromFilename(filename: string): LegalContentFormat {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html'
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
  return 'text'
}

export function saveLegalDraft(input: {
  docType: LegalDocType
  content: string
  format: LegalContentFormat
  adminEmail: string
}): LegalDocVersion {
  const store = getLegalDocsStore()
  const state = store.docs[input.docType]
  const nextVersion =
    state.versions.length > 0 ? Math.max(...state.versions.map((v) => v.version)) + 1 : 1

  const version: LegalDocVersion = {
    version: nextVersion,
    content: input.content,
    format: input.format,
    updatedAt: new Date().toISOString(),
    updatedBy: input.adminEmail,
    published: false,
  }

  state.draftContent = input.content
  state.draftFormat = input.format
  state.versions.push(version)

  store.changelog.unshift({
    id: generateId(),
    docType: input.docType,
    docLabel: LEGAL_DOC_META[input.docType].label,
    version: nextVersion,
    updatedAt: version.updatedAt,
    updatedBy: input.adminEmail,
    action: 'draft_saved',
  })

  persistStore(store)
  return version
}

export function publishLegalDoc(input: {
  docType: LegalDocType
  adminEmail: string
  changeNotes?: string
  content?: string
  format?: LegalContentFormat
}): LegalDocVersion | null {
  const store = getLegalDocsStore()
  const state = store.docs[input.docType]

  let version: LegalDocVersion | undefined

  if (input.content != null) {
    version = saveLegalDraft({
      docType: input.docType,
      content: input.content,
      format: input.format ?? state.draftFormat,
      adminEmail: input.adminEmail,
    })
    state.versions = getLegalDocState(input.docType).versions
    version = state.versions[state.versions.length - 1]
  } else if (state.draftContent.trim()) {
    const nextVersion =
      state.versions.length > 0 ? Math.max(...state.versions.map((v) => v.version)) + 1 : 1
    version = {
      version: nextVersion,
      content: state.draftContent,
      format: state.draftFormat,
      updatedAt: new Date().toISOString(),
      updatedBy: input.adminEmail,
      changeNotes: input.changeNotes,
      published: false,
    }
    state.versions.push(version)
  } else {
    version = state.versions[state.versions.length - 1]
  }

  if (!version) return null

  const publishedAt = new Date().toISOString()
  version.published = true
  version.publishedAt = publishedAt
  version.changeNotes = input.changeNotes?.trim() || version.changeNotes
  state.publishedVersion = version.version

  store.changelog.unshift({
    id: generateId(),
    docType: input.docType,
    docLabel: LEGAL_DOC_META[input.docType].label,
    version: version.version,
    updatedAt: publishedAt,
    updatedBy: input.adminEmail,
    changeNotes: input.changeNotes?.trim(),
    action: 'published',
  })

  persistStore(store)
  return version
}

export function loadLegalDraftFromVersion(docType: LegalDocType, versionNumber: number): boolean {
  const store = getLegalDocsStore()
  const state = store.docs[docType]
  const version = state.versions.find((v) => v.version === versionNumber)
  if (!version) return false
  state.draftContent = version.content
  state.draftFormat = version.format
  persistStore(store)
  return true
}
