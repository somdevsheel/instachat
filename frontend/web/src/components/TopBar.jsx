import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { applyTheme } from '../utils/theme.js';
import Avatar from './Avatar.jsx';
import {
  MenuIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  SparkleIcon,
  CheckIcon,
  MessagesIcon,
  ChevronDownIcon,
} from './icons.jsx';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'nebula', label: 'Nebula', icon: SparkleIcon },
];

export default function TopBar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectTheme = (next) => {
    setTheme(next);
    applyTheme(next);
    setThemeMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/search', { state: { query } });
  };

  const CurrentThemeIcon = THEME_OPTIONS.find((t) => t.value === theme)?.icon || SunIcon;

  return (
    <header className="topbar">
      <Link to="/" className="topbar-logo">
        <img src="/logo.png" alt="" className="topbar-logo-mark" />
        <div>
          <div>Nebula</div>
          <div className="topbar-logo-tagline">social, reimagined</div>
        </div>
      </Link>

      <button className="topbar-menu-button" onClick={onToggleSidebar} aria-label="Menu">
        <MenuIcon />
      </button>

      <form className="topbar-search" onSubmit={handleSearchSubmit}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search Nebula"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="topbar-right">
        <div className="topbar-avatar-menu">
          <button
            className="topbar-icon-btn"
            onClick={() => setThemeMenuOpen((v) => !v)}
            aria-label="Change theme"
          >
            <CurrentThemeIcon />
          </button>
          {themeMenuOpen && (
            <>
              <div className="topbar-menu-backdrop" onClick={() => setThemeMenuOpen(false)} />
              <div className="topbar-dropdown theme-dropdown">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    className={`theme-option ${theme === value ? 'active' : ''}`}
                    onClick={() => selectTheme(value)}
                  >
                    <Icon /> <span>{label}</span>
                    {theme === value && <CheckIcon />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="topbar-icon-btn" onClick={() => navigate('/messages')} aria-label="Messages">
          <MessagesIcon />
        </button>

        <div className="topbar-avatar-menu">
          <button className="topbar-avatar-button" onClick={() => setMenuOpen((v) => !v)}>
            <Avatar src={user?.profilePicture} username={user?.username} size={32} />
            <ChevronDownIcon />
          </button>
          {menuOpen && (
            <>
              <div className="topbar-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="topbar-dropdown">
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                  Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
