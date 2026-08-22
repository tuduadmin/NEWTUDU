import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, RotateCcw, Trash2 } from 'lucide-react'
import DeleteAccountConfirmModal from '../../components/settings/DeleteAccountConfirmModal'
import SettingsLayout, {
  SettingsCard,
  SettingsSectionTitle,
} from '../../components/settings/SettingsLayout'
import {
  resetLocalUserDataForSignupTest,
  signupTestResetConfirmMessage,
} from '../../lib/resetLocalUserData'
import { resetUserLocalData } from '../../lib/userSettings'
import { getCurrentUser, signOut } from '../../lib/auth'
import { recordAccountDeletionRequest } from '../../lib/accountDeletionRequests'
import type { DeleteAccountConfirmPayload } from '../../components/settings/DeleteAccountConfirmModal'

export default function MyTuduAppSettingsPage() {
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  function handleRetakeQuiz() {
    navigate('/onboarding/interests')
  }

  function handleSignupTestReset() {
    if (!window.confirm(signupTestResetConfirmMessage())) return
    resetLocalUserDataForSignupTest()
    navigate('/signup', { replace: true })
  }

  function handleDeleteAccountConfirmed({ reasonId, otherDetail }: DeleteAccountConfirmPayload) {
    const user = getCurrentUser()
    if (user) {
      recordAccountDeletionRequest({ userEmail: user.email, reasonId, otherDetail })
    }
    resetUserLocalData()
    signOut()
    setShowDeleteModal(false)
    navigate('/signin', { replace: true })
  }

  return (
    <SettingsLayout title="App Settings" showTitle={false}>
      <div>
        <SettingsSectionTitle>App</SettingsSectionTitle>
        <div className="mt-2 space-y-2">
          <SettingsCard>
            <button
              type="button"
              onClick={handleRetakeQuiz}
              className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-cream/60"
            >
              <span className="text-sm font-semibold text-brown">Retake Interests Quiz</span>
              <RotateCcw size={18} className="text-brown-muted" />
            </button>
          </SettingsCard>
          <SettingsCard>
            <button
              type="button"
              onClick={handleSignupTestReset}
              className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-cream/60"
            >
              <span className="text-sm font-semibold text-orange">
                Clear local data (signup test)
              </span>
              <Trash2 size={18} className="text-orange" />
            </button>
          </SettingsCard>
        </div>
      </div>

      <div>
        <SettingsSectionTitle>Account</SettingsSectionTitle>
        <div className="mt-2 space-y-2">
          <SettingsCard>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-cream/60"
            >
              <span className="text-sm font-semibold text-maroon">Delete Account</span>
              <LogOut size={18} className="text-maroon" />
            </button>
          </SettingsCard>
        </div>
      </div>

      <DeleteAccountConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccountConfirmed}
      />
    </SettingsLayout>
  )
}
