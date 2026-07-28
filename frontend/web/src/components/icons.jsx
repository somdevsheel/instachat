import React from 'react';

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function HeartIcon({ filled }) {
  return (
    <svg {...base} fill={filled ? '#ed4956' : 'none'} stroke={filled ? '#ed4956' : 'currentColor'}>
      <path d="M20.8 4.6c-1.9-1.9-5-1.9-6.9 0L12 6.5l-1.9-1.9c-1.9-1.9-5-1.9-6.9 0-1.9 1.9-1.9 5 0 6.9L12 20.3l8.8-8.8c1.9-1.9 1.9-5 0-6.9z" />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg {...base}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg {...base}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function RepostIcon({ active }) {
  return (
    <svg {...base} stroke={active ? '#0af5a0' : 'currentColor'}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function LogoutIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function HomeIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...base}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function ReelsIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <polygon points="10 8 16 12 10 16 10 8" fill={active ? '#fff' : 'currentColor'} stroke="none" />
    </svg>
  );
}

export function MessagesIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ProfileIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg {...base} width={20} height={20}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function PlusSquareIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function BellIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function ChevronUpIcon() {
  return (
    <svg {...base} width={20} height={20}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg {...base} width={20} height={20}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg {...base} width={22} height={22}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg {...base} width={20} height={20}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
      <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
      <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...base} width={20} height={20}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}

export function BookmarkIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg {...base}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function MoreHorizontalIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CompassIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <circle cx="12" cy="12" r="10" />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        fill={active ? '#fff' : 'currentColor'}
        stroke="none"
      />
    </svg>
  );
}

export function GroupsIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path d="M2 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M10 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
    </svg>
  );
}

export function StoreIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function CalendarIcon({ active }) {
  return (
    <svg {...base} fill={active ? 'currentColor' : 'none'}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={active ? '#fff' : 'currentColor'} />
      <line x1="8" y1="2" x2="8" y2="6" stroke={active ? '#fff' : 'currentColor'} />
      <line x1="3" y1="10" x2="21" y2="10" stroke={active ? '#fff' : 'currentColor'} />
    </svg>
  );
}

export function SmartphoneIcon() {
  return (
    <svg {...base} width={22} height={22}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="11" y1="19" x2="13" y2="19" />
    </svg>
  );
}

export function SmileIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

export function MapPinIcon() {
  return (
    <svg {...base} width={18} height={18}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function PlaySolidIcon({ size = 12 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg {...base} width={16} height={16} strokeWidth={2.5}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function SparkleIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size} fill="currentColor" stroke="none">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
      <path d="M19 15l0.7 2.1L22 18l-2.3 0.9L19 21l-0.7-2.1L16 18l2.3-0.9L19 15z" opacity="0.7" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...base} width={16} height={16} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function HashIcon() {
  return (
    <svg {...base} width={16} height={16} strokeWidth={2.5}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

export function XIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function PlusIcon({ size = 24 }) {
  return (
    <svg {...base} width={size} height={size}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function CirclePlusIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg {...base}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function VerifiedBadgeIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#3b82f6">
      <path d="M12 2 14.4 4.1 17.6 3.6 18.7 6.7 21.6 8.2 20.7 11.4 22.4 14.2 19.9 16.4 20 19.7 16.7 20.2 14.9 23 12 21.6 9.1 23 7.3 20.2 4 19.7 4.1 16.4 1.6 14.2 3.3 11.4 2.4 8.2 5.3 6.7 6.4 3.6 9.6 4.1z" />
      <path d="M8.5 12.2 10.8 14.5 15.5 9.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
