import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Calendar, Search, Filter,
  ChevronDown, ChevronUp, Clock,
  Leaf, RefreshCw, AlertCircle,
  CheckCircle, XCircle, X
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
    success: { background: 'var(--pill-success-bg)', border: '1px solid var(--tint-border)', color: 'var(--pill-success-fg)', icon: <CheckCircle size={20} /> },
    error: { background: 'var(--pill-danger-bg)', border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)', icon: <XCircle size={20} /> },
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
      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const ActivityHistory = () => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [totalFilteredCO2, setTotalFilteredCO2] = useState(0);
  const [totalFilteredActivities, setTotalFilteredActivities] = useState(0);

  const categories = ['all', 'Transport', 'Electricity', 'Food', 'Shopping'];

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    return { userId };
  };

  const loadActivities = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get(`/activities/user/${userId}`);
      setActivities(response.data || []);
      setFilteredActivities(response.data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      if (error.response?.status === 401) {
        showToast('error', 'Session expired. Please login again.');
      } else {
        showToast('error', 'Failed to load activities. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, searchTerm, selectedCategory, startDate, endDate, specificDate, sortBy]);

  const applyFilters = () => {
    let filtered = [...activities];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.activityType?.toLowerCase().includes(term) ||
        a.category?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (specificDate) {
      filtered = filtered.filter(a => a.logDate === specificDate);
    }

    if (startDate && !specificDate) {
      filtered = filtered.filter(a => a.logDate >= startDate);
    }
    if (endDate && !specificDate) {
      filtered = filtered.filter(a => a.logDate <= endDate);
    }

    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.logDate) - new Date(b.logDate));
        break;
      case 'co2_desc':
        filtered.sort((a, b) => parseFloat(b.co2eKg || 0) - parseFloat(a.co2eKg || 0));
        break;
      case 'co2_asc':
        filtered.sort((a, b) => parseFloat(a.co2eKg || 0) - parseFloat(b.co2eKg || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
    }

    setFilteredActivities(filtered);
    const totalCO2 = filtered.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
    setTotalFilteredCO2(totalCO2);
    setTotalFilteredActivities(filtered.length);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
    setSpecificDate('');
    setSortBy('date_desc');
    setShowDateFilter(false);
  };

  const handleClearSpecificDate = () => {
    setSpecificDate('');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Transport': '#22c55e',
      'Electricity': '#3b82f6',
      'Food': '#f59e0b',
      'Shopping': '#8b5cf6'
    };
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
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  const totalAllCO2 = activities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

  return (
    <Layout userRole="user">
      <Toast type={toast.type} message={toast.message} onClose={hideToast} />

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Clock size={24} /></div>
              <div className="ui-hero__text">
            <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.activityHistory')}</h1>    
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {t('history.description', activities.length, totalAllCO2.toFixed(2))}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadActivities}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: summary stat cards --- */}
        <div className="ui-grid ui-grid--4" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Clock size={20} /></div>
            </div>
            <div className="ui-stat__value">{activities.length}</div>
            <div className="ui-stat__label">{t('history.totalActivities')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Leaf size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalAllCO2.toFixed(2)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('history.totalCO2')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Filter size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalFilteredActivities}</div>
            <div className="ui-stat__label">{t('history.filteredActivities')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Leaf size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalFilteredCO2.toFixed(2)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('history.filteredCO2')}</div>
          </div>
        </div>

        {/* --- UI: filters card --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={t('history.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ui-input"
                  style={{ paddingLeft: 40 }}
                />
              </div>

              <div style={{ minWidth: 150 }}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="ui-select"
                >
                  <option value="all">{t('history.allCategories')}</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: 150 }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="ui-select"
                >
                  <option value="date_desc">{t('common.latest')}</option>
                  <option value="date_asc">{t('common.oldest')}</option>
                  <option value="co2_desc">{t('history.highestEmissions')}</option>
                  <option value="co2_asc">{t('history.lowestEmissions')}</option>
                </select>
              </div>

              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`ui-btn ${showDateFilter ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
              >
                <Calendar size={16} />
                {t('history.dateFilters')}
                {showDateFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button onClick={handleResetFilters} className="ui-btn ui-btn--danger">
                <Filter size={16} />
                {t('history.resetAll')}
              </button>
            </div>

            {showDateFilter && (
              <div style={{
                display: 'flex', gap: 16, flexWrap: 'wrap',
                padding: 16,
                background: 'var(--bg-subtle)',
                borderRadius: 10,
                border: '1px solid var(--border)',
                alignItems: 'flex-end',
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label className="ui-field__label" style={{ marginBottom: 4, display: 'block' }}>
                    🔍 {t('history.searchByDate')}
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="date"
                      value={specificDate}
                      onChange={(e) => {
                        setSpecificDate(e.target.value);
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="ui-input"
                    />
                    {specificDate && (
                      <button
                        onClick={handleClearSpecificDate}
                        className="ui-btn ui-btn--icon ui-btn--sm ui-btn--danger"
                        aria-label="Clear"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {specificDate && (
                    <span style={{ fontSize: 11, color: 'var(--pill-info-fg)', marginTop: 4, display: 'block', fontWeight: 600 }}>
                      {t('history.showingActivitiesFor')} {specificDate}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 150 }}>
                  <label className="ui-field__label" style={{ marginBottom: 4, display: 'block' }}>{t('history.startDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSpecificDate('');
                    }}
                    disabled={!!specificDate}
                    className="ui-input"
                    style={{ opacity: specificDate ? .5 : 1 }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label className="ui-field__label" style={{ marginBottom: 4, display: 'block' }}>{t('history.endDate')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSpecificDate('');
                    }}
                    disabled={!!specificDate}
                    className="ui-input"
                    style={{ opacity: specificDate ? .5 : 1 }}
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="ui-btn ui-btn--secondary"
                  >
                    {t('history.clearDates')}
                  </button>
                )}
              </div>
            )}

            {/* Active filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {selectedCategory !== 'all' && (
                <span className="ui-pill ui-pill--info">
                  📂 {getCategoryLabel(selectedCategory)}
                  <button onClick={() => setSelectedCategory('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 4 }}>×</button>
                </span>
              )}
              {searchTerm && (
                <span className="ui-pill ui-pill--neutral">
                  🔍 "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 4 }}>×</button>
                </span>
              )}
              {specificDate && (
                <span className="ui-pill ui-pill--warn">
                  📅 {specificDate}
                  <button onClick={handleClearSpecificDate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 4 }}>×</button>
                </span>
              )}
              {(startDate || endDate) && !specificDate && (
                <span className="ui-pill ui-pill--warn">
                  📅 {startDate || '...'} → {endDate || '...'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredActivities.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Leaf size={28} /></div>
              <p className="ui-state__title">{t('history.noActivities')}</p>
              <p className="ui-state__text">
                {activities.length === 0 ? t('history.startLogging') : t('history.tryAdjusting')}
              </p>
            </div>
          ) : (
            <>
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('common.date')}</th>
                      <th>{t('common.category')}</th>
                      <th>{t('activity.activityType')}</th>
                      <th style={{ textAlign: 'right' }}>{t('activity.quantity')}</th>
                      <th style={{ textAlign: 'right' }}>{t('activity.co2eKg')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity, index) => (
                      <tr key={activity.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{activity.logDate}</td>
                        <td>
                          <span className="ui-pill" style={getCategoryPillStyle(activity.category)}>
                            <span className="ui-pill__dot" />
                            {getCategoryLabel(activity.category)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>
                          {activity.activityType}
                          {activity.notes && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', fontStyle: 'italic', fontWeight: 500 }}>
                              {activity.notes}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {activity.quantity} {activity.unit}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-strong)' }}>
                          {parseFloat(activity.co2eKg || 0).toFixed(2)} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{
                      background: 'var(--tint-1)',
                      borderTop: '2px solid var(--green-600)',
                    }}>
                      <td colSpan="5" style={{
                        padding: '14px 16px',
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-strong)',
                        textAlign: 'right',
                      }}>
                        {t('history.totalEmissions')}
                      </td>
                      <td style={{
                        padding: '14px 16px',
                        fontSize: 16,
                        fontWeight: 800,
                        color: 'var(--green-700)',
                        textAlign: 'right',
                      }}>
                        {totalFilteredCO2.toFixed(2)} kg
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('history.showing', filteredActivities.length, activities.length)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('history.filteredCO2Label')}
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-700)', marginLeft: 6 }}>
                    {totalFilteredCO2.toFixed(2)} kg
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .ui-hero__title--module {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.6px;
          line-height: 1.15;
          color: #ffffff;
          margin: 0 0 4px;
        }
        .ui-hero__subtitle--compact {
          font-size: 14.5px;
          font-weight: 500;
          line-height: 1.5;
          color: rgba(255,255,255,.90);
          margin: 0;
          max-width: 62ch;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 1024px) {
          .ui-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .ui-grid--4 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default ActivityHistory;