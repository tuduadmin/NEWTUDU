import { useMemo } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import AppHeaderBar from '../components/locked/AppHeaderBar'
import BottomNav from '../components/BottomNav'
import PublicProfileEvents from '../components/host/PublicProfileEvents'
import PublicProfileMerchBar from '../components/host/PublicProfileMerchBar'
import PublicProfileSocialBar from '../components/host/PublicProfileSocialBar'
import PublicProfileHeader from '../components/host/PublicProfileHeader'
import PublicProfileHero from '../components/host/PublicProfileHero'
import { BackLink } from '../components/NavActionButtons'
import { useHostProfileStore } from '../hooks/useHostProfileStore'
import {
  getPublicProfileBackUrl,
  loadOrgPublicProfile,
  loadPersonalPublicProfile,
} from '../lib/publicHostProfile'

function resolveLogoLinkTo(fromSource: string | null): string {
  if (fromSource === 'host' || fromSource === 'host-profile' || fromSource === 'event-manager') {
    return '/host'
  }
  return '/discover'
}

export default function PublicHostProfilePage() {
  const { orgId, userId } = useParams<{ orgId?: string; userId?: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const profileRevision = useHostProfileStore()
  const fromSource =
    searchParams.get('from') ??
    (location.state as { from?: string } | null)?.from ??
    null
  const backUrl = getPublicProfileBackUrl(fromSource)
  const logoLinkTo = resolveLogoLinkTo(fromSource)

  const profile = useMemo(() => {
    void profileRevision
    return userId
      ? loadPersonalPublicProfile(userId)
      : orgId
        ? loadOrgPublicProfile(orgId)
        : null
  }, [userId, orgId, profileRevision])

  if (!profile) {
    return (
      <div className="app-page-shell pb-28">
        <AppHeaderBar logoLinkTo={logoLinkTo} />
        <main className="px-4 pt-10 text-center">
          <h1 className="font-display text-xl font-bold text-brown">Host not found</h1>
          <p className="mt-2 text-sm text-brown-muted">
            This profile may have been removed or the link is incorrect.
          </p>
          <BackLink to={backUrl} className="mt-6 text-orange">
            {backUrl === '/discover' ? 'Browse events â†’' : 'Go back â†’'}
          </BackLink>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-page-shell pb-28">
      <AppHeaderBar logoLinkTo={logoLinkTo} />

      <main className="pb-4">
        <div className="px-4 pt-2">
          <BackLink to={backUrl}>Back</BackLink>
        </div>

        <div className="px-4 pt-3">
          <article className="overflow-hidden rounded-[14px] border border-brown/10 bg-white shadow-sm">
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

        <PublicProfileEvents
          events={profile.upcomingEvents}
          orgName={profile.kind === 'org' ? profile.displayName : undefined}
          departments={profile.departments}
          groupByDepartment={profile.kind === 'org' && (profile.departments?.length ?? 0) > 0}
        />
      </main>

      <BottomNav />
    </div>
  )
}
