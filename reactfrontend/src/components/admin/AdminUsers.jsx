import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Users, Search, RefreshCw, UserPlus,
  Shield, User, CheckCircle, XCircle,
  Trash2, Edit, Eye, Filter, Mail, AlertTriangle
} from 'lucide-react';

const AdminUsers = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/auth/users');
      const usersList = response.data.users || [];

      const stats = {};
      for (const user of usersList) {
        try {
          const activitiesRes = await axiosClient.get(`/activities/user/${user.id}`);
          const activities = activitiesRes.data || [];
          const totalCO2 = activities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

          const badgesRes = await axiosClient.get(`/badges/user/${user.id}`);
          const badges = badgesRes.data || [];

          stats[user.id] = {
            activityCount: activities.length,
            totalCO2: Math.round(totalCO2 * 100) / 100,
            badgeCount: badges.length,
          };
        } catch (e) {
          stats[user.id] = { activityCount: 0, totalCO2: 0, badgeCount: 0 };
        }
      }

      setUsers(usersList);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmDelete({ show: false, id: null });
    };
    if (confirmDelete.show) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete.show]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      showToast('success', `${t('admin.users.role')} ${t('common.updated')} ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      showToast('error', t('common.error'));
    }
  };

  const handleStatusToggle = async (userId) => {
    try {
      setUsers(users.map(user =>
        user.id === userId ? { ...user, enabled: !user.enabled } : user
      ));
      showToast('success', `${t('admin.users.status')} ${t('common.updated')}`);
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('error', t('common.error'));
    }
  };

  const requestDeleteUser = (id) => setConfirmDelete({ show: true, id });
  const closeConfirmDelete = () => setConfirmDelete({ show: false, id: null });

  const executeDeleteUser = async () => {
    const userId = confirmDelete.id;
    if (!userId) return;
    try {
      setUsers(users.filter(user => user.id !== userId));
      showToast('success', t('admin.users.deleted'));
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('error', t('common.error'));
    } finally {
      closeConfirmDelete();
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

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
      {toast.message && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? 'var(--pill-danger-bg)' : 'var(--pill-success-bg)',
          color: toast.type === 'error' ? 'var(--pill-danger-fg)' : 'var(--pill-success-fg)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,.28)' : 'var(--tint-border)'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 14, maxWidth: 400, fontWeight: 600,
        }}>
          {toast.message}
        </div>
      )}

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Users size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.users.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {users.length} {t('admin.users.usersRegistered')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadUsers}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: search + filter --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('admin.users.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ui-input"
                style={{ paddingLeft: 40 }}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('admin.users.allRoles')}</option>
                <option value="ADMIN">{t('admin.users.admin')}</option>
                <option value="USER">{t('admin.users.user')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredUsers.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Users size={28} /></div>
              <p className="ui-state__title">{t('admin.users.noUsers')}</p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('common.fullName')}</th>
                    <th>{t('common.email')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.users.role')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.users.status')}</th>
                    <th style={{ textAlign: 'center' }}>{t('activity.totalActivities')}</th>
                    <th style={{ textAlign: 'center' }}>{t('dashboard.totalCO2')}</th>
                    <th style={{ textAlign: 'center' }}>{t('nav.badges')}</th>
                    <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const stats = userStats[user.id] || { activityCount: 0, totalCO2: 0, badgeCount: 0 };
                    return (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{user.fullName}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                        <td style={{ textAlign: 'center' }}>
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="ui-select"
                            style={{
                              padding: '6px 12px', fontSize: 13, minWidth: 90,
                              background: user.role === 'ADMIN' ? 'rgba(34,197,94,.10)' : 'var(--bg-surface)',
                              color: user.role === 'ADMIN' ? 'var(--green-700)' : 'var(--text-strong)',
                              fontWeight: user.role === 'ADMIN' ? 700 : 500,
                            }}
                          >
                            <option value="USER">{t('admin.users.user')}</option>
                            <option value="ADMIN">{t('admin.users.admin')}</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleStatusToggle(user.id)}
                            className={`ui-pill ${user.enabled ? 'ui-pill--success' : 'ui-pill--danger'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            <span className="ui-pill__dot" />
                            {user.enabled ? t('admin.users.active') : t('admin.users.inactive')}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{stats.activityCount}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--green-700)' }}>
                          {stats.totalCO2} kg
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{stats.badgeCount}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleViewUser(user)}
                              className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                              style={{ color: '#3b82f6' }}
                              title={t('admin.users.viewDetails')}
                            >
                              <Eye size={18} />
                            </button>
                            {user.role !== 'ADMIN' && (
                              <button
                                onClick={() => requestDeleteUser(user.id)}
                                className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                                style={{ color: 'var(--pill-danger-fg)' }}
                                title={t('admin.users.delete')}
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- UI: user detail modal --- */}
        {showUserDetail && selectedUser && (
          <div className="app-confirm-overlay" onClick={() => setShowUserDetail(false)}>
            <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-card__head" style={{ marginBottom: 20 }}>
                <h2 className="ui-card__title">{t('admin.users.userDetails')}</h2>
                <button className="ui-modal__close" onClick={() => setShowUserDetail(false)} aria-label="Close">
                  <XCircle size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p className="ui-eyebrow">{t('common.fullName')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedUser.fullName}</p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('common.email')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedUser.email}</p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('admin.users.role')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedUser.role}</p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('admin.users.status')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: selectedUser.enabled ? 'var(--green-700)' : 'var(--pill-danger-fg)', margin: '4px 0 0' }}>
                    {selectedUser.enabled ? t('admin.users.active') : t('admin.users.inactive')}
                  </p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('admin.users.joined')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('activity.totalActivities')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>
                    {userStats[selectedUser.id]?.activityCount || 0}
                  </p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('dashboard.totalCO2')}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--green-700)', margin: '4px 0 0' }}>
                    {userStats[selectedUser.id]?.totalCO2 || 0} kg
                  </p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('nav.badges')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>
                    {userStats[selectedUser.id]?.badgeCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- UI: delete user confirmation modal --- */}
      {confirmDelete.show && (
        <div className="app-confirm-overlay" onClick={closeConfirmDelete}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>
            <h2 className="app-confirm__title">{t('admin.users.confirmDelete')}</h2>
            <p className="app-confirm__text">This action cannot be undone.</p>
            <div className="app-confirm__actions">
              <button type="button" className="app-confirm__cancel" onClick={closeConfirmDelete}>Cancel</button>
              <button type="button" className="app-confirm__danger" onClick={executeDeleteUser}>
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

        .user-detail-modal {
          width: 100%;
          max-width: 560px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
          max-height: 90vh;
          overflow-y: auto;
        }

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

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
        }
      `}</style>
    </Layout>
  );
};

export default AdminUsers;