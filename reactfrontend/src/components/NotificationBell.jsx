import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Bell, Check, X, Trash2, CheckCheck,
  Clock, Award, Target, Activity, RefreshCw,
  AlertCircle, UserPlus, LogIn, Key, Leaf,
  MessageCircle, Users, Settings, FileText,
  Ticket, Send
} from 'lucide-react';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    return { userId };
  };

  const loadNotifications = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const [unreadRes, allRes] = await Promise.all([
        axiosClient.get(`/notifications/user/${userId}/unread`),
        axiosClient.get(`/notifications/user/${userId}`)
      ]);

      const unreadData = unreadRes.data || [];
      const allData = allRes.data || [];

      console.log('📬 Notifications loaded:', allData.length, 'unread:', unreadData.length);
      setUnreadCount(unreadData.length);
      setNotifications(allData);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 15000);

    const handleNewNotification = () => {
      console.log('🔔 Notification event received - refreshing...');
      loadNotifications();
    };

    window.addEventListener('notificationReceived', handleNewNotification);
    window.addEventListener('badgeAssigned', handleNewNotification);
    window.addEventListener('badgeDeleted', handleNewNotification);
    window.addEventListener('goalUpdated', handleNewNotification);
    window.addEventListener('activityLogged', handleNewNotification);
    window.addEventListener('goalCreated', handleNewNotification);
    window.addEventListener('goalDeleted', handleNewNotification);
    window.addEventListener('profileUpdated', handleNewNotification);
    window.addEventListener('ticketCreated', handleNewNotification);
    window.addEventListener('ticketReplied', handleNewNotification);
    window.addEventListener('ticketStatusChanged', handleNewNotification);
    window.addEventListener('ticketResolved', handleNewNotification);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationReceived', handleNewNotification);
      window.removeEventListener('badgeAssigned', handleNewNotification);
      window.removeEventListener('badgeDeleted', handleNewNotification);
      window.removeEventListener('goalUpdated', handleNewNotification);
      window.removeEventListener('activityLogged', handleNewNotification);
      window.removeEventListener('goalCreated', handleNewNotification);
      window.removeEventListener('goalDeleted', handleNewNotification);
      window.removeEventListener('profileUpdated', handleNewNotification);
      window.removeEventListener('ticketCreated', handleNewNotification);
      window.removeEventListener('ticketReplied', handleNewNotification);
      window.removeEventListener('ticketStatusChanged', handleNewNotification);
      window.removeEventListener('ticketResolved', handleNewNotification);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = async () => {
    const { userId } = getCurrentUser();
    if (!userId) return;

    try {
      await axiosClient.post(`/notifications/user/${userId}/mark-all-read`);
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notificationReceived'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAll = async () => {
    const { userId } = getCurrentUser();
    if (!userId) return;

    if (!window.confirm('Are you sure you want to clear all notifications?')) return;

    try {
      await axiosClient.delete(`/notifications/user/${userId}`);
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new Event('notificationReceived'));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ACTIVITY_LOGGED':         return <Activity size={16} color="#3b82f6" />;
      case 'ACTIVITY_DELETED':        return <Trash2 size={16} color="#ef4444" />;
      case 'GOAL_CREATED':            return <Target size={16} color="#f59e0b" />;
      case 'GOAL_DELETED':            return <Target size={16} color="#ef4444" />;
      case 'GOAL_COMPLETED':          return <Award size={16} color="#22c55e" />;
      case 'BADGE_EARNED':            return <Award size={16} color="#8b5cf6" />;
      case 'BADGE_DELETED':           return <Trash2 size={16} color="#ef4444" />;
      case 'NEW_TICKET':              return <Ticket size={16} color="#f59e0b" />;
      case 'TICKET_REPLY':            return <MessageCircle size={16} color="#3b82f6" />;
      case 'TICKET_STATUS_CHANGED':   return <RefreshCw size={16} color="#8b5cf6" />;
      case 'TICKET_ASSIGNED':         return <Users size={16} color="#22c55e" />;
      case 'TICKET_RESOLVED':         return <Check size={16} color="#22c55e" />;
      case 'WELCOME':
      case 'REGISTRATION':            return <UserPlus size={16} color="#22c55e" />;
      case 'LOGIN':                   return <LogIn size={16} color="#3b82f6" />;
      case 'PASSWORD_RESET':          return <Key size={16} color="#f59e0b" />;
      case 'PROFILE_UPDATED':         return <Settings size={16} color="#3b82f6" />;
      default:                        return <Bell size={16} color="#64748b" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ACTIVITY_LOGGED':         return 'rgba(59,130,246,.14)';
      case 'ACTIVITY_DELETED':        return 'rgba(239,68,68,.14)';
      case 'GOAL_CREATED':            return 'rgba(245,158,11,.14)';
      case 'GOAL_DELETED':            return 'rgba(239,68,68,.14)';
      case 'GOAL_COMPLETED':          return 'rgba(34,197,94,.14)';
      case 'BADGE_EARNED':            return 'rgba(139,92,246,.14)';
      case 'BADGE_DELETED':           return 'rgba(239,68,68,.14)';
      case 'NEW_TICKET':              return 'rgba(245,158,11,.14)';
      case 'TICKET_REPLY':            return 'rgba(59,130,246,.14)';
      case 'TICKET_STATUS_CHANGED':   return 'rgba(139,92,246,.14)';
      case 'TICKET_ASSIGNED':         return 'rgba(34,197,94,.14)';
      case 'TICKET_RESOLVED':         return 'rgba(34,197,94,.14)';
      case 'WELCOME':
      case 'REGISTRATION':            return 'rgba(34,197,94,.14)';
      case 'LOGIN':                   return 'rgba(59,130,246,.14)';
      case 'PROFILE_UPDATED':         return 'rgba(59,130,246,.14)';
      default:                        return 'var(--pill-neutral-bg)';
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'ACTIVITY_LOGGED':         return 'rgba(59,130,246,.06)';
      case 'ACTIVITY_DELETED':        return 'rgba(239,68,68,.06)';
      case 'GOAL_CREATED':            return 'rgba(245,158,11,.06)';
      case 'GOAL_DELETED':            return 'rgba(239,68,68,.06)';
      case 'GOAL_COMPLETED':          return 'rgba(34,197,94,.06)';
      case 'BADGE_EARNED':            return 'rgba(139,92,246,.06)';
      case 'BADGE_DELETED':           return 'rgba(239,68,68,.06)';
      case 'NEW_TICKET':              return 'rgba(245,158,11,.06)';
      case 'TICKET_REPLY':            return 'rgba(59,130,246,.06)';
      case 'TICKET_STATUS_CHANGED':   return 'rgba(139,92,246,.06)';
      case 'TICKET_ASSIGNED':         return 'rgba(34,197,94,.06)';
      case 'TICKET_RESOLVED':         return 'rgba(34,197,94,.06)';
      case 'WELCOME':
      case 'REGISTRATION':            return 'rgba(34,197,94,.06)';
      case 'LOGIN':                   return 'rgba(59,130,246,.06)';
      case 'PROFILE_UPDATED':         return 'rgba(59,130,246,.06)';
      default:                        return 'var(--bg-subtle)';
    }
  };

  return (
    <div className="notif-wrap" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
          }
        }}
        className={`notif-btn ${isOpen ? 'is-open' : ''}`}
        aria-label="Notifications"
      >
        <Bell size={20} color={isOpen ? 'var(--green-600)' : 'var(--text-muted)'} />
        {unreadCount > 0 && (
          <span className="notif-btn__badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-dropdown__head">
            <div className="notif-dropdown__title-wrap">
              <Bell size={18} color="var(--green-600)" />
              <span className="notif-dropdown__title">Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-dropdown__count">{unreadCount}</span>
              )}
            </div>
            <div className="notif-dropdown__actions">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="notif-action notif-action--primary"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="notif-action notif-action--danger"
                    title="Clear all"
                  >
                    <Trash2 size={14} />
                    <span>Clear</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="notif-dropdown__body ui-scroll">
            {loading ? (
              <div className="notif-empty">
                <div className="ui-spinner ui-spinner--sm" />
                <p className="notif-empty__sub">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty__icon">
                  <Bell size={28} color="var(--text-muted)" />
                </div>
                <p className="notif-empty__title">No notifications yet</p>
                <p className="notif-empty__sub">
                  You'll see notifications here when you get them
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="notif-item"
                  style={{
                    background: notification.read
                      ? 'transparent'
                      : getNotificationBg(notification.type),
                  }}
                  onClick={() => {
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div
                    className="notif-item__icon"
                    style={{ background: getNotificationColor(notification.type) }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notif-item__body">
                    <div className={`notif-item__title ${notification.read ? '' : 'is-unread'}`}>
                      {notification.title}
                    </div>
                    <div className="notif-item__msg">
                      {notification.message}
                    </div>
                    <div className="notif-item__meta">
                      <Clock size={12} />
                      <span>{notification.timeAgo || 'Just now'}</span>
                      {!notification.read && (
                        <span className="notif-item__dot" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-dropdown__foot">
              <span>
                <strong>{notifications.filter(n => !n.read).length}</strong> unread · {notifications.length} total
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        .notif-wrap { position: relative; }

        /* ---- trigger button ---- */
        .notif-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          transition: background .2s var(--ease), transform .2s var(--ease);
        }
        .notif-btn:hover {
          background: var(--tint-1);
          transform: translateY(-1px);
        }
        .notif-btn.is-open {
          background: var(--tint-1);
        }
        .notif-btn__badge {
          position: absolute;
          top: 2px;
          right: 2px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-surface);
          box-shadow: 0 2px 6px rgba(239,68,68,.35);
          animation: pulseDot 1.4s ease-in-out infinite;
        }

        /* ---- dropdown panel ---- */
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 420px;
          max-width: calc(100vw - 24px);
          max-height: 560px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,.18), 0 6px 16px rgba(0,0,0,.08);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: notifSlideDown .22s var(--ease-out);
        }

        /* ---- header ---- */
        .notif-dropdown__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: var(--bg-subtle);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          gap: 12px;
          flex-wrap: wrap;
        }
        .notif-dropdown__title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .notif-dropdown__title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-strong);
          letter-spacing: -.2px;
        }
        .notif-dropdown__count {
          padding: 2px 9px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }
        .notif-dropdown__actions {
          display: flex;
          gap: 4px;
        }
        .notif-action {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          transition: background .15s var(--ease), color .15s var(--ease);
        }
        .notif-action--primary { color: var(--green-700); }
        .notif-action--primary:hover { background: var(--tint-1); }
        .notif-action--danger  { color: var(--pill-danger-fg); }
        .notif-action--danger:hover { background: var(--pill-danger-bg); }

        /* ---- body ---- */
        .notif-dropdown__body {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .notif-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background .15s var(--ease);
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--bg-subtle); }

        .notif-item__icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .notif-item__body { flex: 1; min-width: 0; }
        .notif-item__title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-strong);
          margin-bottom: 2px;
          line-height: 1.35;
        }
        .notif-item__title.is-unread { font-weight: 800; }
        .notif-item__msg {
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.5;
          word-break: break-word;
        }
        .notif-item__meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .notif-item__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green-500);
          box-shadow: 0 0 0 3px rgba(34,197,94,.18);
          margin-left: 2px;
        }

        /* ---- empty ---- */
        .notif-empty {
          text-align: center;
          padding: 44px 22px;
        }
        .notif-empty__icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--bg-subtle);
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
        }
        .notif-empty__title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-strong);
          margin: 0 0 4px;
        }
        .notif-empty__sub {
          font-size: 12.5px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.5;
        }

        /* ---- footer ---- */
        .notif-dropdown__foot {
          padding: 10px 18px;
          border-top: 1px solid var(--border);
          background: var(--bg-subtle);
          text-align: center;
          font-size: 11.5px;
          color: var(--text-muted);
          font-weight: 500;
          flex-shrink: 0;
        }
        .notif-dropdown__foot strong {
          color: var(--text-strong);
          font-weight: 800;
        }

        /* ---- animations ---- */
        @keyframes notifSlideDown {
          from { opacity: 0; transform: translateY(-8px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseDot {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,.55); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }

        @media (max-width: 720px) {
          .notif-dropdown {
            width: calc(100vw - 24px);
            right: -8px;
          }
          .notif-action span { display: none; }
          .notif-action { padding: 6px; }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;