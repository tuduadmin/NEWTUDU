import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BasicsStep from '../../components/create-event/BasicsStep'
import CategoryStep from '../../components/create-event/CategoryStep'
import CreateEventLayout from '../../components/create-event/CreateEventLayout'
import FinalStep from '../../components/create-event/FinalStep'
import ReviewStep from '../../components/create-event/ReviewStep'
import ScheduleStep from '../../components/create-event/ScheduleStep'
import ShareEventModal from '../../components/ShareEventModal'
import PublishSlotBlockSheet from '../../components/create-event/PublishSlotBlockSheet'
import HostAddSlotsLink from '../../components/host/HostAddSlotsLink'
import GradientButton from '../../components/GradientButton'
import DepartmentSelector from '../../components/host/DepartmentSelector'
import PostAsSelector from '../../components/host/PostAsSelector'
import { useCreateEventForm } from '../../hooks/useCreateEventForm'
import {
  clearCreateEventDraft,
  clearCreateEventSession,
  type CreateEventDraftLoadMode,
} from '../../lib/createEventDraft'
import { useHostContext } from '../../hooks/useHostContext'
import { recordRecentVenue } from '../../lib/recentVenues'
import Toast from '../../components/Toast'
import {
  getFirstIncompleteStep,
  getPublishBlockMessage,
} from '../../lib/createEventValidation'
import {
  countFormScheduleDays,
  getEventSlotBudget,
  getEventSlotPublishBlock,
  type EventSlotBudget,
} from '../../lib/eventSlotBudget'
import {
  getHostAccount,
  getHostEventById,
  getSeedApprovalStatus,
  hostEventToFormData,
  publishHostEvent,
  saveHostEventFromWizard,
  ensureAccount,
  canCreatePublicEvent,
  type HostEvent,
} from '../../lib/account'
import { resolvePrivateInviteEmails } from '../../lib/shareLists'
import { sendPrivateEventShare } from '../../lib/sharePublish'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editEventId = searchParams.get('edit')
  const draftMode: CreateEventDraftLoadMode = editEventId
    ? 'fresh'
    : searchParams.get('new') === '1'
      ? 'fresh'
      : searchParams.get('resume') === '1'
        ? 'resume'
        : 'default'
  const { context, personalName, setHostContext, user, canUsePersonalMode } = useHostContext()
  const postingAs = context
  const hostAccount = postingAs !== 'personal' ? getHostAccount(postingAs) : null
  const hostName =
    postingAs === 'personal' ? personalName : (hostAccount?.name ?? 'Your Organization Name')
  const account = user ? ensureAccount(user.email) : null
  const hostAccountId = postingAs === 'personal' ? null : postingAs
  const isPhoneVerified = account?.verificationStatus === 'phone_verified'
  const publicCheck = account ? canCreatePublicEvent(account, hostAccountId) : null

  const {
    step,
    form,
    eventId,
    setEventId,
    updateForm,
    resetForm,
    goToStep,
    nextStep,
    prevStep,
    visitedSteps,
    updateSessionCapacity,
    updateSessionTier,
    addSessionTier,
    removeSessionTier,
    setSessionTiersLocked,
    loadFromEvent,
  } = useCreateEventForm(draftMode)

  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [shareEvent, setShareEvent] = useState<HostEvent | null>(null)
  const [sharePublishedJustNow, setSharePublishedJustNow] = useState(false)
  const [departmentId, setDepartmentId] = useState('')
  const [editLoaded, setEditLoaded] = useState(false)
  const [slotBlockOpen, setSlotBlockOpen] = useState(false)
  const [slotBlock, setSlotBlock] = useState<{ budget: EventSlotBudget; message: string } | null>(
    null,
  )

  const draftDays = countFormScheduleDays(form)
  const slotBudget = account
    ? getEventSlotBudget(account, {
        visibility: form.visibility,
        hostAccountId,
        draftDays,
        excludeEventId: eventId,
      })
    : null

  useEffect(() => {
    if (error && !getPublishBlockMessage(form)) {
      setError('')
    }
  }, [form, error])

  useEffect(() => {
    if (!editEventId || editLoaded || !user) return
    const event = getHostEventById(editEventId)
    if (!event?.seededByAdmin || getSeedApprovalStatus(event) !== 'approved') {
      setError('This event cannot be edited.')
      return
    }
    if (event.createdBy.toLowerCase() !== user.email.toLowerCase()) {
      setError('You do not have permission to edit this event.')
      return
    }
    if (event.hostAccountId) {
      setHostContext(event.hostAccountId)
    } else if (canUsePersonalMode) {
      setHostContext('personal')
    }
    setDepartmentId(event.departmentId ?? '')
    loadFromEvent(hostEventToFormData(event), event.id)
    setEditLoaded(true)
  }, [editEventId, editLoaded, user, loadFromEvent, setHostContext, canUsePersonalMode])

  function handlePostingAsChange(value: 'personal' | string) {
    if (value === 'personal' && !canUsePersonalMode) return
    setHostContext(value)
    setDepartmentId('')
  }

  function handleDiscard() {
    if (window.confirm('Discard this event? Your draft will be deleted.')) {
      resetForm()
      clearCreateEventSession()
      navigate('/host')
    }
  }

  const venueContext = {
    postingAs,
    hostEmail: user?.email ?? '',
  }

  function handleSaveDraft() {
    if (!user) return
    setError('')
    const result = saveHostEventFromWizard({
      form,
      createdBy: user.email,
      hostAccountId: postingAs === 'personal' ? null : postingAs,
      postedAsUserId: postingAs === 'personal' ? user.email : undefined,
      displayName: postingAs === 'personal' ? personalName : undefined,
      departmentId: postingAs === 'personal' ? null : departmentId || null,
      status: 'draft',
      eventId,
    })
    if (!result.ok || !result.event) {
      setError(result.error ?? 'Could not save draft.')
      return
    }
    recordRecentVenue(form, venueContext)
    setEventId(result.event.id)
    clearCreateEventDraft()
    clearCreateEventSession()
    navigate('/host')
  }

  function handlePublish() {
    if (!user || !account) return
    setError('')

    const blockMessage = getPublishBlockMessage(form)
    if (blockMessage) {
      setError(blockMessage)
      setToast(blockMessage)
      const firstIncomplete = getFirstIncompleteStep(form)
      if (firstIncomplete) goToStep(firstIncomplete)
      return
    }

    const slotPublishBlock = getEventSlotPublishBlock(form, account, hostAccountId, eventId)
    if (slotPublishBlock) {
      setSlotBlock(slotPublishBlock)
      setSlotBlockOpen(true)
      return
    }

    const saved = saveHostEventFromWizard({
      form,
      createdBy: user.email,
      hostAccountId: postingAs === 'personal' ? null : postingAs,
      postedAsUserId: postingAs === 'personal' ? user.email : undefined,
      displayName: postingAs === 'personal' ? personalName : undefined,
      departmentId: postingAs === 'personal' ? null : departmentId || null,
      status: form.visibility === 'private' ? 'upcoming' : 'draft',
      eventId,
    })

    if (!saved.ok || !saved.event) {
      setError(saved.error ?? 'Could not save event.')
      return
    }

    recordRecentVenue(form, venueContext)

    const savedEvent = saved.event
    setEventId(savedEvent.id)
    clearCreateEventDraft()
    clearCreateEventSession()
    resetForm()

    if (form.visibility === 'private') {
      const recipients = resolvePrivateInviteEmails(
        form.privateInviteEmails,
        form.privateShareListIds,
      )
      if (recipients.length > 0) {
        sendPrivateEventShare({
          event: savedEvent,
          recipientEmails: recipients,
          fromEmail: user.email,
        })
      }
      setSharePublishedJustNow(true)
      setShareEvent(savedEvent)
      return
    }

    const published = publishHostEvent(savedEvent.id)
    if (!published.ok) {
      setError(published.error ?? 'Event saved as draft - could not publish.')
      navigate('/host')
      return
    }

    setSharePublishedJustNow(true)
    setShareEvent(published.event ?? savedEvent)
  }

  function handleBack() {
    if (step === 1) {
      clearCreateEventSession()
      navigate('/host')
    } else {
      prevStep()
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return <BasicsStep form={form} updateForm={updateForm} venueContext={venueContext} />
      case 2:
        return <CategoryStep form={form} updateForm={updateForm} />
      case 3:
        return <ScheduleStep form={form} updateForm={updateForm} slotBudget={slotBudget} />
      case 4:
        return (
          <FinalStep
            form={form}
            updateForm={updateForm}
            updateSessionCapacity={updateSessionCapacity}
            updateSessionTier={updateSessionTier}
            addSessionTier={addSessionTier}
            removeSessionTier={removeSessionTier}
            setSessionTiersLocked={setSessionTiersLocked}
          />
        )
      case 5:
        return (
          <ReviewStep
            form={form}
            updateForm={updateForm}
            hostName={hostName}
            onEditStep={(s) => goToStep(s as 1 | 2 | 3 | 4 | 5)}
            slotBudget={slotBudget}
            isPhoneVerified={isPhoneVerified}
            publicCheck={publicCheck}
            hasHostAccount={hostAccountId != null}
            hostAccountId={hostAccountId}
            createdBy={user?.email ?? ''}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <CreateEventLayout
        step={step}
        form={form}
        visitedSteps={visitedSteps}
        onStepClick={goToStep}
        onBack={handleBack}
        onNext={step < 5 ? nextStep : undefined}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        showNext={step < 5}
        nextLabel={step === 4 ? 'Next' : 'Next'}
        footerExtra={
          step === 5 ? (
            <GradientButton type="button" fullWidth className="rounded-[14px] py-3.5" onClick={handlePublish}>
              Publish Event
            </GradientButton>
          ) : undefined
        }
      >
        {step === 1 && (
          <>
            <PostAsSelector value={postingAs} onChange={handlePostingAsChange} />
            {postingAs !== 'personal' && (
              <DepartmentSelector
                orgId={postingAs}
                value={departmentId}
                onChange={setDepartmentId}
              />
            )}
          </>
        )}
        {renderStep()}
        {error && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-maroon">{error}</p>
            {error.includes('Upgrade for more') && (
              <p className="mt-1">
                <HostAddSlotsLink prominent />
              </p>
            )}
          </div>
        )}
      </CreateEventLayout>

      <ShareEventModal
        open={!!shareEvent}
        event={shareEvent}
        publishedJustNow={sharePublishedJustNow}
        onClose={() => {
          const wasPublic = shareEvent?.visibility === 'public'
          setShareEvent(null)
          setSharePublishedJustNow(false)
          navigate(wasPublic ? '/discover' : '/host')
        }}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} duration={5000} />}

      {slotBlock && (
        <PublishSlotBlockSheet
          open={slotBlockOpen}
          message={slotBlock.message}
          budget={slotBlock.budget}
          onClose={() => setSlotBlockOpen(false)}
          onEditSchedule={() => {
            setSlotBlockOpen(false)
            goToStep(2)
          }}
          onSaveDraft={() => {
            setSlotBlockOpen(false)
            handleSaveDraft()
          }}
        />
      )}
    </>
  )
}
