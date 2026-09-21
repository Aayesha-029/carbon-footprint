import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useChat } from '../contexts/ChatContext';
import ChatFloatingButton from './chat/ChatFloatingButton';
import ChatPopup from './chat/ChatPopup';
import {
  LayoutDashboard, Activity, BarChart3, Target, Lightbulb, Trophy, Award,
  Clock, User, Settings, LogOut, Leaf, Shield, Users, Building2,
  BadgeCheck, TrendingUp, FileText, Menu, X, MessageCircle,
  ChevronDown, AlertTriangle, Sparkles,
} from 'lucide-react';

const Layout = ({ children, userRole: userRoleProp = 'user' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // --- UI: derive effective role from path (URL) if the prop is ambiguous ---
const pathRole = location.pathname.startsWith('/admin')
  ? 'admin'
  : location.pathname.startsWith('/organizer')
  ? 'organizer'
  : null;

const userRole = pathRole || userRoleProp;
  const { settings } = useSettings();
  const { t } = useLanguage();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'User');
    setUserEmail(localStorage.getItem('userEmail') || '');
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // ============ LOGOUT ============
  const performLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };
  const requestLogout = () => {
    setProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  // ============================================================
  // NAV SECTIONS  (unchanged data)
  // ============================================================
  const userSections = [
    {
      label: 'Main',
      items: [
        { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
        { icon: Activity, label: t('nav.activities'), path: '/activities' },
        { icon: BarChart3, label: t('nav.analytics'), path: '/analytics' },
      ],
    },
    {
      label: 'Goals & Insights',
      items: [
        { icon: Target, label: t('nav.goals'), path: '/goals' },
        { icon: Lightbulb, label: t('nav.recommendations'), path: '/recommendations' },
      ],
    },
    {
      label: 'Community',
      items: [
        { icon: Trophy, label: t('nav.leaderboard'), path: '/leaderboard' },
        { icon: Award, label: t('nav.badges'), path: '/badges' },
        { icon: Clock, label: t('nav.history'), path: '/history' },
      ],
    },
    {
      label: 'Account',
      items: [
        { icon: User, label: t('nav.profile'), path: '/profile' },
        { icon: Settings, label: t('nav.settings'), path: '/settings' },
      ],
    },
    {
      label: 'Support',
      items: [
        { icon: MessageCircle, label: t('nav.support') || 'Support Center', path: '/support' },
      ],
    },
  ];

  const adminSections = [
    {
      label: 'Overview',
      items: [
        { icon: Shield, label: t('admin.dashboard.title'), path: '/admin/dashboard' },
        { icon: TrendingUp, label: t('admin.analytics.title'), path: '/admin/analytics' },
        { icon: FileText, label: t('admin.reports.title'), path: '/admin/reports' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { icon: Users, label: t('admin.users.title'), path: '/admin/users' },
        { icon: Activity, label: t('admin.activities.title'), path: '/admin/activities' },
        { icon: Building2, label: t('admin.organizations.title') || 'Organizations', path: '/admin/organizations' },
      ],
    },
    {
      label: 'Content',
      items: [
        { icon: BarChart3, label: t('admin.emissions.title') || 'Emission Factors', path: '/admin/emissions' },
        { icon: BadgeCheck, label: t('admin.badges.title'), path: '/admin/badges' },
        { icon: Trophy, label: t('admin.leaderboard.title') || 'Leaderboard', path: '/admin/leaderboard' },
      ],
    },
    {
      label: 'Support',
      items: [
        { icon: MessageCircle, label: t('admin.tickets.title'), path: '/admin/tickets' },
        { icon: Settings, label: t('admin.settings.title'), path: '/admin/settings' },
      ],
    },
  ];

  const organizerSections = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: t('organizer.dashboard.title'), path: '/organizer/dashboard' },
      { icon: Users, label: t('organizer.employees.title'), path: '/organizer/employees' },
    ],
  },
  {
    label: 'Team Insights',
    items: [
      { icon: Award, label: t('organizer.badges.title'), path: '/organizer/badges' },
      { icon: Activity, label: t('organizer.activities.title'), path: '/organizer/activities' },
      { icon: BarChart3, label: t('organizer.emissionFactors.title'), path: '/organizer/emission-factors' },
    ],
  },
  {
    label: 'Reports & Rankings',
    items: [
      { icon: TrendingUp, label: t('organizer.analytics.title'), path: '/organizer/analytics' },
      { icon: Trophy, label: t('organizer.leaderboard.title'), path: '/organizer/leaderboard' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: Settings, label: t('organizer.settings.title'), path: '/organizer/settings' },
    ],
  },
];

  let navSections;
  if (userRole === 'admin') navSections = adminSections;
  else if (userRole === 'organizer') navSections = organizerSections;
  else navSections = userSections;

  const isItemActive = (path) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(path + '/');
  };

  const getPageTitle = () => {
    if (userRole === 'admin') return t('admin.dashboard.title');
    if (userRole === 'organizer') return t('organizer.dashboard.title');
    return t('nav.dashboard');
  };

 // --- UI: FIXED brand derivation — always append green "Track" unless already present ---
const rawBrand = settings?.appName || 'CarbonTrack';
const brandHasTrackSuffix = rawBrand.toLowerCase().endsWith('track');
const brandHead = brandHasTrackSuffix ? rawBrand.slice(0, -5) : rawBrand;
const brandTail = brandHasTrackSuffix ? rawBrand.slice(-5) : 'Track';
const fullBrand = brandHasTrackSuffix ? rawBrand : `${rawBrand}Track`;
const currentYear = new Date().getFullYear();

  // --- UI: role metadata for the professional header badge ---
  const roleMeta = {
    admin:     { label: 'Admin',     Icon: Shield,    cls: 'is-admin' },
    organizer: { label: 'Organizer', Icon: Building2, cls: 'is-organizer' },
    user:      { label: 'User',      Icon: User,      cls: 'is-user' },
  }[userRole] || { label: 'User', Icon: User, cls: 'is-user' };

  return (
    <div className="app-shell">
      {/* --- UI: layout-local styles (classes only, no logic) --- */}
      <style>{`
        /* === SHELL === */
        .app-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-app);
          color: var(--text-strong);
          font-family: var(--font-sans);
        }

        /* === SIDEBAR === */
        .app-sidebar {
          position: fixed;
          top: 0; left: 0;
          height: 100vh;
          width: 272px;
          display: flex;
          flex-direction: column;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
          overflow-y: auto;
          z-index: 100;
          transition: width .3s var(--ease);
        }
        .app-sidebar[data-collapsed] { width: 80px; }

        .app-sidebar__brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 22px 22px;
          border-bottom: 1px solid var(--border);
        }
        .app-sidebar[data-collapsed] .app-sidebar__brand {
          padding: 24px 0 22px;
          justify-content: center;
        }
        .app-sidebar__logo {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #22c55e, #15803d);
          border-radius: 12px;
          display: grid; place-items: center;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(34,197,94,.32);
          
        }
        .app-sidebar__brandname {
  font-size: 29px;
  font-weight: 900;
  color: var(--text-strong);
  letter-spacing: -.6px;
  white-space: nowrap;
  line-height: 1.1;
}
        .app-sidebar__brandname-accent { color: var(--green-600); }

        .app-sidebar__nav {
          flex: 1;
          padding: 16px 12px 24px;
        }
        .app-sidebar__section { margin-bottom: 28px; }
        .app-sidebar__section:last-child { margin-bottom: 0; }
        .app-sidebar__sectionlabel {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-on-sidebar-muted);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          padding: 0 14px 12px;
        }

        /* === NAV ITEM === */
        .nav-item-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 6px;
          color: var(--text-on-sidebar);
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          letter-spacing: -.1px;
          transition: transform .2s var(--ease),
                      background .2s var(--ease),
                      color .2s var(--ease),
                      box-shadow .2s var(--ease);
        }
        .app-sidebar[data-collapsed] .nav-item-link {
          padding: 13px;
          justify-content: center;
        }
        .nav-item-link:hover {
          transform: translateX(3px);
          background: var(--tint-1);
          color: var(--green-700);
        }
        .nav-item-link:hover svg { color: var(--green-600); }
        .nav-item-link.active {
          transform: none;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 6px 16px rgba(22,163,74,.35);
        }
        .nav-item-link.active svg { color: #ffffff; }
        .nav-item-link__label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-item-link__indicator {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #bef264;
          box-shadow: 0 0 0 3px rgba(190,242,100,.25);
        }

        /* === SIDEBAR FOOTER === */
        .app-sidebar__footer {
          padding: 16px 12px 20px;
          border-top: 1px solid var(--border);
        }
        .app-logout-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 16px;
          border-radius: 12px;
          width: 100%;
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: -.1px;
          font-family: inherit;
          transition: background .2s var(--ease), transform .2s var(--ease);
          text-align: left;
        }
        .app-sidebar[data-collapsed] .app-logout-btn {
          padding: 13px;
          justify-content: center;
        }
        .app-logout-btn:hover {
          background: var(--pill-danger-bg);
          transform: translateX(3px);
        }
        .app-sidebar__copyright {
          margin-top: 12px;
          padding: 0 14px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-on-sidebar-muted);
          letter-spacing: .2px;
        }

        /* === TOGGLE === */
        .app-sidebar__toggle {
          position: absolute;
          bottom: 20px;
          right: -12px;
          width: 26px; height: 26px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 50%;
          cursor: pointer;
          display: grid;
          place-items: center;
          color: var(--text-strong);
          box-shadow: 0 2px 6px rgba(0,0,0,.08);
          z-index: 101;
          transition: background .2s, color .2s, transform .2s, border-color .2s;
        }
        .app-sidebar__toggle:hover {
          background: var(--green-600);
          color: #fff;
          border-color: var(--green-600);
          transform: scale(1.1);
        }

        /* === MAIN === */
        .app-main {
          flex: 1;
          margin-left: 272px;
          min-height: 100vh;
          background: var(--bg-app);
          transition: margin-left .3s var(--ease);
        }
        .app-main[data-collapsed] { margin-left: 80px; }

        /* ==================================================================
           HEADER — professional left side with role badge + page title
           ================================================================== */
        .app-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg-header);
          backdrop-filter: saturate(180%) blur(10px);
          -webkit-backdrop-filter: saturate(180%) blur(10px);
          padding: 12px 32px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          min-height: 64px;
        }
        .app-header__left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .app-header__title-wrap {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .app-header__title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-strong);
          margin: 0;
          letter-spacing: -.25px;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .app-header__subtitle {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-muted);
          margin: 2px 0 0;
          letter-spacing: -.1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .app-header__right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        /* === ROLE BADGE === */
        .app-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
          border: 1px solid transparent;
          flex-shrink: 0;
          line-height: 1;
        }
        .app-role-badge.is-admin {
          background: rgba(139,92,246,.12);
          color: #7c3aed;
          border-color: rgba(139,92,246,.28);
        }
        .app-role-badge.is-organizer {
          background: rgba(59,130,246,.12);
          color: #1d4ed8;
          border-color: rgba(59,130,246,.28);
        }
        .app-role-badge.is-user {
          background: rgba(34,197,94,.12);
          color: #15803d;
          border-color: rgba(34,197,94,.28);
        }

        /* === PROFILE === */
        .app-profile { position: relative; }
        .app-profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 12px 5px 5px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 24px;
          cursor: pointer;
          font-family: inherit;
          transition: background .2s var(--ease), border-color .2s var(--ease);
        }
        .app-profile-btn:hover { background: var(--tint-1); }
        .app-profile-btn.is-open {
          background: var(--tint-1);
          border-color: var(--green-300);
        }
        .app-profile-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #15803d);
          display: grid; place-items: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(34,197,94,.3);
        }
        .app-profile-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-strong);
        }
        .app-profile-chevron {
          color: var(--text-muted);
          transition: transform .2s var(--ease);
        }
        .app-profile-chevron.is-open { transform: rotate(180deg); }

        /* === DROPDOWN === */
        .app-profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 260px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.06);
          padding: 8px;
          z-index: 1000;
          animation: profileSlideDown .2s var(--ease-out);
        }
        .app-profile-dropdown__head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 12px 14px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 6px;
        }
        .app-profile-dropdown__avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #15803d);
          display: grid; place-items: center;
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }
        .app-profile-dropdown__meta { overflow: hidden; }
        .app-profile-dropdown__name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-strong);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .app-profile-dropdown__email {
          font-size: 12px;
          color: var(--text-muted);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .app-profile-dropdown__divider {
          height: 1px;
          background: var(--border);
          margin: 6px 0;
        }
        .app-profile-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-strong);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background .15s var(--ease), color .15s var(--ease);
        }
        .app-profile-item:hover {
          background: var(--tint-1);
          color: var(--green-700);
        }
        .app-profile-dropdown__logout { color: #ef4444; }
        .app-profile-dropdown__logout:hover {
          background: var(--pill-danger-bg);
          color: #ef4444;
        }

        /* === MAIN CONTENT === */
        .app-content {
          padding: 28px 32px;
          background: var(--bg-app);
          min-height: calc(100vh - 72px);
        }

        /* === MODAL === */
        .app-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: grid; place-items: center;
          padding: 20px;
          z-index: 9999;
          animation: fadeIn .2s var(--ease-out);
        }
        .app-modal {
          width: 100%;
          max-width: 420px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,.25);
          animation: modalPop .28s var(--ease-pop);
        }
        .app-modal__icon {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: var(--pill-danger-bg);
          display: grid; place-items: center;
          margin: 0 auto 18px;
          border: 2px solid rgba(239,68,68,.28);
        }
        .app-modal__title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-strong);
          margin: 0 0 8px;
          letter-spacing: -.3px;
        }
        .app-modal__text {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.55;
          margin: 0 0 24px;
        }
        .app-modal__actions { display: flex; gap: 10px; }
        .app-btn-cancel {
          flex: 1;
          padding: 11px;
          background: var(--bg-subtle);
          color: var(--text-body);
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background .2s var(--ease);
        }
        .app-btn-cancel:hover { background: var(--border); }
        .app-btn-logout {
          flex: 1;
          padding: 11px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(239,68,68,.3);
          transition: transform .2s var(--ease-out), box-shadow .2s var(--ease-out);
        }
        .app-btn-logout:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239,68,68,.4);
        }

        /* === KEYFRAMES (local) === */
        @keyframes profileSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(.92); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* === MISC === */
        .no-scrollbar::-webkit-scrollbar { width: 0; height: 0; }
        .no-scrollbar { scrollbar-width: none; }

        /* === RESPONSIVE === */
        @media (max-width: 900px) {
          .app-header { padding: 12px 18px; }
          .app-content { padding: 20px 16px; }
          .app-profile-name { display: none; }
          .app-profile-btn { padding: 4px; }
          .app-profile-chevron { display: none; }
          .app-header__subtitle { display: none; }
        }
        @media (max-width: 640px) {
          .app-header__title { font-size: 14px; }
          .app-header__right { gap: 8px; }
          .app-role-badge { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .app-sidebar, .app-main, .nav-item-link,
          .app-sidebar__toggle, .app-logout-btn,
          .app-profile-btn, .app-btn-logout, .app-profile-chevron {
            transition: none !important;
          }
          .app-profile-dropdown, .app-modal, .app-modal-overlay {
            animation: none !important;
          }
        }
      /* ==================================================================
   THEME TOGGLE — matches the header chip style
   ================================================================== */
.app-theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-body);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all .2s var(--ease);
}
.app-theme-toggle:hover {
  background: var(--tint-1);
  border-color: var(--green-400);
  color: var(--green-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(22,163,74,.12);
}
.app-theme-toggle:active {
  transform: translateY(0) scale(.96);
}
.app-theme-toggle:focus-visible {
  outline: 3px solid rgba(34,197,94,.35);
  outline-offset: 2px;
}

/* Dark-mode variant — chip stays readable on dark bg */
body.dark-theme .app-theme-toggle {
  background: rgba(148,163,184,.08);
  border-color: #24312b;
  color: #cbd8d1;
}
body.dark-theme .app-theme-toggle:hover {
  background: rgba(34,197,94,.14);
  border-color: rgba(34,197,94,.45);
  color: #4ade80;
}
      `}</style>

      {/* ============ SIDEBAR ============ */}
      <aside
        className="app-sidebar no-scrollbar"
        data-collapsed={!isSidebarOpen || undefined}
      >
        {/* --- UI: brand (FIXED — no more duplicate "Track") --- */}
        <div className="app-sidebar__brand">
          <div className="app-sidebar__logo">
            <Leaf size={21} color="#ffffff" strokeWidth={2.5} />
          </div>
          {isSidebarOpen && (
            <span className="app-sidebar__brandname">
              {brandHead}
              {brandTail && (
                <span className="app-sidebar__brandname-accent">{brandTail}</span>
              )}
            </span>
          )}
        </div>

        {/* --- UI: nav sections --- */}
        <nav className="app-sidebar__nav">
          {navSections.map((section) => (
            <div key={section.label} className="app-sidebar__section">
              {isSidebarOpen && (
                <div className="app-sidebar__sectionlabel">{section.label}</div>
              )}

              {section.items.map((item) => {
                const active = isItemActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item-link ${active ? 'active' : ''}`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon
                      size={19}
                      strokeWidth={active ? 2.6 : 2}
                      style={{ flexShrink: 0 }}
                    />
                    {isSidebarOpen && (
                      <span className="nav-item-link__label">{item.label}</span>
                    )}
                    {isSidebarOpen && active && (
                      <span className="nav-item-link__indicator" aria-hidden="true" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* --- UI: logout + copyright --- */}
        <div className="app-sidebar__footer">
          <button onClick={requestLogout} className="app-logout-btn">
            <LogOut size={19} strokeWidth={2.2} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>{t('nav.logout')}</span>}
          </button>
          {isSidebarOpen && (
            <div className="app-sidebar__copyright">
              © {currentYear} {fullBrand}
            </div>
          )}
        </div>

        {/* --- UI: collapse toggle --- */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="app-sidebar__toggle"
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? <X size={13} /> : <Menu size={13} />}
        </button>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="app-main" data-collapsed={!isSidebarOpen || undefined}>
        <header className="app-header">

          {/* --- UI: professional left — role badge + title + subtitle --- */}
          <div className="app-header__left">
            <span className={`app-role-badge ${roleMeta.cls}`}>
              <roleMeta.Icon size={12} strokeWidth={2.6} />
              {roleMeta.label}
            </span>
            <div className="app-header__title-wrap">
              <h2 className="app-header__title">{getPageTitle()}</h2>
              <p className="app-header__subtitle">
                {userRole === 'admin'
                  ? 'Manage users, activities & platform settings'
                  : userRole === 'organizer'
                  ? 'Manage your organization and team'
                  : `Welcome back, ${userName}`}
              </p>
            </div>
          </div>

          <div className="app-header__right">
  <ThemeToggle />
  <LanguageSelector />
  <NotificationBell />

            {/* --- UI: profile dropdown --- */}
            <div className="app-profile" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`app-profile-btn ${profileOpen ? 'is-open' : ''}`}
              >
                <div className="app-profile-avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="app-profile-name">{userName}</span>
                <ChevronDown
                  size={14}
                  className={`app-profile-chevron ${profileOpen ? 'is-open' : ''}`}
                />
              </button>

              {profileOpen && (
                <div className="app-profile-dropdown">
                  <div className="app-profile-dropdown__head">
                    <div className="app-profile-dropdown__avatar">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="app-profile-dropdown__meta">
                      <div className="app-profile-dropdown__name">{userName}</div>
                      <div className="app-profile-dropdown__email">
                        {userEmail || (userRole === 'admin' ? 'Administrator' : userRole === 'organizer' ? 'Organizer' : 'User')}
                      </div>
                    </div>
                  </div>

                  <ProfileItem
                    icon={<User size={16} />}
                    label={t('nav.profile') || 'Profile'}
                    onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                  />
                  <ProfileItem
                    icon={<Settings size={16} />}
                    label={t('nav.settings') || 'Settings'}
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(userRole === 'admin' ? '/admin/settings' : userRole === 'organizer' ? '/organizer/settings' : '/settings');
                    }}
                  />
                  <ProfileItem
                    icon={<MessageCircle size={16} />}
                    label={t('nav.support') || 'Support'}
                    onClick={() => { setProfileOpen(false); navigate('/support'); }}
                  />

                  <div className="app-profile-dropdown__divider" />

                  <button
                    onClick={requestLogout}
                    className="app-profile-item app-profile-dropdown__logout profile-dropdown-item"
                  >
                    <LogOut size={16} />
                    {t('nav.logout') || 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>

      {/* ============ LOGOUT CONFIRMATION ============ */}
      {showLogoutConfirm && (
        <div
          className="app-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="app-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-modal__icon">
              <AlertTriangle size={28} color="#dc2626" />
            </div>

            <h2 className="app-modal__title">
              {t('logoutConfirm.title') || 'Log out of CarbonTrack?'}
            </h2>

            <p className="app-modal__text">
              {t('logoutConfirm.message') || "You'll need to sign in again to access your dashboard and continue tracking your carbon footprint."}
            </p>

            <div className="app-modal__actions">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="app-btn-cancel"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={performLogout}
                className="app-btn-logout"
              >
                <LogOut size={16} />
                {t('nav.logout') || 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ CHAT ============ */}
      {localStorage.getItem('token') && (
        <>
          <ChatFloatingButton />
          <ChatPopup />
        </>
      )}
    </div>
  );
};

// ============ Profile Dropdown Item ============
const ProfileItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="app-profile-item profile-dropdown-item"
  >
    {icon}
    {label}
  </button>
);

export default Layout;