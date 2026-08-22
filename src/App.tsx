import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TuduCrewPage from './pages/TuduCrewPage'
import SignUpPage from './pages/SignUpPage'
import SignInPage from './pages/SignInPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DiscoverPage from './pages/DiscoverPage'
import EventManagerPage from './pages/host/EventManagerPage'
import TicketScannerPage from './pages/host/TicketScannerPage'
import EditPublicProfilePage from './pages/host/EditPublicProfilePage'
import AddHiddenGemPage from './pages/host/AddHiddenGemPage'
import HiddenGemInsightsPage from './pages/host/HiddenGemInsightsPage'
import RoadTripLandingPage from './pages/RoadTripLandingPage'
import RoadTripCreateWizardPage from './pages/RoadTripCreateWizardPage'
import RoadTripFindMorePage from './pages/RoadTripFindMorePage'
import RoadTripPlanPage from './pages/RoadTripPlanPage'
import RoadTripSurprisePage from './pages/RoadTripSurprisePage'
import RoadTripFromBucketPage from './pages/RoadTripFromBucketPage'
import RoadTripDetailPage from './pages/RoadTripDetailPage'
import BucketListMinePage from './pages/BucketListMinePage'
import BucketListDetailPage from './pages/BucketListDetailPage'
import BucketListStoryPage from './pages/BucketListStoryPage'
import BucketListDiscoveryPage from './pages/BucketListDiscoveryPage'
import MyTuduPage from './pages/MyTuduPage'
import MyTuduTicketDetailPage from './pages/MyTuduTicketDetailPage'
import MyTuduEventTicketsPage from './pages/MyTuduEventTicketsPage'
import TicketPaperPage from './pages/TicketPaperPage'
import MyTuduNotificationsPage from './pages/MyTuduNotificationsPage'
import MyTuduSettingsDashboardPage from './pages/settings/MyTuduSettingsDashboardPage'
import MyTuduProfileSettingsPage from './pages/settings/MyTuduProfileSettingsPage'
import MyTuduEditProfilePage from './pages/settings/MyTuduEditProfilePage'
import MyTuduSecuritySettingsPage from './pages/settings/MyTuduSecuritySettingsPage'
import MyTuduAppSettingsPage from './pages/settings/MyTuduAppSettingsPage'
import MyTuduNotificationPrefsPage from './pages/settings/MyTuduNotificationPrefsPage'
import MyTuduPaymentsSettingsPage from './pages/settings/MyTuduPaymentsSettingsPage'
import MyTuduPrivacySettingsPage from './pages/settings/MyTuduPrivacySettingsPage'
import MyTuduHostSettingsPage from './pages/settings/MyTuduHostSettingsPage'
import MyTuduRoadTripSettingsPage from './pages/settings/MyTuduRoadTripSettingsPage'
import FriendsPage from './pages/FriendsPage'
import SearchPage from './pages/SearchPage'
import FollowingPage from './pages/FollowingPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import CookiePolicyPage from './pages/CookiePolicyPage'
import InterestsPage from './pages/onboarding/InterestsPage'
import BudgetPage from './pages/onboarding/BudgetPage'
import DistancePage from './pages/onboarding/DistancePage'
import TimeframePage from './pages/onboarding/TimeframePage'
import OnboardingFriendsPage from './pages/onboarding/OnboardingFriendsPage'
import VerifyPhonePage from './pages/VerifyPhonePage'
import CreateOrgPage from './pages/host/CreateOrgPage'
import CreateEventPage from './pages/host/CreateEventPage'
import TeamPage from './pages/host/TeamPage'
import DepartmentsPage from './pages/host/DepartmentsPage'
import PrivateEventPage from './pages/PrivateEventPage'
import PrivateEventChatPage from './pages/PrivateEventChatPage'
import EventRsvpPage from './pages/EventRsvpPage'
import EventMarketplacePage from './pages/EventMarketplacePage'
import MyTuduMerchPickupPage from './pages/MyTuduMerchPickupPage'
import HostEventMerchManagePage from './pages/host/HostEventMerchManagePage'
import HostEventPosterPage from './pages/host/HostEventPosterPage'
import HostEventViewPage from './pages/host/HostEventViewPage'
import HostSubscriptionPage from './pages/host/HostSubscriptionPage'
import FinanceHubPage from './pages/host/FinanceHubPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminSignInPage from './pages/admin/AdminSignInPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminGrowthPage from './pages/admin/AdminGrowthPage'
import AdminActivityPage from './pages/admin/AdminActivityPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminPeoplePage from './pages/admin/AdminPeoplePage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminSupportLegacyRedirect from './pages/admin/AdminSupportLegacyRedirect'
import AdminMessagesLegacyRedirect from './pages/admin/AdminMessagesLegacyRedirect'
import AdminContentPage from './pages/admin/AdminContentPage'
import AdminContentLegacyRedirect from './pages/admin/AdminContentLegacyRedirect'
import AdminRolloutPage from './pages/admin/AdminRolloutPage'
import AdminOrgLayout from './pages/admin/AdminOrgLayout'
import AdminOrgOverviewPage from './pages/admin/AdminOrgOverviewPage'
import AdminOrgTeamPage from './pages/admin/AdminOrgTeamPage'
import AdminOrgHiddenGemsPage from './pages/admin/AdminOrgHiddenGemsPage'
import AdminOrgSlideshowPage from './pages/admin/AdminOrgSlideshowPage'
import AdminTiersPage from './pages/admin/AdminTiersPage'
import AdminTrustedPartnersPage from './pages/admin/AdminTrustedPartnersPage'
import AdminAffiliatePartnersPage from './pages/admin/AdminAffiliatePartnersPage'
import AdminTicketsPage from './pages/admin/AdminTicketsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminAppIconPage from './pages/admin/AdminAppIconPage'
import AdminSeedEventCreatePage from './pages/admin/AdminSeedEventCreatePage'
import AdminTeamAccessPage from './pages/admin/AdminTeamAccessPage'
import AdminLegalPage from './pages/admin/AdminLegalPage'
import AdminBucketListCreatePage from './pages/admin/AdminBucketListCreatePage'
import AdminEmployeesPage from './pages/admin/AdminEmployeesPage'
import AdminSecurityPage from './pages/admin/AdminSecurityPage'
import AdminSafetyPage from './pages/admin/AdminSafetyPage'
import AdminMilesPage from './pages/admin/AdminMilesPage'
import AdminRewardsPage from './pages/admin/AdminRewardsPage'
import AdminEasterEggsPage from './pages/admin/AdminEasterEggsPage'
import AdminReferencePage from './pages/admin/AdminReferencePage'
import AdminCategoriesAmenitiesPage from './pages/admin/AdminCategoriesAmenitiesPage'
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage'
import ActivityTracker from './components/admin/ActivityTracker'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import PublicHostProfilePage from './pages/PublicHostProfilePage'
import NavIconPickerPage from './pages/dev/NavIconPickerPage'
import RadiusPickerPage from './pages/dev/RadiusPickerPage'
import DevResetPage from './pages/dev/DevResetPage'
import HealthPage from './pages/dev/HealthPage'
import FeatureFlagGate from './components/FeatureFlagGate'
import LaunchSplash from './components/LaunchSplash'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <>
      <LaunchSplash />
      <ScrollToTop />
      <ActivityTracker />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/crew" element={<TuduCrewPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/discover" element={<FeatureFlagGate flag="discoverEnabled"><DiscoverPage /></FeatureFlagGate>} />
      <Route path="/host" element={<EventManagerPage />} />
      <Route path="/host/scan" element={<TicketScannerPage />} />
      <Route path="/host/profile" element={<EditPublicProfilePage />} />
      <Route path="/host/hidden-gem" element={<AddHiddenGemPage />} />
      <Route path="/host/hidden-gem/insights/:gemId" element={<HiddenGemInsightsPage />} />
      <Route path="/host/create-event" element={<CreateEventPage />} />
      <Route path="/host/create-org" element={<CreateOrgPage />} />
      <Route path="/host/team" element={<TeamPage />} />
      <Route path="/host/departments" element={<DepartmentsPage />} />
      <Route path="/host/finance" element={<FinanceHubPage />} />
      <Route path="/host/subscription" element={<HostSubscriptionPage />} />
      <Route path="/host/view/personal/:userId" element={<PublicHostProfilePage />} />
      <Route path="/host/view/:orgId" element={<PublicHostProfilePage />} />
      <Route path="/event/private/:id/chat" element={<PrivateEventChatPage />} />
      <Route path="/event/private/:id" element={<PrivateEventPage />} />
      <Route path="/event/:id/rsvp" element={<EventRsvpPage />} />
      <Route path="/event/:eventId/marketplace" element={<EventMarketplacePage />} />
      <Route path="/host/event/:eventId/view" element={<HostEventViewPage />} />
      <Route path="/host/event/:eventId/merch" element={<HostEventMerchManagePage />} />
      <Route path="/host/event/:eventId/posters" element={<HostEventPosterPage />} />
      <Route path="/e/:shareToken" element={<PrivateEventPage />} />
      <Route path="/verify-phone" element={<VerifyPhonePage />} />
      <Route path="/road-trip/create/:tripId/:stepId" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripCreateWizardPage /></FeatureFlagGate>} />
      <Route path="/road-trip/create/:tripId" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripCreateWizardPage /></FeatureFlagGate>} />
      <Route path="/road-trip/create" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripCreateWizardPage /></FeatureFlagGate>} />
      <Route path="/road-trip/find-more/:tripId" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripFindMorePage /></FeatureFlagGate>} />
      <Route path="/road-trip/plan" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripPlanPage /></FeatureFlagGate>} />
      <Route path="/road-trip/surprise" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripSurprisePage /></FeatureFlagGate>} />
      <Route path="/road-trip/from-bucket-list" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripFromBucketPage /></FeatureFlagGate>} />
      <Route path="/road-trip/:tripId" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripDetailPage /></FeatureFlagGate>} />
      <Route path="/road-trip" element={<FeatureFlagGate flag="roadTripEnabled"><RoadTripLandingPage /></FeatureFlagGate>} />
      <Route path="/bucket-list/mine" element={<FeatureFlagGate flag="bucketListEnabled"><BucketListMinePage /></FeatureFlagGate>} />
      <Route
        path="/bucket-list/completed"
        element={<Navigate to="/bucket-list?tab=mine&discover=completed" replace />}
      />
      <Route path="/bucket-list/story/:id" element={<FeatureFlagGate flag="bucketListEnabled"><BucketListStoryPage /></FeatureFlagGate>} />
      <Route path="/bucket-list/:id" element={<FeatureFlagGate flag="bucketListEnabled"><BucketListDetailPage /></FeatureFlagGate>} />
      <Route path="/bucket-list" element={<FeatureFlagGate flag="bucketListEnabled"><BucketListDiscoveryPage /></FeatureFlagGate>} />
      <Route path="/bucket-lists/discover" element={<Navigate to="/bucket-list" replace />} />
      <Route path="/my-tudu" element={<MyTuduPage />} />
      <Route path="/my-tudu/feed" element={<MyTuduPage />} />
      <Route path="/my-tudu/events/:eventId/tickets" element={<MyTuduEventTicketsPage />} />
      <Route path="/my-tudu/tickets/:id" element={<MyTuduTicketDetailPage />} />
      <Route path="/ticket/paper/:id" element={<TicketPaperPage />} />
      <Route path="/my-tudu/pickups/:orderId" element={<MyTuduMerchPickupPage />} />
      <Route path="/my-tudu/notifications" element={<MyTuduNotificationsPage />} />
      <Route path="/my-tudu/settings" element={<MyTuduSettingsDashboardPage />} />
      <Route path="/my-tudu/settings/edit-profile" element={<MyTuduEditProfilePage />} />
      <Route path="/my-tudu/settings/profile" element={<MyTuduProfileSettingsPage />} />
      <Route path="/my-tudu/settings/security" element={<MyTuduSecuritySettingsPage />} />
      <Route path="/my-tudu/settings/app" element={<MyTuduAppSettingsPage />} />
      <Route path="/my-tudu/settings/notifications" element={<MyTuduNotificationPrefsPage />} />
      <Route path="/my-tudu/settings/payments" element={<MyTuduPaymentsSettingsPage />} />
      <Route path="/my-tudu/settings/privacy" element={<MyTuduPrivacySettingsPage />} />
      <Route path="/my-tudu/settings/host" element={<MyTuduHostSettingsPage />} />
      <Route path="/my-tudu/settings/road-trip" element={<MyTuduRoadTripSettingsPage />} />
      <Route path="/settings" element={<Navigate to="/my-tudu/settings" replace />} />
      <Route path="/settings/edit-profile" element={<Navigate to="/my-tudu/settings/edit-profile" replace />} />
      <Route path="/settings/profile" element={<Navigate to="/my-tudu/settings/profile" replace />} />
      <Route path="/settings/security" element={<Navigate to="/my-tudu/settings/security" replace />} />
      <Route path="/settings/app" element={<Navigate to="/my-tudu/settings/app" replace />} />
      <Route path="/settings/notifications" element={<Navigate to="/my-tudu/settings/notifications" replace />} />
      <Route path="/settings/payments" element={<Navigate to="/my-tudu/settings/payments" replace />} />
      <Route path="/settings/privacy" element={<Navigate to="/my-tudu/settings/privacy" replace />} />
      <Route path="/settings/host" element={<Navigate to="/my-tudu/settings/host" replace />} />
      <Route path="/settings/road-trip" element={<Navigate to="/my-tudu/settings/road-trip" replace />} />
      <Route path="/settings/*" element={<Navigate to="/my-tudu/settings" replace />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/following" element={<FollowingPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/dev/nav-icons" element={<NavIconPickerPage />} />
      <Route path="/dev/radius" element={<RadiusPickerPage />} />
      <Route path="/dev/reset" element={<DevResetPage />} />
      <Route path="/health" element={<HealthPage />} />
      <Route path="/onboarding/interests" element={<InterestsPage />} />
      <Route path="/onboarding/budget" element={<BudgetPage />} />
      <Route path="/onboarding/distance" element={<DistancePage />} />
      <Route path="/onboarding/timeframe" element={<TimeframePage />} />
      <Route path="/onboarding/friends" element={<OnboardingFriendsPage />} />
      <Route path="/admin/signin" element={<AdminSignInPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="growth" element={<AdminGrowthPage />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="people" element={<AdminPeoplePage />} />
        <Route path="users" element={<Navigate to="/admin/people?view=users" replace />} />
        <Route path="users/:userId" element={<AdminUserDetailPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="messages" element={<AdminMessagesLegacyRedirect />} />
        <Route path="content" element={<AdminContentPage />} />
        <Route path="rollout" element={<AdminRolloutPage />} />
        <Route path="trusted-partners" element={<AdminTrustedPartnersPage />} />
        <Route path="tickets" element={<AdminTicketsPage />} />
        <Route path="affiliates" element={<AdminAffiliatePartnersPage />} />
        <Route path="events" element={<AdminContentLegacyRedirect view="events" />} />
        <Route path="feedback" element={<AdminSupportLegacyRedirect />} />
        <Route path="organizations" element={<Navigate to="/admin/people?view=orgs" replace />} />
        <Route path="organizations/:orgId" element={<AdminOrgLayout />}>
          <Route index element={<AdminOrgOverviewPage />} />
          <Route path="team" element={<AdminOrgTeamPage />} />
          <Route path="hidden-gems" element={<AdminOrgHiddenGemsPage />} />
          <Route path="slideshow" element={<AdminOrgSlideshowPage />} />
        </Route>
        <Route path="team-access" element={<AdminTeamAccessPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="security" element={<AdminSecurityPage />} />
        <Route path="safety" element={<AdminSafetyPage />} />
        <Route path="legal" element={<AdminLegalPage />} />
        <Route path="themes" element={<Navigate to="/admin" replace />} />
        <Route path="categories-amenities" element={<AdminCategoriesAmenitiesPage />} />
        <Route path="tiers" element={<AdminTiersPage />} />
        <Route path="miles" element={<AdminMilesPage />} />
        <Route path="rewards" element={<AdminRewardsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="settings/app-icon" element={<AdminAppIconPage />} />
        <Route path="easter-eggs" element={<AdminEasterEggsPage />} />
        <Route path="reference" element={<AdminReferencePage />} />
        <Route path="seed-events/create" element={<AdminSeedEventCreatePage />} />
        <Route path="seed-events/draft-archive" element={<AdminContentLegacyRedirect view="draft-archive" />} />
        <Route path="seed-events" element={<AdminContentLegacyRedirect view="seed-events" />} />
        <Route path="attractions" element={<AdminContentLegacyRedirect view="attractions" />} />
        <Route path="hidden-gems" element={<Navigate to="/admin/content?view=hidden-gems" replace />} />
        <Route path="secret-list" element={<AdminContentLegacyRedirect view="attractions" />} />
        <Route path="bucket-lists/create" element={<AdminBucketListCreatePage />} />
        <Route path="bucket-lists" element={<AdminContentLegacyRedirect view="bucket-lists" />} />
        <Route path="road-trip" element={<AdminContentLegacyRedirect view="road-trip" />} />
        <Route path="host-events" element={<Navigate to="/admin/content" replace />} />
        <Route path="tudu-black" element={<Navigate to="/admin/people?view=tudu-black" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
