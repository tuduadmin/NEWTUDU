import { useMemo } from 'react'
import { X } from 'lucide-react'
import PublicProfileMerchBar from './PublicProfileMerchBar'
import PublicProfileSocialBar from './PublicProfileSocialBar'
import PublicProfileHeader from './PublicProfileHeader'
import PublicProfileHero from './PublicProfileHero'
import {
  buildHostProfilePreviewFromForm,
  type HostProfileFormPreviewInput,
} from '../../lib/hostProfileForm'

type HostProfilePreviewOverlayProps = {
  open: boolean
  onClose: () => void
  form: HostProfileFormPreviewInput | null
}

export default function HostProfilePreviewOverlay({
  open,
  onClose,
  form,
}: HostProfilePreviewOverlayProps) {
  const profile = useMemo(
    () => (form ? buildHostProfilePreviewFromForm(form) : null),
    [form],
  )

  if (!open || !profile) return null

  return (
    <div
      className="host-profile-preview app-page-shell fixed inset-0 z-[var(--z-modal,60)] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Profile preview"
    >
      <div className="glass-surface mx-auto flex w-full max-w-lg items-center justify-between border-b border-app-subtle px-4 py-3">
        <p className="text-sm font-semibold text-brown">Preview — unsaved changes</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-app-subtle bg-app-elevated text-brown-muted transition hover:border-orange/30 hover:text-brown"
          aria-label="Close preview"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 overflow-y-auto pb-8">
        <article className="app-surface-card mx-4 mt-4 overflow-hidden">
          <PublicProfileHero
            displayName={profile.displayName}
            galleryImages={profile.galleryImages}
            avatarUrl={profile.avatarUrl}
            variant={profile.kind}
          />
          <div className="px-4 pb-4 pt-4">
            <PublicProfileHeader
              displayName={profile.displayName}
              bio={profile.bio}
              social={profile.social}
              contact={profile.contact}
              tierLabel={profile.tierLabel}
              tierPillClass={profile.tierPillClass}
              isVerified={profile.isVerified}
            />
            {profile.showMerchShop && (
              <PublicProfileMerchBar
                shopUrl={profile.merchShopUrl}
                prominent
                hostKind={profile.kind}
                hostId={profile.id}
                showMerchShop={profile.showMerchShop}
              />
            )}
            <PublicProfileSocialBar
              hostKind={profile.kind}
              hostId={profile.id}
              displayName={profile.displayName}
              showMerchShop={profile.showMerchShop}
              merchShopUrl={profile.merchShopUrl}
              embedded
            />
          </div>
        </article>
      </div>
    </div>
  )
}
