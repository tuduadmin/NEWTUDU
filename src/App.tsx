import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignUpPage from './pages/SignUpPage'
import SignInPage from './pages/SignInPage'
import DiscoverPage from './pages/DiscoverPage'
import EventManagerPage from './pages/host/EventManagerPage'
import TicketScannerPage from './pages/host/TicketScannerPage'
import EditPublicProfilePage from './pages/host/EditPublicProfilePage'
import AddHiddenGemPage from './pages/host/AddHiddenGemPage'
import RoadTripPage from './pages/RoadTripPage'
import BucketListPage from './pages/BucketListPage'
import BucketListDetailPage from './pages/BucketListDetailPage'
import BucketListStoryPage from './pages/BucketListStoryPage'
import BucketListDiscoveryPage from './pages/BucketListDiscoveryPage'
import MyTuduPage from './pages/MyTuduPage'
import MyTuduSettingsPage from './pages/MyTuduSettingsPage'
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/discover" element={<DiscoverPage />} />
      <Route path="/host" element={<EventManagerPage />} />
      <Route path="/host/scan" element={<TicketScannerPage />} />
      <Route path="/host/profile" element={<EditPublicProfilePage />} />
      <Route path="/host/hidden-gem" element={<AddHiddenGemPage />} />
      <Route path="/road-trip" element={<RoadTripPage />} />
      <Route path="/bucket-list" element={<BucketListPage />} />
      <Route
        path="/bucket-list/completed"
        element={<Navigate to="/bucket-list?tab=discover&discover=completed" replace />}
      />
      <Route path="/bucket-list/story/:id" element={<BucketListStoryPage />} />
      <Route path="/bucket-list/:id" element={<BucketListDetailPage />} />
      <Route path="/bucket-lists/discover" element={<BucketListDiscoveryPage />} />
      <Route path="/my-tudu" element={<MyTuduPage />} />
      <Route path="/my-tudu/settings" element={<MyTuduSettingsPage />} />
      <Route path="/settings" element={<MyTuduSettingsPage />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/following" element={<FollowingPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />
      <Route path="/onboarding/interests" element={<InterestsPage />} />
      <Route path="/onboarding/budget" element={<BudgetPage />} />
      <Route path="/onboarding/distance" element={<DistancePage />} />
      <Route path="/onboarding/timeframe" element={<TimeframePage />} />
      <Route path="/onboarding/friends" element={<OnboardingFriendsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
