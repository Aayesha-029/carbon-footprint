import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Activity, Search, RefreshCw, Filter, Calendar,
  Download, Trash2, Eye, ChevronDown, ChevronUp,
  AlertCircle, Check, X, AlertTriangle
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
    error: { background: 'var(--pill-danger-bg)', border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)', icon: <X size={20} /> },
    info: { background: 'var(--pill-info-bg)', border: '1px solid rgba(59,130,246,.28)', color: 'var(--pill-info-fg)', icon: <AlertCircle size={20} /> }
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '16px 24px', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.15)',
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 320, maxWidth: 500,
      animation: 'slideInRight .4s var(--ease-out)', ...style
    }}>
      {style.icon}
      <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const AdminActivities = () => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, userId: null });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const loadActivities = async () => {
    setLoading(true);
    try {
      const usersResponse = await axiosClient.get('/auth/users');
      const users = usersResponse.data.users || [];

      let allActivities = [];
      for (const user of users) {
        try {
          const response = await axiosClient.get(`/activities/user/${user.id}`);
          const userActivities = response.data || [];
          userActivities.forEach(act => {
            act.userName = user.fullName;
            act.userId = user.id;
          });
          allActivities = [...allActivities, ...userActivities];
        } catch (e) {
          // User has no activities
        }
      }

      setActivities(allActivities);
      setFilteredActivities(allActivities);
      const usersList = [...new Set(allActivities.map(a => a.userName))].filter(Boolean);
      setUniqueUsers(usersList);
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('error', 'Failed to load activities');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, searchTerm, filterCategory, filterUser, dateFilter]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmDelete({ show: false, id: null, userId: null });
    };
    if (confirmDelete.show) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete.show]);

  const applyFilters = () => {
    let filtered = [...activities];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.userName?.toLowerCase().includes(term) ||
        a.activityType?.toLowerCase().includes(term) ||
        a.category?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }

    if (filterUser !== 'all') {
      filtered = filtered.filter(a => a.userName === filterUser);
    }

    if (dateFilter) {
      filtered = filtered.filter(a => a.logDate === dateFilter);
    }

    setFilteredActivities(filtered);
  };

  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
  };

  const requestDeleteActivity = (id, userId) => {
    setConfirmDelete({ show: true, id, userId });
  };

  const closeConfirmDelete = () => setConfirmDelete({ show: false, id: null, userId: null });

  const executeDeleteActivity = async () => {
    const { id, userId } = confirmDelete;
    if (!id || !userId) return;
    try {
      await axiosClient.delete(`/activities/${id}/user/${userId}`);
      showToast('success', `✅ ${t('activity.deleted')}`);
      await loadActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      showToast('error', t('common.error'));
    } finally {
      closeConfirmDelete();
    }
  };

  const handleExportCSV = () => {
    if (filteredActivities.length === 0) {
      showToast('error', 'No activities to export');
      return;
    }

    try {
      const headers = [t('admin.activities.user'), t('common.category'), t('activity.activityType'),
                       t('activity.quantity'), t('activity.unit'), 'CO₂e (kg)', t('common.date'), t('activity.notes')];

      const rows = filteredActivities.map(a => [
        a.userName || 'Unknown',
        a.category || '',
        a.activityType || '',
        a.quantity || '',
        a.unit || '',
        parseFloat(a.co2eKg || 0).toFixed(2),
        a.logDate || '',
        (a.notes || '').replace(/,/g, ';')
      ]);

      let csvContent = '\uFEFF';
      csvContent += headers.join(',') + '\n';

      rows.forEach(row => {
        const escapedRow = row.map(field => {
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        });
        csvContent += escapedRow.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `activities_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('success', `✅ ${filteredActivities.length} ${t('activity.totalActivities')} ${t('admin.activities.exported')}!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('error', 'Failed to export CSV');
    }
  };

  const categories = ['all', 'Transport', 'Electricity', 'Food', 'Shopping'];
  const totalCO2 = filteredActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

  const getCategoryColor = (category) => {
    const colors = { 'Transport': '#22c55e', 'Electricity': '#3b82f6', 'Food': '#f59e0b', 'Shopping': '#8b5cf6' };
    return colors[category] || '#64748b';
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'Transport': return t('activity.transport');
      case 'Electricity': return t('activity.electricity');
      case 'Food': return t('activity.food');
      case 'Shopping': return t('activity.shopping');
      default: return category;
    }
  };

  const getCategoryPillStyle = (category) => {
    switch (category) {
      case 'Transport':   return { background: 'rgba(34,197,94,.14)',  color: '#15803d', borderColor: 'rgba(34,197,94,.28)' };
      case 'Electricity': return { background: 'rgba(59,130,246,.14)', color: '#1d4ed8', borderColor: 'rgba(59,130,246,.28)' };
      case 'Food':        return { background: 'rgba(245,158,11,.14)', color: '#b45309', borderColor: 'rgba(245,158,11,.28)' };
      case 'Shopping':    return { background: 'rgba(139,92,246,.14)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,.28)' };
      default:            return { background: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', borderColor: 'var(--border)' };
    }
  };

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
              <div className="ui-hero__icon"><Activity size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.activities.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {filteredActivities.length} {t('activity.totalActivities')} • {totalCO2.toFixed(2)} kg CO₂e
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero-ghost" onClick={handleExportCSV}>
                <Download size={16} />
                {t('admin.activities.export')}
              </button>
              <button className="ui-btn ui-btn--hero" onClick={loadActivities}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="admin-acts-stats" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Activity size={20} /></div>
            </div>
            <div className="ui-stat__value">{filteredActivities.length}</div>
            <div className="ui-stat__label">{t('admin.activities.total')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><AlertCircle size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalCO2.toFixed(2)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('admin.activities.totalCO2')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Filter size={20} /></div>
            </div>
            <div className="ui-stat__value">{uniqueUsers.length}</div>
            <div className="ui-stat__label">{t('admin.activities.uniqueUsers')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Activity size={20} /></div>
            </div>
            <div className="ui-stat__value">
              {filteredActivities.length > 0 ? (totalCO2 / filteredActivities.length).toFixed(2) : 0}
              <span style={{ fontSize: 14, marginLeft: 4 }}>kg</span>
            </div>
            <div className="ui-stat__label">{t('admin.activities.avgCO2')}</div>
          </div>
        </div>

        {/* --- UI: filters --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('admin.activities.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ui-input"
                style={{ paddingLeft: 40 }}
              />
            </div>
            <div style={{ minWidth: 150 }}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="ui-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? t('admin.activities.allCategories') : getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 150 }}>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('admin.activities.allUsers')}</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 150 }}>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="ui-input"
                placeholder="Filter by date"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="ui-btn ui-btn--danger ui-btn--sm"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredActivities.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Activity size={28} /></div>
              <p className="ui-state__title">{t('admin.activities.noActivities')}</p>
              <p className="ui-state__text">
                {activities.length === 0 ? t('admin.activities.noActivitiesLogged') : t('admin.activities.tryAdjusting')}
              </p>
            </div>
          ) : (
            <>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>{t('admin.activities.user')}</th>
                      <th>{t('common.category')}</th>
                      <th>{t('activity.activityType')}</th>
                      <th style={{ textAlign: 'right' }}>{t('activity.quantity')}</th>
                      <th style={{ textAlign: 'right' }}>CO₂e</th>
                      <th>{t('common.date')}</th>
                      <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((act, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{act.userName}</td>
                        <td>
                          <span className="ui-pill" style={getCategoryPillStyle(act.category)}>
                            <span className="ui-pill__dot" />
                            {getCategoryLabel(act.category)}
                          </span>
                        </td>
                        <td>{act.activityType}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {act.quantity} {act.unit}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                          {parseFloat(act.co2eKg || 0).toFixed(2)} kg
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{act.logDate}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleViewActivity(act)}
                              className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                              style={{ color: '#3b82f6' }}
                              title={t('admin.activities.viewDetails')}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => requestDeleteActivity(act.id, act.userId)}
                              className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                              style={{ color: 'var(--pill-danger-fg)' }}
                              title={t('common.delete')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{
                      background: 'var(--tint-1)',
                      borderTop: '2px solid var(--green-600)',
                    }}>
                      <td colSpan="4" style={{ padding: '14px 16px', textAlign: 'right', fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>
                        {t('history.totalEmissions')}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 16, fontWeight: 800, color: 'var(--green-700)', textAlign: 'right' }}>
                        {totalCO2.toFixed(2)} kg
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                        {filteredActivities.length} {t('activity.totalActivities')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        {/* --- UI: activity detail modal --- */}
        {showDetailModal && selectedActivity && (
          <div className="app-confirm-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-card__head" style={{ marginBottom: 20 }}>
                <h2 className="ui-card__title">{t('admin.activities.activityDetails')}</h2>
                <button className="ui-modal__close" onClick={() => setShowDetailModal(false)} aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p className="ui-eyebrow">{t('admin.activities.user')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedActivity.userName}</p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('common.category')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{getCategoryLabel(selectedActivity.category)}</p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('activity.activityType')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedActivity.activityType}</p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('activity.quantity')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedActivity.quantity} {selectedActivity.unit}</p>
                </div>
                <div>
                  <p className="ui-eyebrow">CO₂e</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--green-700)', margin: '4px 0 0' }}>{selectedActivity.co2eKg} kg</p>
                </div>
                <div>
                  <p className="ui-eyebrow">{t('common.date')}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedActivity.logDate}</p>
                </div>
                {selectedActivity.notes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="ui-eyebrow">{t('activity.notes')}</p>
                    <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedActivity.notes}</p>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    requestDeleteActivity(selectedActivity.id, selectedActivity.userId);
                    setShowDetailModal(false);
                  }}
                  className="ui-btn ui-btn--danger ui-btn--block ui-btn--lg"
                >
                  <Trash2 size={18} />
                  {t('common.delete')}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="ui-btn ui-btn--secondary ui-btn--block ui-btn--lg"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- UI: delete confirmation modal --- */}
      {confirmDelete.show && (
        <div className="app-confirm-overlay" onClick={closeConfirmDelete}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>
            <h2 className="app-confirm__title">Delete this activity?</h2>
            <p className="app-confirm__text">This action cannot be undone.</p>
            <div className="app-confirm__actions">
              <button type="button" className="app-confirm__cancel" onClick={closeConfirmDelete}>Cancel</button>
              <button type="button" className="app-confirm__danger" onClick={executeDeleteActivity}>
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

        .admin-acts-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }

        .user-detail-modal {
          width: 100%; max-width: 560px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
          max-height: 90vh; overflow-y: auto;
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

        @media (max-width: 1024px) { .admin-acts-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .admin-acts-stats { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default AdminActivities;