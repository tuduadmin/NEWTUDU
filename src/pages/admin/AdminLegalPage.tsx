import { useMemo, useRef, useState } from 'react'
import { ExternalLink, FileUp, History, Save, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AdminBadge,
  AdminButton,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from '../../components/admin/AdminUI'
import { getCurrentUser } from '../../lib/auth'
import {
  detectFormatFromFilename,
  getLegalChangelog,
  getLegalDocState,
  getLegalVersionHistory,
  getPublishedLegalDoc,
  LEGAL_DOC_META,
  loadLegalDraftFromVersion,
  publishLegalDoc,
  saveLegalDraft,
  type LegalContentFormat,
  type LegalDocType,
} from '../../lib/legalDocs'

const DOC_TYPES: LegalDocType[] = ['privacy', 'cookie', 'terms']

export default function AdminLegalPage() {
  const admin = getCurrentUser()
  const [activeDoc, setActiveDoc] = useState<LegalDocType>('privacy')
  const [draftContent, setDraftContent] = useState(() => getLegalDocState('privacy').draftContent)
  const [draftFormat, setDraftFormat] = useState<LegalContentFormat>(
    () => getLegalDocState('privacy').draftFormat,
  )
  const [changeNotes, setChangeNotes] = useState('')
  const [message, setMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const docState = useMemo(() => getLegalDocState(activeDoc), [activeDoc, refreshKey])
  const published = useMemo(() => getPublishedLegalDoc(activeDoc), [activeDoc, refreshKey])
  const history = useMemo(() => getLegalVersionHistory(activeDoc), [activeDoc, refreshKey])
  const changelog = useMemo(() => getLegalChangelog(30), [refreshKey])
  const meta = LEGAL_DOC_META[activeDoc]

  function switchDoc(docType: LegalDocType) {
    setActiveDoc(docType)
    const state = getLegalDocState(docType)
    setDraftContent(state.draftContent)
    setDraftFormat(state.draftFormat)
    setChangeNotes('')
    setMessage('')
  }

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  function handleSaveDraft() {
    if (!admin?.email) return
    if (!draftContent.trim()) {
      setMessage('Add content before saving.')
      return
    }
    saveLegalDraft({
      docType: activeDoc,
      content: draftContent,
      format: draftFormat,
      adminEmail: admin.email,
    })
    setMessage('Draft saved to version history.')
    refresh()
  }

  function handlePublish() {
    if (!admin?.email) return
    if (!draftContent.trim()) {
      setMessage('Add content before publishing.')
      return
    }
    publishLegalDoc({
      docType: activeDoc,
      adminEmail: admin.email,
      changeNotes,
      content: draftContent,
      format: draftFormat,
    })
    setMessage(`${meta.label} v${docState.versions.length + 1} is now live.`)
    setChangeNotes('')
    refresh()
  }

  function handleFileUpload(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setDraftContent(text)
      setDraftFormat(detectFormatFromFilename(file.name))
      setMessage(`Loaded ${file.name}`)
    }
    reader.readAsText(file)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        title="Legal Documents"
        subtitle="Upload, version, and publish Privacy Policy, Cookie Policy, and Terms of Service."
        actions={
          <Link
            to={meta.consumerRoute}
            target="_blank"
            className="admin-btn admin-btn-ghost no-underline"
          >
            <ExternalLink size={14} />
            View live page
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1 border-b border-[var(--admin-border)] pb-2">
        {DOC_TYPES.map((type) => {
          const docMeta = LEGAL_DOC_META[type]
          const live = getPublishedLegalDoc(type)
          return (
            <button
              key={type}
              type="button"
              onClick={() => switchDoc(type)}
              className={`rounded-[var(--admin-radius)] px-3 py-1.5 text-xs font-semibold transition ${
                activeDoc === type
                  ? 'bg-[var(--admin-accent-muted)] text-[var(--admin-accent)]'
                  : 'text-[var(--admin-text-muted)] hover:bg-white/[0.03] hover:text-[var(--admin-text)]'
              }`}
            >
              {docMeta.label}
              {live && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-[1px] bg-[var(--admin-success)]" />
              )}
            </button>
          )
        })}
      </div>

      {message && (
        <AdminPanel className="mb-4 border-[var(--admin-accent)]/30 bg-[var(--admin-accent-muted)]">
          <p className="text-xs text-[var(--admin-accent)]">{message}</p>
        </AdminPanel>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AdminPanel className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="admin-label">{meta.label}</p>
                <p className="text-[11px] text-[var(--admin-text-dim)]">{meta.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {published ? (
                  <AdminBadge tone="emerald">Live v{published.version}</AdminBadge>
                ) : (
                  <AdminBadge tone="amber">Not published</AdminBadge>
                )}
                <AdminBadge tone="neutral">{meta.consumerRoute}</AdminBadge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="admin-label">Content format</span>
                <AdminSelect
                  className="mt-1"
                  value={draftFormat}
                  onChange={(e) => setDraftFormat(e.target.value as LegalContentFormat)}
                >
                  <option value="text">Plain text (.txt)</option>
                  <option value="markdown">Markdown (.md)</option>
                  <option value="html">HTML (.html)</option>
                </AdminSelect>
              </label>
              <label className="block">
                <span className="admin-label">Upload file</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.markdown,.html,.htm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ''
                  }}
                />
                <AdminButton
                  type="button"
                  variant="secondary"
                  className="mt-1 w-full"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp size={14} />
                  Choose .md / .html / .txt
                </AdminButton>
              </label>
            </div>

            <label className="block">
              <span className="admin-label">Document content</span>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={16}
                placeholder="Paste legal document content here…"
                className="admin-input mt-1 min-h-[280px] resize-y font-mono text-[11px] leading-relaxed"
              />
            </label>

            <label className="block">
              <span className="admin-label">Change notes (optional)</span>
              <AdminInput
                className="mt-1"
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="e.g. Updated PIPEDA contact section"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <AdminButton type="button" variant="secondary" onClick={handleSaveDraft}>
                <Save size={14} />
                Save draft
              </AdminButton>
              <AdminButton type="button" variant="primary" onClick={handlePublish}>
                <Send size={14} />
                Publish live
              </AdminButton>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="mb-3 flex items-center gap-2">
              <History size={14} className="text-[var(--admin-text-dim)]" />
              <p className="admin-label">Version history — {meta.label}</p>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--admin-text-dim)]">No versions yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((version) => (
                  <li
                    key={version.version}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--admin-radius)] border border-[var(--admin-border-subtle)] px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[var(--admin-text)]">
                        v{version.version}
                        {version.published ? (
                          <span className="ml-1.5">
                            <AdminBadge tone="emerald">LIVE</AdminBadge>
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[10px] text-[var(--admin-text-dim)]">
                        {new Date(version.updatedAt).toLocaleString()} · {version.updatedBy}
                      </p>
                      {version.changeNotes && (
                        <p className="mt-0.5 text-[10px] text-[var(--admin-text-muted)]">
                          {version.changeNotes}
                        </p>
                      )}
                    </div>
                    <AdminButton
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        loadLegalDraftFromVersion(activeDoc, version.version)
                        setDraftContent(version.content)
                        setDraftFormat(version.format)
                        setMessage(`Loaded v${version.version} into editor.`)
                      }}
                    >
                      Load
                    </AdminButton>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>

        <div className="space-y-4">
          <AdminPanel>
            <p className="admin-label mb-3">Changelog — all legal docs</p>
            {changelog.length === 0 ? (
              <p className="text-xs text-[var(--admin-text-dim)]">No updates yet.</p>
            ) : (
              <ol className="relative space-y-0 border-l border-[var(--admin-border)] pl-4">
                {changelog.map((entry) => (
                  <li key={entry.id} className="relative pb-4 last:pb-0">
                    <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-[1px] bg-[var(--admin-accent)]" />
                    <p className="text-xs font-semibold text-[var(--admin-text)]">
                      {entry.docLabel} v{entry.version}
                      <span className="ml-1.5 font-normal text-[var(--admin-text-dim)]">
                        {entry.action === 'published' ? 'published' : 'draft saved'}
                      </span>
                    </p>
                    <time className="text-[10px] text-[var(--admin-text-dim)]">
                      {new Date(entry.updatedAt).toLocaleString()}
                    </time>
                    <p className="text-[10px] text-[var(--admin-text-muted)]">{entry.updatedBy}</p>
                    {entry.changeNotes && (
                      <p className="mt-0.5 text-[10px] italic text-[var(--admin-text-dim)]">
                        {entry.changeNotes}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </AdminPanel>

          <AdminPanel>
            <p className="admin-label mb-2">Consumer routes</p>
            <ul className="space-y-1.5 text-xs">
              {DOC_TYPES.map((type) => (
                <li key={type}>
                  <Link
                    to={LEGAL_DOC_META[type].consumerRoute}
                    target="_blank"
                    className="text-[var(--admin-accent)] no-underline hover:underline"
                  >
                    {LEGAL_DOC_META[type].consumerRoute}
                  </Link>
                  <span className="text-[var(--admin-text-dim)]"> — {LEGAL_DOC_META[type].label}</span>
                </li>
              ))}
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
