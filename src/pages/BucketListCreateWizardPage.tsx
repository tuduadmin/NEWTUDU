import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CreateBucketListLayout from '../components/bucket-list/CreateBucketListLayout'
import BucketListBasicsStep from '../components/bucket-list/BucketListBasicsStep'
import BucketListItemsStep from '../components/bucket-list/BucketListItemsStep'
import GradientButton from '../components/GradientButton'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import Toast from '../components/Toast'
import VibeBadge from '../components/VibeBadge'
import { getCurrentUser } from '../lib/auth'
import { PROFILE_STORAGE_QUOTA_MESSAGE } from '../lib/imageCompress'
import {
  bucketListToPublic,
  canUserEditBucketList,
  deleteBucketList,
  getBucketListById,
  publishBucketList,
  startBucketListCreate,
  updateBucketList,
} from '../lib/bucketLists'
import {
  bucketListStepIdFromNumber,
  bucketListStepNumberFromId,
  getBucketListItemCount,
  isBucketListBasicsComplete,
  type BucketListWizardStep,
} from '../lib/bucketListWizard'

export default function BucketListCreateWizardPage() {
  const navigate = useNavigate()
  const { listId, stepId } = useParams<{ listId?: string; stepId?: string }>()
  const user = getCurrentUser()
  const [refresh, setRefresh] = useState(0)
  const [visitedSteps, setVisitedSteps] = useState<Set<BucketListWizardStep>>(new Set([1]))
  const [toast, setToast] = useState<string | null>(null)

  const step = bucketListStepNumberFromId(stepId)

  useEffect(() => {
    if (!user) {
      navigate('/signin')
      return
    }
    if (!listId) {
      const created = startBucketListCreate((path) => navigate(path), user)
      if (!created) {
        setToast('Could not start a new list. Free some browser storage and try again.')
      }
      return
    }
    if (!stepId) {
      navigate(`/bucket-list/create/${listId}/details`, { replace: true })
    }
  }, [user, listId, stepId, navigate])

  useEffect(() => {
    setVisitedSteps((prev) => new Set(prev).add(step))
  }, [step])

  const list = useMemo(() => {
    void refresh
    return listId ? getBucketListById(listId) : undefined
  }, [listId, refresh])

  useEffect(() => {
    if (!user || !list) return
    if (!canUserEditBucketList(list, user.email)) {
      navigate(`/bucket-list/${list.id}?from=mine`, { replace: true })
    }
  }, [user, list, navigate])

  const isEditing = Boolean(list && list.isDraft !== true)

  function reload() {
    setRefresh((n) => n + 1)
  }

  function goToStep(next: BucketListWizardStep) {
    if (!listId) return
    navigate(`/bucket-list/create/${listId}/${bucketListStepIdFromNumber(next)}`)
  }

  function leaveWizard() {
    if (!list) {
      navigate('/bucket-list')
      return
    }
    if (list.isDraft === true) {
      const message = isBucketListBasicsComplete(list.name)
        ? 'Leave without saving? Your draft will be discarded.'
        : 'Discard this draft?'
      if (!window.confirm(message)) return
      deleteBucketList(list.id)
    }
    navigate('/bucket-list')
  }

  function handleBack() {
    if (step === 1) {
      leaveWizard()
      return
    }
    goToStep((step - 1) as BucketListWizardStep)
  }

  function handleNext() {
    if (step === 1) goToStep(2)
    else if (step === 2) goToStep(3)
  }

  function handleUpdateBasics(partial: Parameters<typeof updateBucketList>[1]): boolean {
    if (!list) return false
    const updated = updateBucketList(list.id, partial)
    if (!updated) {
      setToast(PROFILE_STORAGE_QUOTA_MESSAGE)
      return false
    }
    reload()
    return true
  }

  function handleDiscard() {
    if (!list) return
    if (window.confirm('Discard this bucket list?')) {
      deleteBucketList(list.id)
      navigate('/bucket-list')
    }
  }

  function handleFinish() {
    if (!list) return
    if (!isBucketListBasicsComplete(list.name)) {
      goToStep(1)
      return
    }
    const saved = publishBucketList(list.id)
    if (!saved) {
      setToast(PROFILE_STORAGE_QUOTA_MESSAGE)
      return
    }
    navigate(`/bucket-list/${list.id}?from=mine`)
  }

  if (!user) return null

  if (!listId || !stepId || !list) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo="/bucket-list" />
        <main className="px-4 pt-16 text-center text-sm text-brown-muted">
          Opening bucket list editor…
        </main>
        <BottomNav />
      </div>
    )
  }

  const basicsComplete = isBucketListBasicsComplete(list.name)
  const itemCount = getBucketListItemCount(list)
  const heroUrl = list.coverImageUrl?.trim() || ''
  const publicPreview = bucketListToPublic(list)

  return (
    <>
      <CreateBucketListLayout
        step={step}
        list={list}
        isEditing={isEditing}
        visitedSteps={visitedSteps}
        onStepClick={goToStep}
        onBack={handleBack}
        onNext={step < 3 ? handleNext : undefined}
        onDiscard={handleDiscard}
        onLeaveHub={leaveWizard}
        nextLabel={step === 2 ? 'Review' : 'Next'}
        showNext={step < 3}
        nextDisabled={step === 1 && !basicsComplete}
      >
        {step === 1 && <BucketListBasicsStep list={list} onUpdate={handleUpdateBasics} />}

        {step === 2 && (
          <BucketListItemsStep list={list} userEmail={user.email} onRefresh={reload} />
        )}

        {step === 3 && (
          <section className="space-y-4 pt-3">
            {heroUrl && (
              <div className="overflow-hidden rounded-[14px] border border-app-subtle shadow-sm">
                <img src={heroUrl} alt="" className="aspect-[2/1] w-full object-cover" />
              </div>
            )}
            <div className="rounded-[14px] border border-app-subtle bg-app-elevated p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-base font-bold text-brown">{list.name}</p>
                {list.vibe && <VibeBadge vibe={list.vibe} />}
              </div>
              {list.description?.trim() && (
                <p className="mt-2 text-sm text-brown-muted">{list.description}</p>
              )}
              <p className="mt-2 text-xs text-brown-muted">
                {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
                {list.isPrivate ? 'Private' : 'Public on Explore'}
              </p>
              {(list.spotifyUrl || list.appleMusicUrl) && (
                <p className="mt-2 text-xs text-brown-muted">Includes playlist links</p>
              )}
            </div>
            {publicPreview && !list.isPrivate && list.isDraft === true && (
              <p className="text-sm text-brown-muted">
                Tap save below to add this list to My lists and Explore.
              </p>
            )}
            <GradientButton type="button" fullWidth className="py-3.5" onClick={handleFinish}>
              Save bucket list
            </GradientButton>
          </section>
        )}
      </CreateBucketListLayout>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
