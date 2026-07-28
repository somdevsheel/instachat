import React, { useEffect, Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '@instachat/shared';
import SocketInitializer from './components/SocketInitializer.jsx';
import AppLayout from './layouts/AppLayout.jsx';

// Every route's page is fetched on demand instead of all being bundled
// into one initial JS payload — someone landing on Home never pays for
// Marketplace/Events/Settings/etc. until they actually visit them.
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage.jsx'));
const ReelsPage = lazy(() => import('./pages/ReelsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'));
const ChatDetailPage = lazy(() => import('./pages/ChatDetailPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const ExplorePage = lazy(() => import('./pages/ExplorePage.jsx'));
const SavedPage = lazy(() => import('./pages/SavedPage.jsx'));
const FriendsPage = lazy(() => import('./pages/FriendsPage.jsx'));
const GroupsPage = lazy(() => import('./pages/GroupsPage.jsx'));
const EventsPage = lazy(() => import('./pages/EventsPage.jsx'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) return <div className="centered-message">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <SocketInitializer />
      <Suspense fallback={<div className="centered-message">Loading…</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="create" element={<CreatePostPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="reels" element={<ReelsPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:chatId" element={<ChatDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
