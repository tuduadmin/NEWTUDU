import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, HeartCrack, X } from 'lucide-react'
import {
  ACCOUNT_DELETION_REASONS,
  getAccountDeletionReasonLabel,
  type AccountDeletionReasonId,
} from '../../lib/accountDeletionRequests'
import { appFieldClass, appTextareaClass } from '../../lib/formFieldClasses'

const DELETE_CONFIRM_WORD = 'DELETE'

type DeleteAccountStep = 'reason' | 'confirm'

export type DeleteAccountConfirmPayload = {
  reasonId: AccountDeletionReasonId
  otherDetail?: string
}

type DeleteAccountConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (payload: DeleteAccountConfirmPayload) => void
}

export default function DeleteAccountConfirmModal({
  open,
  onClose,
  onConfirm,
}: DeleteAccountConfirmModalProps) {
  const titleId = useId()
  const otherDetailId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const otherDetailRef = useRef<HTMLTextAreaElement>(null)
  const [step, setStep] = useState<DeleteAccountStep>('reason')
  const [selectedReasonId, setSelectedReasonId] = useState<AccountDeletionReasonId | null>(null)
  const [otherDetail, setOtherDetail] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const isOtherSelected = selectedReasonId === 'other'
  const otherDetailTrimmed = otherDetail.trim()
  const canContinue =
    Boolean(selectedReasonId) && (!isOtherSelected || otherDetailTrimmed.length > 0)
  const normalizedConfirmText = confirmText.trim().toUpperCase()
  const canDelete = normalizedConfirmText === DELETE_CONFIRM_WORD

  useEffect(() => {
    if (!open) {
      setStep('reason')
      setSelectedReasonId(null)
      setOtherDetail('')
      setConfirmText('')
      return
    }
    if (step === 'confirm') {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
    if (isOtherSelected) {
      const timer = window.setTimeout(() => otherDetailRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
  }, [open, step, isOtherSelected])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleReasonSelect(reasonId: AccountDeletionReasonId) {
    setSelectedReasonId(reasonId)
    if (reasonId !== 'other') {
      setOtherDetail('')
    }
  }

  function handleContinue() {
    if (!canContinue || !selectedReasonId) return
    setStep('confirm')
  }

  function handleBack() {
    setStep('reason')
    setConfirmText('')
  }

  function handleConfirm() {
    if (!canDelete || !selectedReasonId) return
    onConfirm({
      reasonId: selectedReasonId,
      otherDetail: isOtherSelected ? otherDetailTrimmed : undefined,
    })
  }

  const selectedReasonSummary =
    selectedReasonId === 'other' && otherDetailTrimmed
      ? otherDetailTrimmed
      : selectedReasonId
        ? getAccountDeletionReasonLabel(selectedReasonId)
        : null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] bg-black/45 backdrop-blur-sm"
        aria-label="Close delete account confirmation"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed left-1/2 top-1/2 z-[calc(var(--z-modal)+1)] max-h-[min(90vh,720px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-maroon/25 bg-app-elevated p-5 shadow-float"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              step === 'reason' ? 'bg-orange/10 text-orange' : 'bg-maroon/10 text-maroon'
            }`}
          >
            {step === 'reason' ? (
              <HeartCrack size={20} aria-hidden />
            ) : (
              <AlertTriangle size={20} aria-hidden />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brown-muted transition hover:bg-cream-dark hover:text-brown"
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {step === 'reason' ? (
          <>
            <h2 id={titleId} className="font-display text-lg font-extrabold text-brown">
              Sorry to see you go
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brown-muted">
              Before you leave — is there anything we can do to be better? Your feedback helps us
              improve TUDU for everyone still here.
            </p>

            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Why you are deleting your account</legend>
              {ACCOUNT_DELETION_REASONS.map((reason) => {
                const selected = selectedReasonId === reason.id
                return (
                  <div key={reason.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-[14px] border px-3 py-3 transition ${
                        selected
                          ? 'border-orange/45 bg-orange/8'
                          : 'border-app-subtle bg-app-elevated hover:border-orange/25'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delete-reason"
                        value={reason.id}
                        checked={selected}
                        onChange={() => handleReasonSelect(reason.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-orange"
                      />
                      <span className="text-sm font-semibold text-brown">{reason.label}</span>
                    </label>

                    {reason.id === 'other' && selected && (
                      <label className="mt-2 block px-1" htmlFor={otherDetailId}>
                        <span className="text-xs font-semibold text-brown-muted">
                          Tell us a little more
                        </span>
                        <textarea
                          ref={otherDetailRef}
                          id={otherDetailId}
                          value={otherDetail}
                          onChange={(event) => setOtherDetail(event.target.value)}
                          rows={3}
                          placeholder="What could we have done differently?"
                          className={`${appTextareaClass} mt-1.5 w-full`}
                        />
                      </label>
                    )}
                  </div>
                )
              })}
            </fieldset>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[14px] border border-app-subtle bg-app-elevated px-4 py-3 text-sm font-bold text-brown transition hover:border-orange/30"
              >
                Stay on TUDU
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className="rounded-[14px] bg-maroon px-4 py-3 text-sm font-bold text-white transition hover:bg-maroon/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleBack}
              className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-brown-muted transition hover:text-orange"
            >
              <ChevronLeft size={14} aria-hidden />
              Back
            </button>

            <h2 id={titleId} className="font-display text-lg font-extrabold text-brown">
              Delete account permanently?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brown-muted">
              This action is permanent and cannot be undone. Your profile, tickets, saved events,
              preferences, and all account data will be removed from TUDU.
            </p>
            {selectedReasonSummary && (
              <p className="mt-2 rounded-[12px] border border-app-subtle bg-cream/40 px-3 py-2 text-xs text-brown-muted">
                You shared:{' '}
                <span className="font-semibold text-brown">{selectedReasonSummary}</span>
              </p>
            )}
            <p className="mt-2 text-sm font-semibold text-maroon">
              You will lose access immediately and will not be able to recover this account.
            </p>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wide text-brown-muted">
                Type <span className="font-mono text-brown">{DELETE_CONFIRM_WORD}</span> to confirm
              </span>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value.toUpperCase())}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder={DELETE_CONFIRM_WORD}
                className={`${appFieldClass} mt-2 w-full font-mono tracking-widest`}
              />
              {confirmText.trim().length > 0 && !canDelete && (
                <p className="mt-1.5 text-xs font-semibold text-maroon">
                  Type exactly <span className="font-mono">{DELETE_CONFIRM_WORD}</span> to enable
                  deletion.
                </p>
              )}
            </label>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[14px] border border-app-subtle bg-app-elevated px-4 py-3 text-sm font-bold text-brown transition hover:border-orange/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canDelete}
                aria-disabled={!canDelete}
                className={`rounded-[14px] px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed ${
                  canDelete
                    ? 'bg-maroon shadow-md hover:bg-maroon/90 active:scale-[0.98]'
                    : 'bg-maroon/35 opacity-60'
                }`}
              >
                Delete account permanently
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
