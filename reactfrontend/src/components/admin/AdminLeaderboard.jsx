import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Trophy, Medal, Crown, Users, RefreshCw,
  Search, Filter, TrendingUp, Award,
  Check, X, AlertCircle
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

const AdminLeaderboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [timeRange, setTimeRange] = useState('all');
  const [error, setError] = useState(null);

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📊 Loading leaderboard with timeRange:', timeRange);
      const response = await axiosClient.get(`/leaderboard?timeRange=${timeRange}`);
      console.log('✅ Leaderboard data:', response.data);
      setUsers(response.data || []);
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);

      if (error.response?.status === 401) {
        showToast('error', 'Session expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      setError('Failed to load leaderboard data. Please try again.');
      showToast('error', 'Failed to load leaderboard');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadLeaderboard();
    }
  }, [timeRange]);

  const filteredUsers = users.filter(user =>
    user.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={20} color="#f59e0b" />;
    if (rank === 2) return <Medal size={20} color="#94a3b8" />;
    if (rank === 3) return <Medal size={20} color="#cd7f32" />;
    return <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{rank}</span>;
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

  const role = localStorage.getItem('userRole');
  if (role !== 'ADMIN') {
    return (
      <Layout userRole="admin">
        <div className="ui-state ui-state--error">
          <div className="ui-state__icon"><AlertCircle size={32} /></div>
          <h2 className="ui-state__title">{t('admin.leaderboard.accessDenied')}</h2>
          <p className="ui-state__text">{t('admin.leaderboard.adminRequired')}</p>
        </div>
      </Layout>
    );
  }

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
              <div className="ui-hero__icon"><Trophy size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('leaderboard.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {users.length} {t('admin.leaderboard.usersRanked')} {timeRange !== 'all' ? `(${timeRange})` : ''}
                </p>
                {error && (
                  <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 13, marginTop: 4, fontWeight: 600 }}>
                    ⚠️ {error}
                  </p>
                )}
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadLeaderboard}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: time range tabs --- */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'weekly', 'monthly', 'yearly'].map((range) => (
            <button
              key={range}
              onClick={() => {
                console.log('🔄 Time range changed to:', range);
                setTimeRange(range);
              }}
              className={`ui-btn ${timeRange === range ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {range === 'all' ? t('common.all') :
               range === 'weekly' ? t('analytics.weekly') :
               range === 'monthly' ? t('analytics.monthly') : t('analytics.yearly')}
            </button>
          ))}
        </div>

        {/* --- UI: search --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('admin.leaderboard.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ui-input"
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredUsers.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Trophy size={28} /></div>
              <p className="ui-state__title">{t('leaderboard.noUsers')}</p>
              <p className="ui-state__text">
                {users.length === 0 ? t('admin.leaderboard.noUsersRegistered') : t('admin.leaderboard.tryAdjusting')}
              </p>
              {users.length === 0 && (
                <div className="ui-state__actions">
                  <button className="ui-btn ui-btn--primary" onClick={loadLeaderboard}>
                    <RefreshCw size={16} />
                    {t('common.retry')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('leaderboard.rank')}</th>
                    <th>{t('leaderboard.user')}</th>
                    <th>{t('leaderboard.badges')}</th>
                    <th>{t('leaderboard.topCategory')}</th>
                    <th style={{ textAlign: 'right' }}>{t('leaderboard.totalCO2')}</th>
                    <th style={{ textAlign: 'right' }}>{t('leaderboard.activities')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.userId}>
                      <td style={{ fontWeight: 'bold' }}>
                        {getRankIcon(user.rank)}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>
                        {user.userName}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {user.badges && user.badges.slice(0, 5).map((badge, index) => (
                            <span
                              key={index}
                              className="ui-pill ui-pill--neutral"
                              style={{ fontSize: 11 }}
                            >
                              {badge.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {user.badges && user.badges.length > 5 && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
                              +{user.badges.length - 5}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="ui-pill" style={getCategoryPillStyle(user.topCategory)}>
                          <span className="ui-pill__dot" />
                          {user.topCategory || 'N/A'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                        {user.totalCO2e} kg
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {user.activityCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
        }
      `}</style>
    </Layout>
  );
};

export default AdminLeaderboard;