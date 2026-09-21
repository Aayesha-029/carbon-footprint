import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Award, Plus, Trash2, RefreshCw, Users, Trophy,
  Check, X, AlertCircle, Eye, Search, Bell, AlertTriangle
} from 'lucide-react';

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const styles = {
    success: { background: 'var(--pill-success-bg)', border: '1px solid var(--tint-border)', color: 'var(--pill-success-fg)', icon: <Check size={20} /> },
    error:   { background: 'var(--pill-danger-bg)',  border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)',  icon: <X size={20} /> },
    info:    { background: 'var(--pill-info-bg)',    border: '1px solid rgba(59,130,246,.28)', color: 'var(--pill-info-fg)',   icon: <AlertCircle size={20} /> },
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '16px 24px', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.15)',
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 320, maxWidth: 500,
      animation: 'slideInRight .4s var(--ease-out)', ...style,
    }}>
      {style.icon}
      <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const AdminBadges = () => {
  const { t } = useLanguage();
  const [badges, setBadges] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({ userId: '', badgeType: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, userId: null, name: '' });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const getBadgeIcon = (badgeType) => {
    const icons = {
      'FIRST_STEP': '🌱', 'COMMUTER': '🚗', 'ENERGY_SAVER': '💡', 'FOOD_EXPLORER': '🍽️',
      'SMART_SHOPPER': '🛍️', 'GREEN_WARRIOR': '🏅', 'EARTH_HERO': '🌍', 'ECO_EXPERT': '⭐',
      'DEDICATED': '📊', 'CARBON_MASTER': '🏆'
    };
    return icons[badgeType] || '🏅';
  };

  const getBadgeColor = (badgeType) => {
    const colors = {
      'FIRST_STEP': '#22c55e', 'COMMUTER': '#22c55e', 'ENERGY_SAVER': '#3b82f6',
      'FOOD_EXPLORER': '#f59e0b', 'SMART_SHOPPER': '#8b5cf6', 'GREEN_WARRIOR': '#22c55e',
      'EARTH_HERO': '#15803d', 'ECO_EXPERT': '#3b82f6', 'DEDICATED': '#f59e0b',
      'CARBON_MASTER': '#8b5cf6'
    };
    return colors[badgeType] || '#64748b';
  };

  const getBadgeName = (badgeType) => {
    const names = {
      'FIRST_STEP': t('badges.firstStep'), 'COMMUTER': t('badges.commuter'),
      'ENERGY_SAVER': t('badges.energySaver'), 'FOOD_EXPLORER': t('badges.foodExplorer'),
      'SMART_SHOPPER': t('badges.smartShopper'), 'GREEN_WARRIOR': t('badges.greenWarrior'),
      'EARTH_HERO': t('badges.earthHero'), 'ECO_EXPERT': t('badges.ecoExpert'),
      'DEDICATED': t('badges.dedicatedTracker'), 'CARBON_MASTER': t('badges.carbonMaster')
    };
    return names[badgeType] || badgeType;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const usersResponse = await axiosClient.get('/auth/users');
      const usersList = usersResponse.data.users || [];
      setUsers(usersList);

      let allBadges = [];
      for (const user of usersList) {
        try {
          const badgesResponse = await axiosClient.get(`/badges/user/${user.id}`);
          const userBadges = badgesResponse.data || [];
          userBadges.forEach(b => {
            b.userName = user.fullName;
            b.userId = user.id;
            b.badgeDisplayName = getBadgeName(b.badgeType);
          });
          allBadges = [...allBadges, ...userBadges];
        } catch (e) {}
      }
      setBadges(allBadges);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmDelete({ show: false, id: null, userId: null, name: '' });
    };
    if (confirmDelete.show) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete.show]);

  const handleAssignBadge = async (e) => {
    e.preventDefault();
    if (!assignData.userId || !assignData.badgeType) {
      showToast('error', 'Please select a user and badge type');
      return;
    }

    try {
      const selectedUser = users.find(u => u.id === parseInt(assignData.userId));
      const badgeName = getBadgeName(assignData.badgeType);

      const response = await axiosClient.post('/badges/assign', {
        userId: parseInt(assignData.userId),
        badgeType: assignData.badgeType
      });

      if (response.data.success) {
        showToast('success', `✅ ${badgeName} ${t('admin.badges.assignedTo')} ${selectedUser?.fullName || 'user'}!`);
        window.dispatchEvent(new Event('badgeAssigned'));
        window.dispatchEvent(new Event('notificationReceived'));
        setShowAssignModal(false);
        setAssignData({ userId: '', badgeType: '' });
        await loadData();
      } else {
        showToast('error', response.data.error || 'Failed to assign badge');
      }
    } catch (error) {
      console.error('Error assigning badge:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        showToast('error', t('admin.badges.unauthorized'));
      } else if (error.response?.status === 400) {
        showToast('error', error.response.data?.error || 'Badge may already be assigned to this user');
      } else {
        showToast('error', t('common.error'));
      }
    }
  };

  const requestDeleteBadge = (id, userId, name) => setConfirmDelete({ show: true, id, userId, name });
  const closeConfirmDelete = () => setConfirmDelete({ show: false, id: null, userId: null, name: '' });

  const executeDeleteBadge = async () => {
    const { id, userId } = confirmDelete;
    if (!id || !userId) return;

    try {
      await axiosClient.delete(`/badges/${id}/user/${userId}`);
      showToast('success', `✅ ${confirmDelete.name} ${t('admin.badges.deleted')}`);
      window.dispatchEvent(new Event('badgeDeleted'));
      window.dispatchEvent(new Event('notificationReceived'));
      await loadData();
    } catch (error) {
      console.error('Error deleting badge:', error);
      showToast('error', t('common.error'));
    } finally {
      closeConfirmDelete();
    }
  };

  const badgeTypes = [
    { value: 'FIRST_STEP', label: t('badges.firstStep'), icon: '🌱' },
    { value: 'COMMUTER', label: t('badges.commuter'), icon: '🚗' },
    { value: 'ENERGY_SAVER', label: t('badges.energySaver'), icon: '💡' },
    { value: 'FOOD_EXPLORER', label: t('badges.foodExplorer'), icon: '🍽️' },
    { value: 'SMART_SHOPPER', label: t('badges.smartShopper'), icon: '🛍️' },
    { value: 'GREEN_WARRIOR', label: t('badges.greenWarrior'), icon: '🏅' },
    { value: 'EARTH_HERO', label: t('badges.earthHero'), icon: '🌍' },
    { value: 'ECO_EXPERT', label: t('badges.ecoExpert'), icon: '⭐' },
    { value: 'DEDICATED', label: t('badges.dedicatedTracker'), icon: '📊' },
    { value: 'CARBON_MASTER', label: t('badges.carbonMaster'), icon: '🏆' },
  ];

  const filteredBadges = badges.filter(b =>
    b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.badgeType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.badgeDisplayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout userRole="admin">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="admin">
      <Toast type={toast.type} message={toast.message} onClose={hideToast} />

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Award size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.badges.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {badges.length} {t('admin.badges.badgesAssigned')} · {new Set(badges.map(b => b.userId)).size} {t('admin.badges.users')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero-ghost" onClick={loadData}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
              <button className="ui-btn ui-btn--hero" onClick={() => setShowAssignModal(true)}>
                <Plus size={16} />
                {t('admin.badges.assign')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="ui-grid ui-grid--4" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Award size={20} /></div>
            </div>
            <div className="ui-stat__value">{badges.length}</div>
            <div className="ui-stat__label">{t('admin.badges.totalBadges')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Trophy size={20} /></div>
            </div>
            <div className="ui-stat__value">{badgeTypes.length}</div>
            <div className="ui-stat__label">{t('admin.badges.badgeTypes')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Users size={20} /></div>
            </div>
            <div className="ui-stat__value">{new Set(badges.map(b => b.userId)).size}</div>
            <div className="ui-stat__label">{t('admin.badges.usersWithBadges')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Bell size={20} /></div>
            </div>
            <div className="ui-stat__value">{users.length > 0 ? (badges.length / users.length).toFixed(1) : 0}</div>
            <div className="ui-stat__label">{t('admin.badges.avgBadges')}</div>
          </div>
        </div>

        {/* --- UI: search --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('admin.badges.searchBadges')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ui-input"
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredBadges.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Award size={28} /></div>
              <p className="ui-state__title">{t('admin.badges.noBadges')}</p>
              <p className="ui-state__text">
                {badges.length === 0 ? t('admin.badges.noBadgesAssigned') : t('admin.badges.tryAdjusting')}
              </p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('admin.badges.badge')}</th>
                    <th>{t('admin.badges.type')}</th>
                    <th>{t('admin.badges.assignedTo')}</th>
                    <th>{t('admin.badges.date')}</th>
                    <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBadges.map((badge) => (
                    <tr key={badge.id}>
                      <td style={{ fontSize: 28 }}>{getBadgeIcon(badge.badgeType)}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          background: getBadgeColor(badge.badgeType) + '20',
                          color: getBadgeColor(badge.badgeType),
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {badge.badgeDisplayName || badge.badgeType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>
                        {badge.userName || 'Unknown User'}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => requestDeleteBadge(badge.id, badge.userId, badge.badgeDisplayName || badge.badgeType)}
                          className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                          style={{ color: 'var(--pill-danger-fg)' }}
                          title={t('common.delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- UI: assign badge modal --- */}
      {showAssignModal && (
        <div className="app-confirm-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ui-card__head" style={{ marginBottom: 20 }}>
              <h2 className="ui-card__title">{t('admin.badges.assignBadge')}</h2>
              <button className="ui-modal__close" onClick={() => setShowAssignModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAssignBadge}>
              <div className="ui-field">
                <label className="ui-field__label">{t('admin.badges.selectUser')}</label>
                <select
                  value={assignData.userId}
                  onChange={(e) => setAssignData({ ...assignData, userId: e.target.value })}
                  className="ui-select"
                  required
                >
                  <option value="">{t('admin.badges.selectUser')}...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.fullName} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('admin.badges.badgeType')}</label>
                <select
                  value={assignData.badgeType}
                  onChange={(e) => setAssignData({ ...assignData, badgeType: e.target.value })}
                  className="ui-select"
                  required
                >
                  <option value="">{t('admin.badges.selectBadge')}...</option>
                  {badgeTypes.map(badge => (
                    <option key={badge.value} value={badge.value}>
                      {badge.icon} {badge.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg">
                  {t('admin.badges.assign')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="ui-btn ui-btn--secondary ui-btn--lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UI: delete confirmation modal --- */}
      {confirmDelete.show && (
        <div className="app-confirm-overlay" onClick={closeConfirmDelete}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>
            <h2 className="app-confirm__title">Delete this badge?</h2>
            <p className="app-confirm__text">
              <strong>{confirmDelete.name}</strong> will be removed from this user. This action cannot be undone.
            </p>
            <div className="app-confirm__actions">
              <button type="button" className="app-confirm__cancel" onClick={closeConfirmDelete}>Cancel</button>
              <button type="button" className="app-confirm__danger" onClick={executeDeleteBadge}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .assign-modal {
          width: 100%; max-width: 500px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
        }

        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes confirmPop { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }

        .app-confirm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          background: rgba(6, 20, 12, .55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: overlayFade .2s var(--ease) both;
        }
        .app-confirm {
          width: 100%; max-width: 420px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px 24px 22px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
        }
        .app-confirm__icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--pill-danger-bg);
          display: grid; place-items: center;
          margin: 0 auto 18px;
          border: 2px solid rgba(239,68,68,.28);
        }
        .app-confirm__title { font-size: 20px; font-weight: 700; color: var(--text-strong); margin: 0 0 8px; letter-spacing: -.3px; }
        .app-confirm__text { font-size: 14px; color: var(--text-muted); line-height: 1.55; margin: 0 0 22px; }
        .app-confirm__text strong { color: var(--text-strong); font-weight: 700; }
        .app-confirm__actions { display: flex; gap: 10px; }
        .app-confirm__cancel, .app-confirm__danger {
          flex: 1; padding: 11px 16px;
          border-radius: 10px; font-family: inherit;
          font-size: 14px; font-weight: 600;
          cursor: pointer; border: none;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: transform .2s var(--ease-out), box-shadow .2s var(--ease-out), background .2s var(--ease);
        }
        .app-confirm__cancel { background: var(--bg-subtle); color: var(--text-body); }
        .app-confirm__cancel:hover { background: var(--border); transform: translateY(-1px); }
        .app-confirm__danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; box-shadow: 0 4px 14px rgba(239,68,68,.3); }
        .app-confirm__danger:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239,68,68,.4); }

        @media (max-width: 1024px) { .ui-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-grid--4 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default AdminBadges;