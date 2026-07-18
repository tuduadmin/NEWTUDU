import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BasicsStep from '../../components/create-event/BasicsStep'
import CategoryStep from '../../components/create-event/CategoryStep'
import CreateEventLayout from '../../components/create-event/CreateEventLayout'
import FinalStep from '../../components/create-event/FinalStep'
import ReviewStep from '../../components/create-event/ReviewStep'
import ScheduleStep from '../../components/create-event/ScheduleStep'
import ShareEventModal from '../../components/ShareEventModal'
import GradientButton from '../../components/GradientButton'
import { clearCreateEventDraft, useCreateEventForm } from '../../hooks/useCreateEventForm'
import {
  getCurrentAccount,
  getHostAccount,
  getPostingAs,
  publishHostEvent,
  saveHostEventFromWizard,
  type HostEvent,
} from '../../lib/account'
import { getCurrentUser } from '../../lib/auth'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const account = getCurrentAccount()
  const postingAs = account ? getPostingAs(account) : 'personal'
  const hostAccount = postingAs !== 'personal' ? getHostAccount(postingAs) : null
  const personalName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Me'
  const hostName =
    postingAs === 'personal' ? personalName : (hostAccount?.name ?? 'Your Organization Name')

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
    updateTicketTier,
    addTicketTier,
    removeTicketTier,
    addPhoto,
    removePhoto,
  } = useCreateEventForm(1)

  const [error, setError] = useState('')
  const [shareEvent, setShareEvent] = useState<HostEvent | null>(null)

  const completedSteps = [1, 2, 3, 4].filter((s) => s < step)

  function handleDiscard() {
    if (window.confirm('Discard this event? Your draft will be deleted.')) {
      resetForm()
      navigate('/host')
    }
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
      status: 'draft',
      eventId,
    })
    if (!result.ok || !result.event) {
      setError(result.error ?? 'Could not save draft.')
      return
    }
    setEventId(result.event.id)
    clearCreateEventDraft()
    navigate('/host')
  }

  function handlePublish() {
    if (!user) return
    setError('')

    if (!form.title.trim()) {
      setError('Please add an event title before publishing.')
      goToStep(1)
      return
    }

    const saved = saveHostEventFromWizard({
      form,
      createdBy: user.email,
      hostAccountId: postingAs === 'personal' ? null : postingAs,
      postedAsUserId: postingAs === 'personal' ? user.email : undefined,
      displayName: postingAs === 'personal' ? personalName : undefined,
      status: form.visibility === 'private' ? 'upcoming' : 'draft',
      eventId,
    })

    if (!saved.ok || !saved.event) {
      setError(saved.error ?? 'Could not save event.')
      return
    }

    const savedEvent = saved.event
    setEventId(savedEvent.id)
    clearCreateEventDraft()
    resetForm()

    if (form.visibility === 'private') {
      setShareEvent(savedEvent)
      return
    }

    const published = publishHostEvent(savedEvent.id)
    if (!published.ok) {
      setError(published.error ?? 'Event saved as draft — could not publish.')
      navigate('/host')
      return
    }

    navigate('/discover')
  }

  function handleBack() {
    if (step === 1) {
      navigate('/host')
    } else {
      prevStep()
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return <BasicsStep form={form} updateForm={updateForm} addPhoto={addPhoto} removePhoto={removePhoto} />
      case 2:
        return <ScheduleStep form={form} updateForm={updateForm} />
      case 3:
        return <CategoryStep form={form} updateForm={updateForm} />
      case 4:
        return (
          <FinalStep
            form={form}
            updateForm={updateForm}
            updateTicketTier={updateTicketTier}
            addTicketTier={addTicketTier}
            removeTicketTier={removeTicketTier}
          />
        )
      case 5:
        return (
          <ReviewStep
            form={form}
            updateForm={updateForm}
            hostName={hostName}
            onEditStep={(s) => goToStep(s as 1 | 2 | 3 | 4 | 5)}
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
        completedSteps={completedSteps}
        onBack={handleBack}
        onNext={step < 5 ? nextStep : undefined}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        showNext={step < 5}
        nextLabel={step === 4 ? 'Next' : 'Next'}
        footerExtra={
          step === 5 ? (
            <GradientButton type="button" fullWidth className="rounded-full py-3.5" onClick={handlePublish}>
              Publish Event
            </GradientButton>
          ) : undefined
        }
      >
        {renderStep()}
        {error && <p className="mt-4 text-sm font-semibold text-maroon">{error}</p>}
      </CreateEventLayout>

      <ShareEventModal
        open={!!shareEvent}
        event={shareEvent}
        onClose={() => {
          setShareEvent(null)
          navigate('/host')
        }}
      />
    </>
  )
}
