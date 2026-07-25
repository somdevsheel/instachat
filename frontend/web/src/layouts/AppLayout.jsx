import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnreadCount, logout, notificationApi, setUnreadCount } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import TopBar from '../components/TopBar.jsx';
import RightPanel from '../components/RightPanel.jsx';
import CreateSheet from '../components/CreateSheet.jsx';
import {
  HomeIcon,
  SearchIcon,
  CompassIcon,
  ReelsIcon,
  MessagesIcon,
  BellIcon,
  ProfileIcon,
  LogoutIcon,
  PlusSquareIcon,
  PlusIcon,
  BookmarkIcon,
  UsersIcon,
  GroupsIcon,
  StoreIcon,
  CalendarIcon,
  SmartphoneIcon,
} from '../components/icons.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true, bottomNav: true, group: 'primary' },
  { to: '/search', label: 'Search', icon: SearchIcon, bottomNav: true, group: 'primary' },
  { to: '/reels', label: 'Reels', icon: ReelsIcon, group: 'primary' },
  { to: '/explore', label: 'Discover', icon: CompassIcon, group: 'primary' },
  { to: '/messages', label: 'Messages', icon: MessagesIcon, badgeKey: 'chat', bottomNav: true, group: 'primary' },
  { to: '/notifications', label: 'Notifications', icon: BellIcon, badgeKey: 'notifications', group: 'primary' },
  { to: '/create', label: 'Create', icon: PlusSquareIcon, group: 'primary' },
  { to: '/profile', label: 'Profile', icon: ProfileIcon, bottomNav: true, group: 'primary' },
  { to: '/saved', label: 'Saved', icon: BookmarkIcon, group: 'secondary' },
  { to: '/friends', label: 'Friends', icon: UsersIcon, group: 'secondary' },
  { to: '/groups', label: 'Groups', icon: GroupsIcon, group: 'secondary' },
  { to: '/marketplace', label: 'Marketplace', icon: StoreIcon, group: 'secondary' },
  { to: '/events', label: 'Events', icon: CalendarIcon, group: 'secondary' },
];

// Pages that already manage their own full-bleed/immersive layout —
// the right "suggestions" panel would just get in the way here.
const NO_RIGHT_PANEL_ROUTES = ['/reels', '/messages', '/create'];

export default function AppLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const chatUnread = useSelector((state) => state.chat.unreadCount);
  const notificationsUnread = useSelector((state) => state.notifications.unreadCount);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUnreadCount());
    notificationApi
      .getUnreadCount()
      .then((res) => dispatch(setUnreadCount(res?.data?.count ?? 0)))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const badgeCounts = { chat: chatUnread, notifications: notificationsUnread };

  const showRightPanel =
    location.pathname === '/' &&
    !NO_RIGHT_PANEL_ROUTES.some((p) => location.pathname.startsWith(p));

  const renderNavItems = (withLabel, bottomOnly = false, group = null) =>
    NAV_ITEMS.filter((item) => (!bottomOnly || item.bottomNav) && (!group || item.group === group)).map(({ to, label, icon: Icon, end, badgeKey }) => {
      const count = badgeKey ? badgeCounts[badgeKey] : 0;
      return (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span className="nav-icon">
                <Icon active={isActive} />
                {count > 0 && (
                  <span className="nav-badge">{count > 99 ? '99+' : count}</span>
                )}
              </span>
              {withLabel && <span className="nav-label">{label}</span>}
            </>
          )}
        </NavLink>
      );
    });

  const bottomNavItems = renderNavItems(false, true);

  return (
    <div className="app-layout">
      <TopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="" className="sidebar-logo-mark" />
          <div>
            <div>Nebula</div>
            <div className="sidebar-tagline">social, reimagined</div>
          </div>
        </div>
        <nav className="sidebar-nav">{renderNavItems(true, false, 'primary')}</nav>
        <div className="nav-divider" />
        <nav className="sidebar-nav">{renderNavItems(true, false, 'secondary')}</nav>

        <NavLink to="/profile" className="sidebar-profile-card">
          <Avatar src={user?.profilePicture} username={user?.username} size={36} />
          <div>
            <div className="sidebar-profile-name">{user?.username}</div>
            <div className="sidebar-profile-handle">@{user?.username}</div>
          </div>
        </NavLink>

        <button className="sidebar-logout" onClick={() => dispatch(logout())}>
          <LogoutIcon />
          <span>Log out</span>
        </button>

        <div className="sidebar-mobile-promo">
          <div className="sidebar-mobile-promo-icon">
            <SmartphoneIcon />
          </div>
          <div className="sidebar-mobile-promo-body">
            <div className="sidebar-mobile-promo-title">Nebula Mobile</div>
            <div className="sidebar-mobile-promo-text">
              This account also works in the mobile app.
            </div>
          </div>
        </div>
      </aside>

      <main className={`app-content ${showRightPanel ? 'with-right-panel' : ''}`}>
        <Outlet />
      </main>

      {showRightPanel && <RightPanel />}

      <nav className="bottom-nav">
        {bottomNavItems.slice(0, 2)}
        <button
          className="bottom-nav-create-btn"
          onClick={() => setCreateSheetOpen(true)}
          aria-label="Create"
        >
          <PlusIcon size={22} />
        </button>
        {bottomNavItems.slice(2)}
      </nav>

      {createSheetOpen && <CreateSheet onClose={() => setCreateSheetOpen(false)} />}
    </div>
  );
}
